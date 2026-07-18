import { describe, expect, it } from "vitest";
import { RoomStore } from "../src/server/room-store.js";

describe("RoomStore", () => {
  it("creates and retrieves a room", () => {
    const rooms = new RoomStore(() => "ABCD");

    const room = rooms.create("host-1");

    expect(room).toEqual({ code: "ABCD", hostSocketId: "host-1", players: new Map() });
    expect(rooms.get("ABCD")).toBe(room);
  });

  it("returns the existing room when the same host creates twice", () => {
    const codes = ["ABCD", "EFGH"];
    const rooms = new RoomStore(() => codes.shift() ?? "WXYZ");

    expect(rooms.create("host-1")).toBe(rooms.create("host-1"));
    expect(rooms.get("EFGH")).toBeUndefined();
  });

  it("retries when a generated code collides", () => {
    const codes = ["ABCD", "ABCD", "EFGH"];
    const rooms = new RoomStore(() => codes.shift() ?? "WXYZ");

    rooms.create("host-1");
    const secondRoom = rooms.create("host-2");

    expect(secondRoom.code).toBe("EFGH");
  });

  it("deletes a room by its host", () => {
    const rooms = new RoomStore(() => "ABCD");
    rooms.create("host-1");

    expect(rooms.deleteByHost("host-1")).toBe(true);
    expect(rooms.get("ABCD")).toBeUndefined();
  });

  it("normalizes a room code and player name when joining", () => {
    const rooms = new RoomStore(() => "ABCD");
    rooms.create("host-1");

    const result = rooms.join(" abcd ", "player-1", "  Ada   Lovelace  ");

    expect(result).toMatchObject({
      ok: true,
      player: { id: "player-1", name: "Ada Lovelace" },
    });
    expect(rooms.get("ABCD")?.players.get("player-1")?.name).toBe("Ada Lovelace");
  });

  it("rejects missing rooms and invalid names", () => {
    const rooms = new RoomStore(() => "ABCD");
    rooms.create("host-1");

    expect(rooms.join("WXYZ", "player-1", "Ada")).toEqual({
      ok: false,
      reason: "invalid-code",
    });
    expect(rooms.join("ABCD", "player-1", "   ")).toEqual({
      ok: false,
      reason: "invalid-name",
    });
    expect(rooms.join("ABCD", "player-1", "A".repeat(21))).toEqual({
      ok: false,
      reason: "invalid-name",
    });
  });

  it("rejects duplicate names case-insensitively", () => {
    const rooms = new RoomStore(() => "ABCD");
    rooms.create("host-1");
    rooms.join("ABCD", "player-1", "Ada");

    expect(rooms.join("ABCD", "player-2", "ada")).toEqual({
      ok: false,
      reason: "duplicate-name",
    });
  });

  it("removes a player by socket id", () => {
    const rooms = new RoomStore(() => "ABCD");
    const room = rooms.create("host-1");
    rooms.join("ABCD", "player-1", "Ada");

    expect(rooms.removePlayer("player-1")).toBe(true);
    expect(room.players.size).toBe(0);
  });
});
