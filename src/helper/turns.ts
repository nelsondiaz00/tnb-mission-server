import { Server } from "socket.io";
import { ITurns } from "../interfaces/turns.interface.js";
import { IMatch } from "../interfaces/match.interfaces.js";
import { Turn } from "../models/turn.model.js";
import { ITurn } from "../interfaces/turn.interface.js";
import { TurnNotifier } from "../utils/turn.notifier.js";
import logger from "../utils/logger.js";
import { IMatchLoader } from "../interfaces/mission.loader.interface.js";
import { AIUtil } from "../utils/ai.js";
import { IHero } from "../interfaces/hero.interfaces.js";
import dotenv from "dotenv";
dotenv.config();

const TURN_DURATION_MS: number = parseInt(
  process.env["TURN_DURATION_MS"] || "180000"
);
const MAX_AI_WAIT: number = parseInt(process.env["MAX_AI_WAIT"] || "3000");

export class Turns implements ITurns {
  private rotationStarted: boolean = false;
  private turnTimeout!: NodeJS.Timeout;
  // = setTimeout(() => {}, 0)
  private nextTurnFunction!: () => void;
  private circularList: ITurn[] = [];
  private turnNotifier: TurnNotifier;
  private matchLoader: IMatchLoader;
  private wasTurnPassedDueToTimeout: boolean = false;

  constructor(io: Server, matchLoader: IMatchLoader) {
    this.turnNotifier = new TurnNotifier(io);
    this.matchLoader = matchLoader;
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
      logger.info(
        `Current turn is ${currentUser.idUser} and side ${currentUser.side}`
      );
      const previousIndex =
        (index - 1 + this.circularList.length) % this.circularList.length;
      if (this.wasTurnPassedDueToTimeout)
        this.handleTurnTimeout(this.circularList[previousIndex].idUser);

      if (this.validateCurrentUser(currentUser.idUser)) this.callNextTurn();

      this.turnNotifier.notifyTurn(
        currentUser,
        this.matchLoader.getSerializedMatch()
      );

      let aiHero = this.matchLoader.getAiMap().get(currentUser.idUser);
      let isCurrentUserAi: boolean = aiHero !== undefined;

      if (isCurrentUserAi) this.execAILogic(aiHero!);

      index = (index + 1) % this.circularList.length;
      if (index == 0) this.givePower();

      //clearTimeout(this.turnTimeout);
      //this.turnTimeout = setTimeout(nextTurn, TURN_DURATION_MS);
      this.turnTimeout = setTimeout(() => {
        this.wasTurnPassedDueToTimeout = true;
        nextTurn();
      }, TURN_DURATION_MS);
    };

    nextTurn();

    this.nextTurnFunction = () => {
      clearTimeout(this.turnTimeout);
      this.wasTurnPassedDueToTimeout = false;
      nextTurn();
    };

    this.rotationStarted = true;
  }

  callNextTurn(): void {
    if (this.rotationStarted) this.nextTurnFunction();
    else logger.info("Take it easy man, the rotation has to be started yet.");
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
    let victim: IHero = this.matchLoader.getTeamWeakest(
      aiHero.teamSide === "blue" ? "red" : "blue"
    );

    try {
      const idHability = await AIUtil.callAiAPI(aiHero, victim);

      if (idHability !== "pailaLaApiNoRespondioPaseTurnoPorqueQueMas") {
        logger.info(
          `AI Hero with id ${aiHero.idUser} used hability with id ${idHability}`
        );
        await this.waitRandomTime();
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
    this.turnNotifier.emitMatch(this.matchLoader.getSerializedMatch());
  }

  private handleTurnTimeout(idUser: string) {
    logger.info(
      `Todas las mañanas veo una ancianita
            Muy desesperada preguntando por su hijo
            Pero ella no sabe que fue reo AUSENTE
            Se lo capturaron y lo condenaron.`
    );
    this.wasTurnPassedDueToTimeout = false;
    const hero = this.matchLoader.getHeroMap().get(idUser);
    if (hero) {
      hero.attributes["blood"].value = 0;
      hero.alive = false;
      this.matchLoader.getTeamState(hero);
    } else {
      const aiHero = this.matchLoader.getAiMap().get(idUser);
      if (aiHero) {
        aiHero.attributes["blood"].value = 0;
        aiHero.alive = false;
      } else logger.error(`Hero with id ${idUser} not found in hero map!`);
    }
  }

  private waitRandomTime(
    min: number = 1500,
    max: number = MAX_AI_WAIT
  ): Promise<void> {
    const randomTime = Math.floor(Math.random() * (max - min + 1)) + min;
    return new Promise((resolve) => setTimeout(resolve, randomTime));
  }

  private validateCurrentUser(idUser: string): boolean {
    let hero = this.matchLoader.getHeroMap().get(idUser);
    if (hero == undefined) {
      hero = this.matchLoader.getAiMap().get(idUser);
      if (hero == undefined) {
        logger.error(`poder decir adios, es crecer, esto esta muy raro, 
                    como asi que no encuentra le heroe, entonces de donde
                    se saco el id? del culo depronto`);
        return false;
      }
    }

    if (!hero.alive) {
      this.circularList = this.circularList.filter(
        (turn) => turn.idUser !== hero.idUser
      );
      logger.info(`pa fuera porque esta muerto`);
      return true;
    } else logger.error(`else:)`);
    return false;
  }
}
