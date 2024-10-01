import { IAttribute } from "./attribute.interfaces.js";
import { targetType } from "../types/effect.type.js";

export interface IEffect {
    attribute: IAttribute;
    mathOperator: string;
    turns: number;
    target: targetType;
    value: number;
    valueCaused: number;

    accumulateValue(): void;
}
