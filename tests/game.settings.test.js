import { GameSettings } from "../server/game.settings.js";

describe("GameSettings", () => {
  beforeEach(() => {
    GameSettings.bluePlayers = 0;
    GameSettings.redPlayers = 0;
    GameSettings.blueDead = 0;
    GameSettings.redDead = 0;
  });

  test("should initialize with zero players and zero dead", () => {
    expect(GameSettings.getBluePlayers()).toBe(0);
    expect(GameSettings.getRedPlayers()).toBe(0);
    expect(GameSettings.getBlueDead()).toBe(0);
    expect(GameSettings.getRedDead()).toBe(0);
  });

  test("should set blue and red players correctly", () => {
    GameSettings.setBluePlayers(5);
    GameSettings.setRedPlayers(3);

    expect(GameSettings.getBluePlayers()).toBe(5);
    expect(GameSettings.getRedPlayers()).toBe(3);
  });

  test("should increase blueDead count by 1", () => {
    GameSettings.addBlueDead();
    expect(GameSettings.getBlueDead()).toBe(1);

    GameSettings.addBlueDead();
    expect(GameSettings.getBlueDead()).toBe(2);
  });

  test("should increase redDead count by 1", () => {
    GameSettings.addRedDead();
    expect(GameSettings.getRedDead()).toBe(1);

    GameSettings.addRedDead();
    expect(GameSettings.getRedDead()).toBe(2);
  });

  test("should handle multiple player and dead settings", () => {
    GameSettings.setBluePlayers(4);
    GameSettings.setRedPlayers(6);

    GameSettings.addBlueDead();
    GameSettings.addBlueDead();
    GameSettings.addRedDead();

    expect(GameSettings.getBluePlayers()).toBe(4);
    expect(GameSettings.getRedPlayers()).toBe(6);
    expect(GameSettings.getBlueDead()).toBe(2);
    expect(GameSettings.getRedDead()).toBe(1);
  });
});
