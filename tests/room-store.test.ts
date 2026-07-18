import { describe, expect, it } from "vitest";
import { RoomStore } from "../src/server/room-store.js";

describe("RoomStore", () => {
  it("creates and retrieves the active room", () => {
    const rooms = new RoomStore();

    const room = rooms.create("host-1");

    expect(room).toEqual({
      hostSocketId: "host-1",
      players: new Map(),
      strokes: [],
    });
    expect(rooms.getActive()).toBe(room);
  });

  it("returns the existing active room when another display connects", () => {
    const rooms = new RoomStore();
    expect(rooms.create("host-1")).toBe(rooms.create("host-2"));
  });

  it("deletes a room by its host", () => {
    const rooms = new RoomStore();
    rooms.create("host-1");

    expect(rooms.deleteByHost("host-1")?.hostSocketId).toBe("host-1");
    expect(rooms.getActive()).toBeUndefined();
  });

  it("automatically joins the active room with an assigned name", () => {
    const rooms = new RoomStore();
    rooms.create("host-1");

    const result = rooms.joinActive("player-1");

    expect(result).toMatchObject({
      ok: true,
      player: { id: "player-1", name: "Player 1" },
    });
    expect(rooms.getActive()?.players.get("player-1")?.name).toBe("Player 1");
  });

  it("waits when there is no active room", () => {
    const rooms = new RoomStore();
    expect(rooms.joinActive("player-1")).toEqual({
      ok: false,
      reason: "no-active-room",
    });
  });

  it("assigns unique sequential names and treats retries as idempotent", () => {
    const rooms = new RoomStore();
    rooms.create("host-1");
    const first = rooms.joinActive("player-1");
    const second = rooms.joinActive("player-2");

    expect(first).toMatchObject({ ok: true, player: { name: "Player 1" } });
    expect(second).toMatchObject({ ok: true, player: { name: "Player 2" } });
    const retried = rooms.joinActive("player-1");
    expect(retried).toMatchObject({ ok: true, player: { name: "Player 1" } });
  });

  it("removes a player by socket id", () => {
    const rooms = new RoomStore();
    const room = rooms.create("host-1");
    rooms.joinActive("player-1");

    expect(rooms.removePlayer("player-1")?.hostSocketId).toBe("host-1");
    expect(room.players.size).toBe(0);
  });

  it("accepts validated strokes from joined players", () => {
    const rooms = new RoomStore();
    const room = rooms.create("host-1");
    rooms.joinActive("player-1");

    const stroke = {
      color: "#ef476f",
      id: "stroke-1",
      points: [{ x: 0.1, y: 0.2 }, { x: 0.3, y: 0.4 }],
    };
    expect(rooms.addStroke("player-1", stroke)).toBe(room);
    expect(room.strokes).toEqual([stroke]);
    expect(rooms.addStroke("player-1", stroke)).toBeUndefined();
  });

  it("rejects strokes from non-players and out-of-bounds points", () => {
    const rooms = new RoomStore();
    rooms.create("host-1");
    rooms.joinActive("player-1");

    const invalidStroke = {
      color: "#17132b",
      id: "stroke-1",
      points: [{ x: 0, y: 0 }, { x: 2, y: 1 }],
    };
    expect(rooms.addStroke("unknown", invalidStroke)).toBeUndefined();
    expect(rooms.addStroke("player-1", invalidStroke)).toBeUndefined();
    expect(rooms.addStroke("player-1", {
      ...invalidStroke,
      color: "hotpink",
      points: [{ x: 0, y: 0 }, { x: 1, y: 1 }],
    })).toBeUndefined();
  });
});
