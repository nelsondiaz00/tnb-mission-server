import { workerData } from "worker_threads";
import express from "express";
import morgan from "morgan";
import http from "node:http";
import { Server, Socket } from "socket.io";
import logger from "./utils/logger.js";
import { SocketHandler } from "./helper/socket.handler.js";
import { IWorker } from "./interfaces/IWorker.interface.js";

const morganStream = {
  write: (message: string) => logger.info(message.trim()),
};

const { port, idUser } = workerData;

export class MissionWorker implements IWorker {
  private app = express();
  private server = http.createServer(this.app);
  private io: Server;
  private socketHandler: SocketHandler;
  private port: number;

  constructor(port: number, idUser: string) {
    this.io = new Server(this.server, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"],
      },
    });

    this.port = port;
    this.socketHandler = new SocketHandler();
    logger.info(`MatchWorker created with ${idUser} player`);
  }

  public start(): void {
    this.io.on("connection", (socket: Socket) =>
      this.socketHandler.handleConnection(socket, this.port.toString())
    );
    this.app.use(morgan("combined", { stream: morganStream }));
    this.server.listen(this.port, () => {
      logger.info(`Sub-Mission running on port ${this.port}`);
    });
  }
}

const matchInstance = new MissionWorker(port, idUser);
matchInstance.start();
