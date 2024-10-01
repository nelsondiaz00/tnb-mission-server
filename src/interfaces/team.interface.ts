import { teamSide } from "../types/team.type.js";
import { IHero } from "./hero.interfaces.js";

export interface ITeam {
    players: IHero[];
    teamSide: teamSide;
    alive: boolean;

    addHero(hero: IHero): void;
    isNull(): boolean;
}
