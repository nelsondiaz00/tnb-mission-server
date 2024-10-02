import { ITurns } from "../interfaces/turns.interface.js";
import { IMatch } from "../interfaces/match.interfaces.js";
import { Turn } from "../models/turn.model.js";
import { ITurn } from "../interfaces/turn.interface.js";
import logger from "../utils/logger.js";
import { IMatchLoader } from "../interfaces/mission.loader.interface.js";
import { AIUtil } from "../utils/ai.js";
import { IHero } from "../interfaces/hero.interfaces.js";
import dotenv from "dotenv";
dotenv.config();

export class Turns implements ITurns {
  private rotationStarted: boolean = false;
  private nextTurnFunction!: () => void;
  private circularList: ITurn[] = [];
  private matchLoader: IMatchLoader;

  constructor(matchLoader: IMatchLoader) {
    this.matchLoader = matchLoader;
  }

  public reset(): void {
    this.circularList = [];
    this.rotationStarted = false;
  }

  private updateCircularList(matchInfo: IMatch) {
    const blueTeam = matchInfo.teams.get("blue");
    if (blueTeam == undefined) {
      logger.error("Looks like blueTeam does not exist:)");
      return;
    }

    const redTeam = matchInfo.teams.get("red");
    if (redTeam == undefined) {
      logger.error(
        "Looks like redTeam does not exist, you are really good at this arent u."
      );
      return;
    }

    const bluePlayers = blueTeam.players;
    const redPlayers = redTeam.players;

    const maxLength = Math.max(bluePlayers.length, redPlayers.length);

    for (let i = 0; i < maxLength; i++) {
      if (i < bluePlayers.length)
        this.circularList.push(new Turn("blue", bluePlayers[i].idUser));

      if (i < redPlayers.length)
        this.circularList.push(new Turn("red", redPlayers[i].idUser));
    }
  }

  startTurnRotation(matchInfo: IMatch): void {
    if (this.rotationStarted) return;
    this.updateCircularList(matchInfo);

    let index = 0;

    const nextTurn = () => {
      const currentUser: ITurn = this.circularList[index];
      // logger.info(
      //   `Current turn is ${currentUser.idUser} and side ${currentUser.side}`
      // );

      if (this.validateCurrentUser(currentUser.idUser)) this.callNextTurn();

      let aiHero = this.matchLoader.getAiMap().get(currentUser.idUser);
      let isCurrentUserAi: boolean = aiHero !== undefined;

      if (isCurrentUserAi) this.execAILogic(aiHero!);

      index = (index + 1) % this.circularList.length;
      if (index == 0) this.givePower();
    };

    nextTurn();

    this.nextTurnFunction = () => {
      nextTurn();
    };

    this.rotationStarted = true;
  }

  stopTurnRotation(): void {
    if (this.rotationStarted) {
      this.rotationStarted = false;
      // logger.info("Turn rotation stopped.");
    }
  }

  callNextTurn(): void {
    if (this.rotationStarted) this.nextTurnFunction();
  }

  private givePower(): void {
    let blueHeroes: IHero[] = this.matchLoader
      .getMatch()
      .teams.get("blue")!.players;
    for (let i = 0; i < blueHeroes.length; i++)
      this.matchLoader.givePower(blueHeroes[i].idUser);

    let redHeroes: IHero[] = this.matchLoader
      .getMatch()
      .teams.get("red")!.players;
    for (let i = 0; i < redHeroes.length; i++)
      this.matchLoader.givePower(redHeroes[i].idUser);
  }

  private async execAILogic(aiHero: IHero): Promise<void> {
    let victim: IHero = this.matchLoader.getHeroWeakest(
      aiHero.teamSide === "blue" ? "red" : "blue"
    );

    try {
      const idHability = await AIUtil.callAiAPI(aiHero, victim);

      if (idHability !== "pailaLaApiNoRespondioPaseTurnoPorqueQueMas") {
        // logger.info(
        //   `AI Hero with id ${aiHero.idUser} used hability with id ${idHability}`
        // );
        // await this.waitRandomTime();
        await this.matchLoader.useHability(
          aiHero.idUser,
          idHability,
          victim.idUser
        );
      }
    } catch (error) {
      logger.error(`Error al llamar a la API de IA: ${error}`);
    }

    this.callNextTurn();
  }

  private validateCurrentUser(idUser: string): boolean {
    let hero = this.matchLoader.getHeroMap().get(idUser);
    if (hero == undefined) {
      hero = this.matchLoader.getAiMap().get(idUser);
      if (hero == undefined) {
        logger.error(`heroe en turno no encontrado ${idUser}`);
        return false;
      }
    }

    if (!hero.alive) {
      this.circularList = this.circularList.filter(
        (turn) => turn.idUser !== hero.idUser
      );
      // logger.info(`pa fuera porque esta muerto`);
      return true;
    }
    return false;
  }
}
