import { parentPort, workerData } from "worker_threads";
import express from "express";
import morgan from "morgan";
import http from "node:http";
import { Server, Socket } from "socket.io";
import logger from "./utils/logger.js";
import { SocketHandler } from "./helper/socket.handler.js";
import { MissionLoader } from "./helper/mission.loader.js";
import { IWorker } from "./interfaces/IWorker.interface.js";

const morganStream = {
  write: (message: string) => logger.info(message.trim()),
};

const { port, idUser } = workerData;

export class MissionWorker implements IWorker {
  private app = express();
  private server = http.createServer(this.app);
  private io: Server;
  private missionLoader: MissionLoader;
  private socketHandler: SocketHandler;
  private port: number;

  constructor(port: number, idUser: string) {
    this.io = new Server(this.server, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"],
      },
    });

    this.missionLoader = new MissionLoader(port.toString(), this.io);

    this.socketHandler = new SocketHandler(this.missionLoader);

    this.port = port;
    logger.info(
      `MatchWorker created with ${idUser} player`
    );
    // GameSettings.setRedPlayers(amountRed);
    // GameSettings.setBluePlayers(amountBlue);
  }

  public start(): void {
    this.io.on("connection", (socket: Socket) =>
      this.socketHandler.handleConnection(socket)
    );
    this.app.use(morgan("combined", { stream: morganStream }));
    this.server.listen(this.port, () => {
      logger.info(`Sub-Mission running on port ${this.port}`);
    });
  }

  getPlayersAmount(): number {
    return this.missionLoader.getHeroCount();
  }
}

const matchInstance = new MissionWorker(port, idUser);
matchInstance.start();

parentPort?.on("message", (msg) => {
  if (msg === "getPlayersAmount") {
    const playersAmount = matchInstance.getPlayersAmount();
    parentPort?.postMessage({ type: "playersAmount", data: playersAmount });
  }
});