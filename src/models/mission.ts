import { IHero } from "../interfaces/hero.interfaces.js";
import { AIUtil } from "../utils/ai.js";
import { ITeam } from "../interfaces/team.interface.js";
import { IProduct } from "../interfaces/product.interfaces.js";
import fs from "fs";
import { IMission, MissionStatic } from "../interfaces/mission.interface.js";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
export class Mission implements IMission, MissionStatic {
  private static FILEPATH = join(
    __dirname,
    "../assets/mission-templates/missions.json"
  );

  constructor(
    public missionId: string,
    public name: string,
    public description: string,
    public enemyCount: number,
    public reward: number,
    public time: number,
    public active: boolean,
    public setAI: (
      team: ITeam,
      aiMap: Map<string, IHero>,
      productMap: Map<string, IProduct>
    ) => void,
    public setAIPlayer: (
      hero: IHero,
      team: ITeam,
      aiMap: Map<string, IHero>,
      productMap: Map<string, IProduct>
    ) => void
  ) {}
  static loadMissionsFromFile(): IMission[] {
    const missionsData = JSON.parse(fs.readFileSync(Mission.FILEPATH, "utf-8"));
    return missionsData.map(
      (missionData: any) =>
        new Mission(
          missionData.missionId,
          missionData.name,
          missionData.description,
          missionData.enemyCount,
          missionData.reward,
          missionData.time,
          missionData.active,
          (team, aiMap, productMap) => {
            for (let i = 0; i < missionData.enemyCount; i++) {
              AIUtil.addGeneratedAiToTeam(team, aiMap, productMap);
            }
          },
          (hero, team, aiMap, productMap) => {
            AIUtil.addPlayerAiToTeam(team, aiMap, productMap, hero);
          }
        )
    );
  }
  static defaultMissions(): IMission[] {
    return this.loadMissionsFromFile();
  }

  // static loadMissionsFromFile(): Mission[] {}

  // static defaultMissions(): Mission[] {}
}
