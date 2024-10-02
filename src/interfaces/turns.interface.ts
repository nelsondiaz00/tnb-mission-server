import { IMatch } from "./match.interfaces.js";

export interface ITurns {
  startTurnRotation(matchInfo: IMatch): void;
  callNextTurn(): void;
  stopTurnRotation(): void;
  reset(): void;
}
