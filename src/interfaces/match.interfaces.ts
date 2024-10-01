import { teamSide } from "../types/team.type.js";
import { ITeam } from "./team.interface.js";

export interface IMatch {
    idMatch: string;
    teams: Map<teamSide, ITeam>;
    size: number;
    owner: string
    setOwner(idUser: string): void;
}
