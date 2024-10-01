import { IAttribute } from "../interfaces/attribute.interfaces.js";
import { attributeName } from "../types/attribute.type.js";
export class Attribute implements IAttribute {
    public name: attributeName;
    public value: number;
    public valueMin: number;
    public valueMax: number;
    public valueConstant: number;

    constructor(
        name: attributeName,
        value: number,
        valueMin: number,
        valueMax: number
    ) {
        this.name = name;
        this.valueConstant = value;
        this.valueMin = valueMin;
        this.valueMax = valueMax;
        this.value = value;
    }

    public clone(): IAttribute {
        return new Attribute(
            this.name,
            this.value,
            this.valueMin,
            this.valueMax
        );
    }
}
