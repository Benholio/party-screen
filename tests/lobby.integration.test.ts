import { createServer, type Server as HttpServer } from "node:http";
import type { AddressInfo } from "node:net";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { Server } from "socket.io";
import { io as createClient, type Socket } from "socket.io-client";
import type {
  ClientToServerEvents,
  CreateRoomResult,
  JoinRoomResult,
  LobbySnapshot,
  ServerToClientEvents,
} from "../src/shared/protocol.js";
import { RoomStore } from "../src/server/room-store.js";
import { registerSocketHandlers } from "../src/server/socket-handlers.js";

type PartyClient = Socket<ServerToClientEvents, ClientToServerEvents>;

describe("lobby socket flow", () => {
  let httpServer: HttpServer;
  let ioServer: Server<ClientToServerEvents, ServerToClientEvents>;
  let serverUrl: string;
  const clients: PartyClient[] = [];

  beforeEach(async () => {
    httpServer = createServer();
    ioServer = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer);
    registerSocketHandlers(ioServer, new RoomStore(() => "ABCD"));

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

  function joinRoom(client: PartyClient, code: string, name: string): Promise<JoinRoomResult> {
    return new Promise((resolve) => client.emit("room:join", { code, name }, resolve));
  }

  function nextLobby(client: PartyClient): Promise<LobbySnapshot> {
    return new Promise((resolve) => client.once("lobby:updated", resolve));
  }

  it("synchronizes joins, player disconnects, and host closure", async () => {
    const host = await connectClient();
    const created = await createRoom(host);
    expect(created).toEqual({ ok: true, code: "ABCD" });

    const player = await connectClient();
    const hostJoinedLobby = nextLobby(host);
    const playerJoinedLobby = nextLobby(player);
    expect(await joinRoom(player, "ABCD", "Ada")).toEqual({
      ok: true,
      code: "ABCD",
      name: "Ada",
    });

    const expectedLobby = {
      code: "ABCD",
      players: [{ id: player.id, name: "Ada" }],
    };
    expect(await hostJoinedLobby).toEqual(expectedLobby);
    expect(await playerJoinedLobby).toEqual(expectedLobby);

    const playerLeftLobby = nextLobby(host);
    player.disconnect();
    expect(await playerLeftLobby).toEqual({ code: "ABCD", players: [] });

    const secondPlayer = await connectClient();
    await joinRoom(secondPlayer, "ABCD", "Grace");
    const roomClosed = new Promise<void>((resolve) => secondPlayer.once("room:closed", resolve));
    host.disconnect();
    await roomClosed;
  });
});
