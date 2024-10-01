import { IHero } from "../interfaces/hero.interfaces.js";
import { ITeam } from "../interfaces/team.interface.js";
import { IProduct } from "../interfaces/product.interfaces.js";

export interface IMission {
  missionId: string;
  name: string;
  description: string;
  enemyCount: number;
  reward: number;
  time: number;
  active: boolean;
  execute: (
    team: ITeam,
    aiMap: Map<string, IHero>,
    productMap: Map<string, IProduct>
  ) => void;
}

export abstract class MissionStatic {
  static loadMissionsFromFile(): IMission[] {
    throw new Error("Method not implemented.");
  }

  static defaultMissions(): IMission[] {
    throw new Error("Method not implemented.");
  }
}
