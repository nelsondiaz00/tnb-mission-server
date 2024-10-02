import { Socket } from "socket.io";
import logger from "../utils/logger.js";
import { IHero } from "../interfaces/hero.interfaces.js";
import { Mission } from "../models/mission.js";
import { MissionLoader } from "./mission.loader.js";
import { Turns } from "./turns.js";
import { teamSide } from "../types/team.type.js";

export class SocketHandler {
  constructor() {}

  public handleConnection(socket: Socket, port: string): void {
    logger.info("a user has connected to mission socket!", socket.id);
    socket.on("startMission", async (hero: IHero, missionID: string) => {
      try {
        const missionLoader = new MissionLoader(port, missionID);
        const turns = new Turns(missionLoader);
        missionLoader.setTurns(turns);

        missionLoader.on("matchEnded", (teamSide: teamSide) => {
          logger.info(`Mission ${missionID} ended, winner: ${teamSide}`);

          socket.emit("matchEnded", { winner: teamSide });
        });

        await this.handleStartMission(hero, missionLoader);
        turns.reset();
        turns.startTurnRotation(missionLoader.getMatch());
      } catch (error) {
        logger.error("Error starting mission: ", error);
      }
    });

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
    missionLoader: MissionLoader
  ): Promise<void> {
    if (hero) await missionLoader.startMission(hero);
    else logger.info("Error starting mission: Hero not found.");
  }
}
