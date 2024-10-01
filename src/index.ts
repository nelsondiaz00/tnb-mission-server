import { Worker } from "worker_threads";
import { Server } from "socket.io";
import http from "node:http";
import express from "express";
import logger from "./utils/logger.js";
import dotenv from "dotenv";
dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

const MAIN_SERVER_PORT: number = parseInt(
  process.env["SERVER_MAIN_PORT"] || "8000"
);
const HOST: string = process.env["SERVER_HOST"] || "localhost";

let currentPort: number = MAIN_SERVER_PORT + 1;
// const activeMissions = new Set<any>();
const workers = new Map<number, Worker>();
const userPorts = new Map<string, number>();

io.on("connection", (socket) => {
  logger.info(`Cliente conectado: ${socket.id}`);

  socket.on("initMissionModule", (data) => {
    logger.info(`Solicitud de inicio de módulo recibido: ${data.user}`);

    let missionPort: number;

    if (userPorts.has(data.user)) {
      missionPort = userPorts.get(data.user)!;
    } else {
      missionPort = currentPort++;
      userPorts.set(data.user, missionPort);
    }

    if (!workers.has(missionPort)) {
      const worker = new Worker("./dist/mission.worker.js", {
        workerData: { port: missionPort, idUser: data.user },
      });
      workers.set(missionPort, worker);
    }

    socket.emit("missionPort", { port: missionPort });
  });

  socket.on("getPlayersAmount", (port: number) => {
    const worker = workers.get(port);
    if (worker) {
      worker.postMessage("getPlayersAmount");
      worker.once("message", (message) => {
        if (message.type === "playersAmount") {
          socket.emit("playersAmount", message.data);
          logger.info(`${message.data} jugadores en el puerto ${port}`);
        }
      });
    } else {
      socket.emit("error", `No se encontró un worker para el puerto ${port}`);
    }
  });
});

server.listen(MAIN_SERVER_PORT, HOST, () => {
  console.log(
    `Main mission module server is running on http://${HOST}:${MAIN_SERVER_PORT}`
  );
});
