export interface EffectStrategy {
    applyEffect(currentValue: number, effectValue: number): number;
}

export class AdditionStrategy implements EffectStrategy {
    applyEffect(currentValue: number, effectValue: number): number {
        return currentValue + effectValue;
    }
}

export class SubtractionStrategy implements EffectStrategy {
    applyEffect(currentValue: number, effectValue: number): number {
        return currentValue - effectValue;
    }
}

export class MultiplicationStrategy implements EffectStrategy {
    applyEffect(currentValue: number, effectValue: number): number {
        return currentValue * effectValue;
    }
}
