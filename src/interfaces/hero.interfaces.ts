import { IProduct } from "./product.interfaces.js";
import { heroType, subHeroType } from "../types/hero.type.js";
import { IAttribute } from "./attribute.interfaces.js";
import { teamSide } from "../types/team.type.js";

export interface IHero {
    idUser: string;
    nameUser: string;
    idHero: string;
    type: heroType;
    subtype: subHeroType;
    attributes: { [key: string]: IAttribute };
    products: IProduct[];
    alive: boolean;
    teamSide: teamSide;

    isNull(): boolean;
}
