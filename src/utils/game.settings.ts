export class GameSettings {
    static blueAlive = true;
    static redAlive = true;
    static bluePlayers = 0;
    static blueDead = 0;
    static redPlayers = 0;
    static redDead = 0;

    static addBlueDead(): void {
        this.blueDead++;
        if (this.blueDead >= this.bluePlayers) this.blueAlive = false;
    }

    static addRedDead(): void {
        this.redDead++;
        if (this.redDead >= this.redPlayers) this.redAlive = false;
    }

    static getBlueDead(): number {
        return this.blueDead;
    }
    static getRedDead(): number {
        return this.redDead;
    }

    static setBluePlayers(amount: number) {
        this.bluePlayers = amount;
    }
    static setRedPlayers(amount: number) {
        this.redPlayers = amount;
    }
    static getBluePlayers(): number {
        return this.bluePlayers;
    }
    static getRedPlayers(): number {
        return this.redPlayers;
    }
}
