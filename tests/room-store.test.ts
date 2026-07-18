import { describe, expect, it } from "vitest";
import { RoomStore } from "../src/server/room-store.js";

describe("RoomStore", () => {
  it("creates and retrieves a room", () => {
    const rooms = new RoomStore(() => "ABCD");

    const room = rooms.create("host-1");

    expect(room).toEqual({ code: "ABCD", hostSocketId: "host-1" });
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
});
