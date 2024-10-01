import { Socket } from "socket.io";
import { IMatchLoader } from "../interfaces/mission.loader.interface.js";
import logger from "../utils/logger.js";
import { IHero } from "../interfaces/hero.interfaces.js";
import { Mission } from "../models/mission.js";

export class SocketHandler {
  private matchLoader: IMatchLoader;

  constructor(matchLoader: IMatchLoader) {
    this.matchLoader = matchLoader;
  }

  public handleConnection(socket: Socket): void {
    logger.info("a user has connected to mission socket!", socket.id);
    socket.on("startMission", (hero: IHero, missionID: string) =>
      this.handleStartMission(hero, missionID)
    );
    socket.on("getActiveMissions", () => {
      logger.info("Solicitud para obtener misiones activas.");
      socket.emit("activeMissions", Array.from(Mission.defaultMissions()));
    });

    socket.on("disconnect", () =>
      logger.info(`The user ${socket.id} has disconnected.`)
    );
  }

  private async handleStartMission(
    hero: IHero,
    missionID: string
  ): Promise<void> {
    if (hero) await this.matchLoader.startMission(hero, missionID);
    else logger.info("pailangas tangas al intentar iniciar la batalla");
  }
}