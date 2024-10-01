import { Attribute } from "./attribute.model.js";
import { heroType } from "../types/hero.type.js";
import { subHeroType } from "../types/hero.type.js";
import { IHero } from "../interfaces/hero.interfaces.js";
import { IAttribute } from "../interfaces/attribute.interfaces.js";
import { IProduct } from "../interfaces/product.interfaces.js";
import { teamSide } from "../types/team.type.js";

export class Hero implements IHero {
    public idUser: string;
    public nameUser: string;
    public idHero: string;
    public type: heroType;
    public subtype: subHeroType;
    public attributes: { [key: string]: IAttribute };
    public products: IProduct[];
    public alive: boolean;
    public teamSide: teamSide;

    constructor(
        idUser: string,
        nameUser: string,
        idHero: string,
        type: heroType,
        subtype: subHeroType,
        attributesArray: IAttribute[],
        products: IProduct[],
        teamSide: teamSide
    ) { 
        this.idUser = idUser;
        this.type = type;
        this.subtype = subtype;
        this.attributes = this.createAttributesMap(
            attributesArray.map((attr) => attr.clone()),
        );
        this.products = products;
        this.alive = true;
        this.teamSide = teamSide;
        this.nameUser = nameUser;
        this.idHero = idHero;
    }

    isNull(): boolean { return false; }

    private createAttributesMap(attributes: IAttribute[]): {
        [key: string]: Attribute;
    } {
        return attributes.reduce(
            (map, attr) => {
                map[attr.name] = attr;
                return map;
            },
            {} as { [key: string]: Attribute },
        );
    }
}
