import { teamSide } from "../types/team.type.js";
import { ITeam } from "../interfaces/team.interface.js";
import { IHero } from "../interfaces/hero.interfaces.js";
export class Team implements ITeam {
    public players: IHero[];
    public teamSide: teamSide;
    public alive: boolean;

    constructor(players: IHero[], teamSide: teamSide, alive: boolean) {
        this.players = players;
        this.teamSide = teamSide;
        this.alive = alive;
    }

    addHero(hero: IHero): void { this.players.push(hero); }
    isNull(): boolean { return false; }
}
