import logger from "./logger.js";

export class GameSettings {
  blueAlive = true;
  redAlive = true;
  bluePlayers = 0;
  blueDead = 0;
  redPlayers = 0;
  redDead = 0;

  reset(): void {
    this.blueAlive = true;
    this.redAlive = true;
    this.bluePlayers = 0;
    this.blueDead = 0;
    this.redPlayers = 0;
    this.redDead = 0;
  }

  addBlueDead(): void {
    logger.info(
      "Blue Dead -----------------------------------------------------------------"
    );
    this.blueDead++;
    if (this.blueDead >= this.bluePlayers) this.blueAlive = false;
  }

  addRedDead(): void {
    logger.info(
      "Red Dead -----------------------------------------------------------------"
    );
    this.redDead++;
    if (this.redDead >= this.redPlayers) this.redAlive = false;
  }

  getBlueDead(): number {
    return this.blueDead;
  }

  getRedDead(): number {
    return this.redDead;
  }

  setBluePlayers(amount: number) {
    this.bluePlayers = amount;
  }

  setRedPlayers(amount: number) {
    this.redPlayers = amount;
  }

  getBluePlayers(): number {
    return this.bluePlayers;
  }

  getRedPlayers(): number {
    return this.redPlayers;
  }
}
