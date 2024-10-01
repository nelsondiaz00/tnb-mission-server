import { teamSide } from "../types/team.type.js";
import { IMatch } from "../interfaces/match.interfaces.js";
import { ITeam } from "../interfaces/team.interface.js";

export class Match implements IMatch {
    public idMatch: string;
    public teams: Map<teamSide, ITeam>;
    public size: number;
    public owner: string

    constructor(idMatch: string, teams: Map<teamSide, ITeam>) {
        this.teams = teams;
        this.idMatch = idMatch;
        this.size = teams.size;
        this.owner = "none";
    }

    setOwner(idUser: string): void {
        this.owner = idUser;
    }
}
