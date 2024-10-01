// import { Product } from "./product.model";
import * as math from "mathjs";
import { Attribute } from "./attribute.model.js";
import { ICondition } from "../interfaces/condition.interface.js";

export class Condition implements ICondition {
    //requiredProduct: Product;
    public attribute1: Attribute;
    public attribute2: Attribute;
    public logicOperator: string;

    constructor(
        // requiredProduct: Product,
        attribute1: Attribute,
        attribute2: Attribute,
        logicOperator: string,
    ) {
        //this.requiredProduct = requiredProduct;
        this.attribute1 = attribute1;
        this.attribute2 = attribute2;
        this.logicOperator = logicOperator;
    }

    public evaluateCondition(): boolean {
        const result = this.attribute1 + this.logicOperator + this.attribute2;
        return math.evaluate(result);
    }
}
