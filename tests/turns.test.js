import fs from "fs";

jest.mock("fs");

const mockMatchData = {
  teams: {
    blue: { players: [{ idUser: "blue1" }, { idUser: "blue2" }] },
    red: { players: [{ idUser: "red1" }, { idUser: "red2" }] },
  },
};

fs.readFileSync.mockReturnValue(JSON.stringify(mockMatchData));

let startTurnRotation, callNextTurn, circularList;

beforeEach(() => {
  jest.isolateModules(() => {
    const turnsModule = jest.requireActual("../server/turns.js");
    startTurnRotation = turnsModule.startTurnRotation;
    callNextTurn = turnsModule.callNextTurn;
    circularList = turnsModule.circularList;
  });
});
describe("Turn Rotation Functions", () => {
  let io;

  beforeEach(() => {
    io = { emit: jest.fn() };
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
  });

  describe("startTurnRotation", () => {
    it("should start turn rotation and emit turnInfo events", () => {
      startTurnRotation(circularList, io);
      expect(io.emit).toHaveBeenCalledWith("turnInfo", {
        idUser: "blue1",
        side: "blue",
      });
      jest.advanceTimersByTime(30000);
      expect(io.emit).toHaveBeenCalledWith("turnInfo", {
        idUser: "red1",
        side: "red",
      });
      jest.advanceTimersByTime(30000);
      expect(io.emit).toHaveBeenCalledWith("turnInfo", {
        idUser: "blue2",
        side: "blue",
      });
      jest.advanceTimersByTime(30000);
      expect(io.emit).toHaveBeenCalledWith("turnInfo", {
        idUser: "red2",
        side: "red",
      });

      jest.advanceTimersByTime(30000);

      expect(io.emit).toHaveBeenCalledWith("turnInfo", {
        idUser: "red1",
        side: "red",
      });
    });

    it("should handle calling next turn", () => {
      startTurnRotation(circularList, io);
      callNextTurn();

      jest.advanceTimersByTime(30000);
      expect(io.emit).toHaveBeenCalledWith("turnInfo", {
        idUser: "red1",
        side: "red",
      });
    });

    it("should not allow starting rotation if it is already started", () => {
      startTurnRotation(circularList, io);
      console.log = jest.fn();

      startTurnRotation(circularList, io);
      expect(console.log).toHaveBeenCalledWith(
        "Turn rotation already started."
      );
    });
  });

  describe("callNextTurn", () => {
    it("should call nextTurnFunction if rotation has started", () => {
      startTurnRotation(circularList, io);
      callNextTurn();

      jest.advanceTimersByTime(30000);
      expect(io.emit).toHaveBeenCalledWith("turnInfo", {
        idUser: "blue2",
        side: "blue",
      });
    });

    it("should log an error if rotation has not started", () => {
      console.error = jest.fn();

      callNextTurn();
      expect(console.error).toHaveBeenCalledWith(
        "Turn rotation has not started."
      );
    });
  });
});
