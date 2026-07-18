import { createServer, type Server as HttpServer } from "node:http";
import type { AddressInfo } from "node:net";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { Server } from "socket.io";
import { io as createClient, type Socket } from "socket.io-client";
import type {
  CanvasSnapshot,
  CanvasStroke,
  CanvasStrokeResult,
  ClientToServerEvents,
  CreateRoomResult,
  JoinRoomResult,
  LobbySnapshot,
  ServerToClientEvents,
} from "../src/shared/protocol.js";
import { RoomStore } from "../src/server/room-store.js";
import { buildJoinUrl, registerSocketHandlers } from "../src/server/socket-handlers.js";

type PartyClient = Socket<ServerToClientEvents, ClientToServerEvents>;

describe("lobby socket flow", () => {
  let httpServer: HttpServer;
  let ioServer: Server<ClientToServerEvents, ServerToClientEvents>;
  let serverUrl: string;
  const clients: PartyClient[] = [];

  beforeEach(async () => {
    httpServer = createServer();
    ioServer = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer);
    registerSocketHandlers(ioServer, new RoomStore());

    await new Promise<void>((resolve) => httpServer.listen(0, "127.0.0.1", resolve));
    const address = httpServer.address() as AddressInfo;
    serverUrl = `http://127.0.0.1:${address.port}`;
  });

  afterEach(async () => {
    clients.forEach((client) => client.disconnect());
    clients.length = 0;
    await new Promise<void>((resolve) => ioServer.close(() => resolve()));
  });

  async function connectClient(): Promise<PartyClient> {
    const client: PartyClient = createClient(serverUrl, { forceNew: true, reconnection: false });
    clients.push(client);
    await new Promise<void>((resolve) => client.on("connect", resolve));
    return client;
  }

  function createRoom(client: PartyClient): Promise<CreateRoomResult> {
    return new Promise((resolve) => client.emit("room:create", resolve));
  }

  function joinRoom(client: PartyClient): Promise<JoinRoomResult> {
    return new Promise((resolve) => client.emit("room:join", resolve));
  }

  function nextLobby(client: PartyClient): Promise<LobbySnapshot> {
    return new Promise((resolve) => client.once("lobby:updated", resolve));
  }

  function nextCanvasSnapshot(client: PartyClient): Promise<CanvasSnapshot> {
    return new Promise((resolve) => client.once("canvas:snapshot", resolve));
  }

  function nextStroke(client: PartyClient): Promise<CanvasStroke> {
    return new Promise((resolve) => client.once("canvas:stroke", resolve));
  }

  function sendStroke(client: PartyClient, stroke: CanvasStroke): Promise<CanvasStrokeResult> {
    return new Promise((resolve) => client.emit("canvas:stroke", stroke, resolve));
  }

  it("synchronizes joins, player disconnects, and host closure", async () => {
    const host = await connectClient();
    const created = await createRoom(host);
    expect(created).toEqual({ ok: true });

    const player = await connectClient();
    const hostJoinedLobby = nextLobby(host);
    const playerJoinedLobby = nextLobby(player);
    expect(await joinRoom(player)).toEqual({
      ok: true,
      name: "Player 1",
    });

    const expectedLobby = {
      players: [{ id: player.id, name: "Player 1" }],
    };
    expect(await hostJoinedLobby).toEqual(expectedLobby);
    expect(await playerJoinedLobby).toEqual(expectedLobby);

    const playerLeftLobby = nextLobby(host);
    player.disconnect();
    expect(await playerLeftLobby).toEqual({ players: [] });

    const secondPlayer = await connectClient();
    await joinRoom(secondPlayer);
    const roomClosed = new Promise<void>((resolve) => secondPlayer.once("room:closed", resolve));
    host.disconnect();
    await roomClosed;
  });

  it("allows a waiting phone to join after the display session appears", async () => {
    const player = await connectClient();
    expect(await joinRoom(player)).toEqual({
      ok: false,
      message: "Waiting for an active shared display…",
    });

    const host = await connectClient();
    await createRoom(host);
    expect(await joinRoom(player)).toEqual({ ok: true, name: "Player 1" });
  });

  it("shares strokes and gives late joiners the current canvas", async () => {
    const host = await connectClient();
    await createRoom(host);
    const player = await connectClient();
    const initialCanvas = nextCanvasSnapshot(player);
    await joinRoom(player);
    expect(await initialCanvas).toEqual({ strokes: [] });

    const stroke = {
      color: "#3787ff",
      id: "stroke-1",
      points: [{ x: 0.1, y: 0.2 }, { x: 0.3, y: 0.4 }],
    };
    const hostStroke = nextStroke(host);
    expect(await sendStroke(player, stroke)).toEqual({ ok: true });
    expect(await hostStroke).toEqual(stroke);

    const latePlayer = await connectClient();
    const currentCanvas = nextCanvasSnapshot(latePlayer);
    await joinRoom(latePlayer);
    expect(await currentCanvas).toEqual({ strokes: [stroke] });
  });
});

describe("join URL", () => {
  it("uses the LAN address with the display origin's port", () => {
    expect(buildJoinUrl("192.168.68.51", 3000, "http://localhost:5173")).toBe(
      "http://192.168.68.51:5173/play",
    );
    expect(buildJoinUrl("192.168.68.51", 3000)).toBe(
      "http://192.168.68.51:3000/play",
    );
  });
});
