import { IEffect } from "../interfaces/effect.interfaces.js";
import { IHero } from "../interfaces/hero.interfaces.js";
import { IMatch } from "../interfaces/match.interfaces.js";
import { IProduct } from "../interfaces/product.interfaces.js";
import { ITeam } from "../interfaces/team.interface.js";
import { IMatchLoader } from "../interfaces/mission.loader.interface.js";
import { Match } from "../models/match.model.js";
import { Team } from "../models/team.model.js";
import { NullHero } from "../null_models/null.hero.js";
import { NullTeam } from "../null_models/null.team.js";
import {
  AdditionStrategy,
  EffectStrategy,
  MultiplicationStrategy,
  SubtractionStrategy,
} from "../utils/operator.strategy.js";
import { teamSide } from "../types/team.type.js";
import logger from "../utils/logger.js";
import { GameSettings } from "../utils/game.settings.js";
import { Server } from "socket.io";
import { parentPort } from "worker_threads";
import { AIUtil } from "../utils/ai.js";
import dotenv from "dotenv";
import { heroType, subHeroType } from "../types/hero.type.js";
import { Mission } from "../models/mission.js";
dotenv.config();

const POWER_PER_TURN: number = parseInt(process.env["POWER_PER_TURN"] || "2");
const url: string =
  process.env.API_URL || "http://127.0.0.1:5001/api/calculate/damage";

export class MissionLoader implements IMatchLoader {
  private match: IMatch;
  private teams: Map<teamSide, ITeam>;

  private blueTeam: ITeam;
  private redTeam: ITeam;

  private heroMap: Map<string, IHero>;
  private aiMap: Map<string, IHero>;
  private productMap: Map<string, IProduct>;

  private io: Server;

  constructor(matchId: string, io: Server) {
    this.blueTeam = new Team([], "blue", true);
    this.redTeam = new Team([], "red", true);

    this.teams = new Map<teamSide, ITeam>();
    this.teams.set("blue", this.blueTeam);
    this.teams.set("red", this.redTeam);

    this.match = new Match(matchId, this.teams);

    this.heroMap = new Map();
    this.aiMap = new Map();
    this.productMap = new Map();

    this.io = io;
  }

  async startMission(hero: IHero, missionName: string): Promise<void> {
    const missions = Array.from(Mission.defaultMissions());
    const mission = missions.find((m) => (m as Mission).name === missionName) as Mission;
    if (!mission) {
      logger.error(`Mission with name ${missionName} not found`);
      return;
    }

    const redTeam = this.teams.get("red");
    const blueTeam = this.teams.get("blue");

    if (!redTeam || !blueTeam) {
      logger.error("Teams not found");
      return;
    }

    mission.execute(blueTeam, this.aiMap, this.productMap);

    await this.battleAIvsAI(hero);
  }

  async battleAIvsAI(hero: IHero): Promise<void> {
    this.addPlayerToTeam(hero);

    const blueTeam = this.teams.get("blue");
    if (!blueTeam) {
      logger.error("Blue team not found");
      return;
    }
    AIUtil.addGeneratedAiToTeam(blueTeam, this.aiMap, this.productMap);

    const aiHero = this.getTeamWeakest("blue");

    while (hero.alive && aiHero.alive) {
      await this.execAILogic(hero);
      await this.execAILogic(aiHero);
    }

    this.endMatch(hero.alive ? "red" : "blue");
    logger.info(`Match ended. Winner: ${hero.alive ? "red" : "blue"}`);
  }

  private async execAILogic(aiHero: IHero): Promise<void> {
    let victim: IHero = this.getTeamWeakest(
      aiHero.teamSide === "blue" ? "red" : "blue"
    );

    try {
      const idHability = await AIUtil.callAiAPI(aiHero, victim);

      if (idHability !== "pailaLaApiNoRespondioPaseTurnoPorqueQueMas") {
        logger.info(
          `AI Hero with id ${aiHero.idUser} used hability with id ${idHability}`
        );
        // await this.waitRandomTime();
        await this.useHability(aiHero.idUser, idHability, victim.idUser);
      }
    } catch (error) {
      logger.error(`Error al llamar a la API de IA: ${error}`);
    }
  }

  addPlayerToTeam(hero: IHero): void {
    if (this.heroMap.get(hero.idUser) != undefined) {
      logger.error("trying to add a user that already is here????");
      return;
    }

    if (hero.teamSide == "blue") this.blueTeam.addHero(hero);
    else if (hero.teamSide == "red") this.redTeam.addHero(hero);

    if (this.heroMap.size == 0) this.match.setOwner(hero.idUser);
    this.heroMap.set(hero.idUser, hero);
    hero.products.forEach((product) => {
      if (this.productMap.get(product.idProduct) == undefined)
        this.productMap.set(product.idProduct, product);
    });
  }

  private translateHero(hero: heroType, subHero: subHeroType): any {
    const heroTranslations: Record<heroType, string> = {
      warrior: "GUERRERO",
      wizard: "MAGO",
      rogue: "PÍCARO",
    };

    const subHeroTranslations: Record<subHeroType, string> = {
      tank: "TANQUE",
      weapon: "ARMAS",
      fire: "FUEGO",
      ice: "HIELO",
      poison: "VENENO",
      machete: "MACHETE",
    };

    return {
      type: heroTranslations[hero],
      subType: subHeroTranslations[subHero],
    };
  }

  async useHability(
    perpetratorId: string,
    productId: string,
    victimId: string
  ): Promise<void> {
    let perpetrator = this.getHeroMap().get(perpetratorId);
    const product = this.productMap.get(productId);

    if (perpetrator == undefined) {
      perpetrator = this.getAiMap().get(perpetratorId);
      if (perpetrator == undefined) {
        logger.error("perpetrator null, wtf is this shite");
        return;
      }
    }

    if (product == undefined) {
      logger.error("the product is null, wtf is this code man.");
      return;
    } else if (perpetrator.attributes["power"].value < product.powerCost) {
      logger.error(
        `insuficcient power to use ${product.productName}? try some perico`
      );
      this.io.emit("failedReason", "¡Fallo! Insuficiente poder");
      return;
    }

    logger.info(`perpetratorId: ${perpetratorId}, victimId: ${victimId}`);

    let victim = this.getHeroMap().get(victimId);
    if (victim == undefined) {
      victim = this.getAiMap().get(victimId);
      if (victim == undefined) {
        logger.error("victim null UnU");
        return;
      }
    }
    this.io.emit("lastAttackName", {
      perpetratorId: perpetratorId,
      victimId: victimId,
    });
    await this.affectPlayerHealth(perpetrator, victim);
    this.affectSkills(perpetratorId, product, victimId);
    this.affectPlayerPower(perpetrator, product);
  }

  getMatch(): IMatch {
    return this.match;
  }

  givePower(heroId: string) {
    let hero = this.getHeroMap().get(heroId);
    if (hero == undefined) {
      hero = this.aiMap.get(heroId);

      if (hero == undefined) {
        logger.error(
          "paila mani no le puedo dar power porque el heroe ni existe en esta partida."
        );
        return;
      }
    }

    if (
      hero.attributes["power"].value + POWER_PER_TURN <=
      hero.attributes["power"].valueConstant
    )
      hero.attributes["power"].value += POWER_PER_TURN;
  }

  getSerializedMatch(): unknown {
    return {
      idMatch: this.match.idMatch,
      size: this.match.size,
      teams: Object.fromEntries(this.match.teams),
      owner: this.match.owner,
    };
  }

  getOwner(): string {
    return this.match.owner;
  }

  loadAI(): void {
    let playersInBlue: number = this.playersInTeam("blue");
    let playersInRed: number = this.playersInTeam("red");

    if (playersInBlue < GameSettings.getBluePlayers()) {
      logger.info(
        `adding ${
          GameSettings.getBluePlayers() - playersInBlue
        } ai's to blue team`
      );
      for (let i = 0; i < GameSettings.getBluePlayers() - playersInBlue; i++) {
        AIUtil.addGeneratedAiToTeam(this.blueTeam, this.aiMap, this.productMap);
      }
    }

    if (playersInRed < GameSettings.getRedPlayers()) {
      logger.info(
        `adding ${
          GameSettings.getBluePlayers() - playersInBlue
        } ai's to red team`
      );
      for (let i = 0; i < GameSettings.getRedPlayers() - playersInRed; i++) {
        AIUtil.addGeneratedAiToTeam(this.redTeam, this.aiMap, this.productMap);
      }
    }
  }

  getAiMap(): Map<string, IHero> {
    return this.aiMap;
  }

  getHeroMap(): Map<string, IHero> {
    return this.heroMap;
  }

  private playersInTeam(teamSide: teamSide): number {
    let count = 0;
    this.heroMap.forEach((hero) => {
      if (hero.teamSide === teamSide) {
        count++;
      }
    });
    return count;
  }

  private async callProbalitiesAPI(
    heroProbabilities: HeroStats
  ): Promise<number> {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(heroProbabilities),
    });

    logger.info(
      `Solicitud enviada a la API de IA ${JSON.stringify(heroProbabilities)}`
    );
    if (response.ok) {
      const data = await response.json();
      logger.info(`Daño infligido!: ${data}`);

      return data;
    } else {
      logger.error(
        `Error en la solicitud: ${response.status}, ${response.statusText}`
      );
      return 0;
    }
  }

  private affectSkills(
    perpetratorId: string,
    product: IProduct,
    victimId: string
  ): void {
    const perpetratorSide: ITeam = this.getTeam(perpetratorId);
    const victimSide: ITeam = this.getTeam(victimId);

    if (perpetratorSide == null || victimSide == null) {
      logger.error(
        "the perpetratorTeam or the victimTeam, someone is null, but who can be?? Its sherlock time"
      );
      return;
    }

    const effectTarget = (effect: IEffect) =>
      effect.target === "ally" ? perpetratorSide : victimSide;

    product.effects.forEach((effect) => {
      this.affectTeam(effectTarget(effect), effect);
    });
  }

  private async affectPlayerHealth(
    perpetrator: IHero,
    victim: IHero
  ): Promise<void> {
    if (
      perpetrator.attributes["attack"].value <
      victim.attributes["defense"].value
    ) {
      logger.info("victim so tanky, no damage taken");
      this.io.emit("failedReason", "¡Fallo! Enemigo muy tanque");
      return;
    }
    const translateHero = this.translateHero(
      perpetrator.type,
      perpetrator.subtype
    );
    const heroProbabilities: HeroStats = {
      critico: perpetrator.attributes["critical"].value,
      dano: perpetrator.attributes["damage"].value,
      "tipo-heroe": translateHero.type,
      "subtipo-heroe": translateHero.subType,
    };
    logger.info(`Hero probabilities???: ${JSON.stringify(heroProbabilities)}`);
    const damageCaused = await this.callProbalitiesAPI(heroProbabilities);

    // logger.info(`${damageCaused} damage caused`)

    if (damageCaused === 0) {
      logger.info("perpetrator doesn't hit, victim still alive");
      this.io.emit("failedReason", "¡Fallo! Ataque no efectivo");
      return;
    }

    if (victim.attributes["blood"].value - damageCaused > 0) {
      logger.info("perpetrator hits!, victim still alive");
      victim.attributes["blood"].value -= damageCaused;
      victim.attributes["blood"].value = parseFloat(
        victim.attributes["blood"].value.toFixed(1)
      );
      return;
    }

    victim.attributes["blood"].value = 0;
    victim.alive = false;

    const victimTeam = this.getTeam(victim.idUser);
    if (victimTeam == null) {
      logger.error("victimTeam null :))))");
      return;
    }

    logger.info("tanta mona me envenena");
    victimTeam.teamSide === "blue"
      ? GameSettings.addBlueDead()
      : GameSettings.addRedDead();
    if (!GameSettings.blueAlive || !GameSettings.redAlive) {
      victimTeam.alive = false;
      logger.info("x.x");
      this.endMatch(perpetrator.teamSide);
    }
  }

  public getTeamState(victim: IHero): void {
    const victimTeam = this.getTeam(victim.idUser);
    if (victimTeam == null) {
      logger.error("victimTeam null :))))");
      return;
    }

    victimTeam.teamSide === "blue"
      ? GameSettings.addBlueDead()
      : GameSettings.addRedDead();
    if (!GameSettings.blueAlive || !GameSettings.redAlive) {
      victimTeam.alive = false;
      this.endMatch(victim.teamSide === "blue" ? "red" : "blue");
      logger.info("x.x");
      return;
    }
  }

  getTeamWeakest(teamSide: teamSide): IHero {
    const team = this.teams.get(teamSide);
    if (!team) {
      logger.error(`Team ${teamSide} not found`);
      return new NullHero();
    }

    let weakestHero: IHero = team.players[0];

    for (const hero of team.players) {
      const bloodValue: number = hero.attributes["blood"].value;
      if (bloodValue < weakestHero.attributes["blood"].value)
        weakestHero = hero;
    }

    return weakestHero;
  }

  private affectPlayerPower(perpetrator: IHero, product: IProduct): void {
    perpetrator.attributes["power"].value -= product.powerCost;

    if (perpetrator.attributes["power"].value < 0)
      perpetrator.attributes["power"].value = 0;

    logger.info(
      `perpetrator used power, remaining power: ${perpetrator.attributes["power"].value}`
    );
  }
  private getTeam(idHero: string): ITeam {
    const firstSide = this.teams.get("blue");
    if (firstSide == null) return new NullTeam();

    for (const player of firstSide.players)
      if (player.idUser == idHero) return firstSide;

    const secondSide = this.teams.get("red");
    if (secondSide == null) return new NullTeam();

    for (const player of secondSide.players)
      if (player.idUser == idHero) return secondSide;

    return new NullTeam();
  }

  private affectTeam(side: ITeam, effect: IEffect): void {
    const strategy: EffectStrategy = this.getStrategy(effect.mathOperator);

    side.players.forEach((player) => {
      player.attributes[effect.attribute.name].value = strategy.applyEffect(
        player.attributes[effect.attribute.name].value,
        effect.value
      );
    });
  }

  private getStrategy(operator: string): EffectStrategy {
    switch (operator) {
      case "+":
        return new AdditionStrategy();
      case "-":
        return new SubtractionStrategy();
      case "*":
        return new MultiplicationStrategy();
      default:
        throw new Error("Unsupported operator");
    }
  }

  public endMatch(teamSide: teamSide) {
    logger.info(
      `todo bien manito hasta aqui llegamos, ganaron los ${teamSide}`
    );
    this.io.emit("endMatch", teamSide);
    if (parentPort)
      parentPort.postMessage({ status: "MatchEnded", winner: teamSide });
  }

  getHeroCount(): number {
    return this.heroMap.size;
  }
}
