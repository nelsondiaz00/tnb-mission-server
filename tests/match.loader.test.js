import path from "path";
import fs from "fs";
import { GameSettings } from "../server/game.settings";
import { fileURLToPath } from "url";
import {
  loadMatchFile,
  saveMatchFile,
  addPlayerToTeam,
  affectSkills,
  affectPlayerHealth,
} from "../server/match.loader";

jest.mock("fs");

test("should a match file from a json file and correct arguments", () => {
  const mockData = JSON.stringify({
    idMatch: "1",
    teams: {
      blue: {
        players: [],
      },
      red: {
        players: [],
      },
    },
  });
  fs.readFileSync.mockReturnValue(mockData);
  const result = loadMatchFile();

  expect(result).toEqual({
    idMatch: "1",
    teams: {
      blue: {
        players: [],
      },
      red: {
        players: [],
      },
    },
  });

  expect(fs.readFileSync).toHaveBeenCalledWith(expect.any(String), "utf8");
});

describe("saveMatchFile", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockData = JSON.stringify({
    idMatch: "1",
    teams: {
      blue: {
        players: [],
      },
      red: {
        players: [],
      },
    },
  });

  it("should save match data to a file", () => {
    const data = JSON.stringify(mockData, null, 2);

    saveMatchFile(mockData);
    expect(fs.writeFileSync).toHaveBeenCalledWith(
      expect.any(String),
      data,
      "utf8"
    );
  });

  it("should stringify match data with correct formatting", () => {
    saveMatchFile(mockData);

    const jsonString = JSON.stringify(mockData, null, 2);

    expect(fs.writeFileSync).toHaveBeenCalledWith(
      expect.any(String),
      jsonString,
      "utf8"
    );
  });
});

describe("addPlayerToTeam", () => {
  it("should add a player to the team if the player does not already exist", () => {
    const matchData = {
      teams: { red: { players: [] }, blue: { players: [] } },
    };
    fs.readFileSync.mockReturnValue(JSON.stringify(matchData));

    const bindInfo = {
      teamSide: "red",
      idUser: "1",
      type: "warrior",
      subtype: "weapon",
      attributes: {},
      products: [],
      alive: false,
    };
    addPlayerToTeam(bindInfo);
    const updatedMatchData = {
      ...matchData,
      teams: {
        ...matchData.teams,
        red: { players: [bindInfo] },
      },
    };

    expect(fs.writeFileSync).toHaveBeenCalledWith(
      expect.any(String),
      JSON.stringify(updatedMatchData, null, 2),
      "utf8"
    );

    expect(updatedMatchData.teams.red.players).toContainEqual(bindInfo);
  });
});

describe("affectSkills", () => {
  it("should apply product effects to the player's attributes", () => {
    const matchData = {
      teams: {
        red: {
          players: [
            {
              teamSide: "red",
              idUser: "1",
              type: "warrior",
              subtype: "weapon",
              attributes: {
                strength: { value: 10 },
              },
              products: [
                {
                  idProduct: "prod1",
                  effects: [
                    { attributeName: "strength", mathOperator: "+", value: 5 },
                  ],
                },
              ],
              alive: true,
            },
          ],
        },
      },
    };

    fs.readFileSync.mockReturnValue(JSON.stringify(matchData));

    affectSkills("1", "prod1");

    const updatedMatchData = {
      ...matchData,
      teams: {
        ...matchData.teams,
        red: {
          players: [
            {
              ...matchData.teams.red.players[0],
              attributes: {
                strength: { value: 15 },
              },
            },
          ],
        },
      },
    };

    expect(fs.writeFileSync).toHaveBeenCalledWith(
      expect.any(String),
      JSON.stringify(updatedMatchData, null, 2),
      "utf8"
    );
  });
});

describe("affectPlayerHealth", () => {
  it("should reduce the victim's blood by the perpetrator's damage", () => {
    const matchData = {
      teams: {
        red: {
          players: [
            {
              teamSide: "red",
              idUser: "1",
              type: "warrior",
              subtype: "weapon",
              attributes: {
                damage: { value: 10 },
                blood: { value: 50 },
              },
              products: [],
              alive: true,
            },
          ],
        },
        blue: {
          players: [
            {
              teamSide: "blue",
              idUser: "2",
              type: "warrior",
              subtype: "weapon",
              attributes: {
                blood: { value: 40 },
              },
              products: [],
              alive: true,
            },
          ],
        },
      },
    };

    fs.readFileSync.mockReturnValue(JSON.stringify(matchData));

    affectPlayerHealth("1", "2");

    const updatedMatchData = {
      ...matchData,
      teams: {
        ...matchData.teams,
        blue: {
          players: [
            {
              ...matchData.teams.blue.players[0],
              attributes: {
                blood: { value: 30 }, 
              },
            },
          ],
        },
      },
    };

    expect(fs.writeFileSync).toHaveBeenCalledWith(
      expect.any(String),
      JSON.stringify(updatedMatchData, null, 2),
      "utf8"
    );
  });

  it("should set victim's alive to false if blood drops to 0", () => {
    const matchData = {
      teams: {
        red: {
          players: [
            {
              teamSide: "red",
              idUser: "1",
              type: "warrior",
              subtype: "weapon",
              attributes: {
                damage: { value: 50 },
                blood: { value: 50 },
              },
              products: [],
              alive: true,
            },
          ],
        },
        blue: {
          players: [
            {
              teamSide: "blue",
              idUser: "2",
              type: "warrior",
              subtype: "weapon",
              attributes: {
                blood: { value: 40 },
              },
              products: [],
              alive: true,
            },
          ],
        },
      },
    };

    fs.readFileSync.mockReturnValue(JSON.stringify(matchData));

    affectPlayerHealth("1", "2");

    const updatedMatchData = {
      ...matchData,
      teams: {
        ...matchData.teams,
        blue: {
          players: [
            {
              ...matchData.teams.blue.players[0],
              attributes: {
                blood: { value: 0 }, 
              },
              alive: false, 
            },
          ],
        },
      },
    };

    expect(fs.writeFileSync).toHaveBeenCalledWith(
      expect.any(String),
      JSON.stringify(updatedMatchData, null, 2),
      "utf8"
    );
  });

});
