import { productType } from "../types/product.type.js";
import { heroType } from "../types/hero.type.js";
import { subHeroType } from "../types/hero.type.js";
import { IProduct } from "../interfaces/product.interfaces.js";
import { IEffect } from "../interfaces/effect.interfaces.js";
import { ICondition } from "../interfaces/condition.interface.js";

export class Product implements IProduct {
    public idProduct: string;
    public productName: string;
    public productDescription: string;
    public productType: productType;
    public heroType: heroType;
    public subHeroType: subHeroType;
    public dropChance: string;
    public effects: IEffect[];
    public conditions: ICondition[];
    public imagePath: string;
    public powerCost: number;

    constructor(
        idProduct: string,
        productName: string,
        productDescription: string,
        productType: productType,
        heroType: heroType,
        subHeroType: subHeroType,
        dropChance: string,
        effects: IEffect[],
        conditions: ICondition[],
        imagePath: string,
        powerCost: number
    ) {
        this.idProduct = idProduct;
        this.productType = productType;
        this.heroType = heroType;
        this.subHeroType = subHeroType;
        this.productName = productName;
        this.productDescription = productDescription;
        this.dropChance = dropChance;
        this.effects = effects;
        this.conditions = conditions;
        this.imagePath = imagePath;
        this.powerCost = powerCost;
    }

    isNull(): boolean {
        return false;
    }
}
