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
import { AIUtil } from "../utils/ai.js";
import dotenv from "dotenv";
import { heroType, subHeroType } from "../types/hero.type.js";
import { Mission } from "../models/mission.js";
import { Turns } from "./turns.js";
import { EventEmitter } from "events";

dotenv.config();

const POWER_PER_TURN: number = parseInt(process.env["POWER_PER_TURN"] || "2");
const url: string =
  process.env.API_URL || "http://127.0.0.1:5001/api/calculate/damage";

export class MissionLoader extends EventEmitter implements IMatchLoader {
  private match: IMatch;
  private teams: Map<teamSide, ITeam>;
  private blueTeam: ITeam;
  private redTeam: ITeam;
  private heroMap: Map<string, IHero>;
  private aiMap: Map<string, IHero>;
  private productMap: Map<string, IProduct>;
  private turns: Turns | undefined;
  private gameSettings = new GameSettings();
  private mission: Mission;

  constructor(matchId: string, missionId: string) {
    super();
    this.blueTeam = new Team([], "blue", true);
    this.redTeam = new Team([], "red", true);
    this.teams = new Map<teamSide, ITeam>();
    this.teams.set("blue", this.blueTeam);
    this.teams.set("red", this.redTeam);

    this.match = new Match(matchId, this.teams);
    const missions = Array.from(Mission.defaultMissions());

    this.mission = missions.find(
      (m) => (m as Mission).missionId === missionId
    ) as Mission;
    this.heroMap = new Map();
    this.aiMap = new Map();
    this.productMap = new Map();
  }

  setTurns(turns: Turns): void {
    this.turns = turns;
  }

  async startMission(hero: IHero): Promise<void> {
    this.blueTeam = new Team([], "blue", true);
    this.redTeam = new Team([], "red", true);
    this.teams = new Map<teamSide, ITeam>();
    this.teams.set("blue", this.blueTeam);
    this.teams.set("red", this.redTeam);

    this.match = new Match(this.match.idMatch, this.teams);

    this.heroMap = new Map();
    this.aiMap = new Map();
    this.productMap = new Map();

    if (!this.mission) {
      logger.error(`Mission not found`);
      return;
    }

    logger.info(`id mission found: ${this.mission.missionId}`);

    const redTeam = this.teams.get("red");
    const blueTeam = this.teams.get("blue");

    if (!redTeam || !blueTeam) {
      logger.error("Teams not found");
      return;
    }

    logger.info(
      `Mission started ${this.mission.missionId} with hero ${hero.idUser}`
    );

    this.mission.setAI(redTeam, this.aiMap, this.productMap);
    this.mission.setAIPlayer(hero, blueTeam, this.aiMap, this.productMap);
    this.gameSettings.reset();
    this.gameSettings.setRedPlayers(redTeam.players.length);
    this.gameSettings.setBluePlayers(blueTeam.players.length);
    logger.info(
      `Player loaded: ${this.gameSettings.getRedPlayers().toString()}`
    );
    logger.info(
      `AI loaded (blue): ${this.gameSettings.getBluePlayers().toString()}`
    );

    // logger.info("AI loaded");
  }

  public async battleAIvsAI(): Promise<void> {
    // if (!blueTeam && !redTeam) {
    //   logger.error("Blue team not found");
    //   return;
    // }
    // const aiHero = this.getHeroWeakest("red");
    // while (hero.alive && aiHero.alive) {
    //   await this.execAILogic(hero);
    //   await this.execAILogic(aiHero);
    // }
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

    if (product == undefined) return;
    else if (perpetrator.attributes["power"].value < product.powerCost) return;

    // logger.info(`perpetratorId: ${perpetratorId}, victimId: ${victimId}`);

    let victim = this.getHeroMap().get(victimId);
    if (victim == undefined) {
      victim = this.getAiMap().get(victimId);
      if (victim == undefined) {
        logger.error("victim null UnU");
        return;
      }
    }
    // this.io.emit("lastAttackName", {
    //   perpetratorId: perpetratorId,
    //   victimId: victimId,
    // });
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

    if (playersInBlue < this.gameSettings.getBluePlayers()) {
      logger.info(
        `adding ${
          this.gameSettings.getBluePlayers() - playersInBlue
        } ai's to blue team`
      );
      for (
        let i = 0;
        i < this.gameSettings.getBluePlayers() - playersInBlue;
        i++
      ) {
        AIUtil.addGeneratedAiToTeam(this.blueTeam, this.aiMap, this.productMap);
      }
    }

    if (playersInRed < this.gameSettings.getRedPlayers()) {
      logger.info(
        `adding ${
          this.gameSettings.getBluePlayers() - playersInBlue
        } ai's to red team`
      );
      for (
        let i = 0;
        i < this.gameSettings.getRedPlayers() - playersInRed;
        i++
      ) {
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

    // logger.info(
    //   `Solicitud enviada a la API de IA ${JSON.stringify(heroProbabilities)}`
    // );
    if (response.ok) {
      const data = await response.json();

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
    )
      return;

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
    // logger.info(`Hero probabilities???: ${JSON.stringify(heroProbabilities)}`);
    const damageCaused = await this.callProbalitiesAPI(heroProbabilities);
    // logger.info(`Daño infligido por ${perpetrator.idUser}!: ${damageCaused}`);
    // logger.info(`${damageCaused} damage caused`)

    if (damageCaused === 0) return;

    if (victim.attributes["blood"].value - damageCaused > 0) {
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

    victimTeam.teamSide === "blue"
      ? this.gameSettings.addBlueDead()
      : this.gameSettings.addRedDead();
    if (!this.gameSettings.blueAlive || !this.gameSettings.redAlive) {
      victimTeam.alive = false;
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
      ? this.gameSettings.addBlueDead()
      : this.gameSettings.addRedDead();
    if (!this.gameSettings.blueAlive || !this.gameSettings.redAlive) {
      victimTeam.alive = false;
      this.endMatch(victim.teamSide === "blue" ? "red" : "blue");
      logger.info("x.x");
      return;
    }
  }

  getHeroWeakest(teamSide: teamSide): IHero {
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
      `${teamSide} team WINS!!!!!!!!!!!!!!!!!!!!!!!! from mission ${this.gameSettings.getBluePlayers()} vs ${this.gameSettings.getRedPlayers()}`
    );

    if (this.turns) {
      this.turns.stopTurnRotation();
    }

    setTimeout(() => {
      this.emit("matchEnded", teamSide);
    }, this.mission.time * 1000);
  }

  getHeroCount(): number {
    return this.heroMap.size;
  }
}
