import { Server } from "socket.io";
import { ITurn } from "../interfaces/turn.interface.js";
import logger from "./logger.js";

export class TurnNotifier {
    private io: Server;

    constructor(io: Server) {
        this.io = io;
    }

    notifyTurn(turn: ITurn, serializedMatch: unknown): void {
        this.io.emit("turnInfo", turn);
        this.io.emit("actualMatch", serializedMatch);
        logger.info(`Turno del héroe con ID: ${turn.idUser}, Side: ${turn.side}`);
    }

    emitMatch(serializedMatch: unknown): void {
        this.io.emit("actualMatch", serializedMatch);
    }
}
