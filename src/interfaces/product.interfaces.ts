import { heroType, subHeroType } from "../types/hero.type.js";
import { productType } from "../types/product.type.js";
import { ICondition } from "./condition.interface.js";
import { IEffect } from "./effect.interfaces.js";

export interface IProduct {
    idProduct: string;
    productName: string;
    productDescription: string;
    productType: productType;
    heroType: heroType;
    subHeroType: subHeroType;
    dropChance: string;
    effects: IEffect[];
    conditions: ICondition[];
    imagePath: string;
    powerCost: number;

    isNull(): boolean;
}
