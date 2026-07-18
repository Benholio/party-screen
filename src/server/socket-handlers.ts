import type { Server } from "socket.io";
import type {
  ClientToServerEvents,
  CanvasSnapshot,
  LobbySnapshot,
  ServerToClientEvents,
} from "../shared/protocol.js";
import type { Room, RoomStore } from "./room-store.js";

type PartyServer = Server<ClientToServerEvents, ServerToClientEvents>;
const SESSION_CHANNEL = "active-session";

interface SocketHandlerOptions {
  fallbackPort: number;
  lanAddress: string;
}

export function buildJoinUrl(
  lanAddress: string,
  fallbackPort: number,
  origin?: string,
): string {
  try {
    const displayUrl = new URL(origin ?? "");
    const port = displayUrl.port ? `:${displayUrl.port}` : "";
    return `${displayUrl.protocol}//${lanAddress}${port}/play`;
  } catch {
    return `http://${lanAddress}:${fallbackPort}/play`;
  }
}

function lobbySnapshot(room: Room): LobbySnapshot {
  return {
    players: Array.from(room.players.values()),
  };
}

function canvasSnapshot(room: Room): CanvasSnapshot {
  return { strokes: room.strokes };
}

export function registerSocketHandlers(
  io: PartyServer,
  rooms: RoomStore,
  options: SocketHandlerOptions = { fallbackPort: 3000, lanAddress: "127.0.0.1" },
): void {
  io.on("connection", (socket) => {
    socket.emit("app:config", {
      joinUrl: buildJoinUrl(options.lanAddress, options.fallbackPort, socket.handshake.headers.origin),
    });

    socket.on("room:create", (acknowledge) => {
      try {
        const room = rooms.create(socket.id);
        void socket.join(SESSION_CHANNEL);
        acknowledge({ ok: true });
        io.to(SESSION_CHANNEL).emit("lobby:updated", lobbySnapshot(room));
        socket.emit("canvas:snapshot", canvasSnapshot(room));
      } catch {
        acknowledge({ ok: false, message: "Unable to create a room. Please try again." });
      }
    });

    socket.on("room:join", (acknowledge) => {
      const result = rooms.joinActive(socket.id);

      if (!result.ok) {
        acknowledge({ ok: false, message: "Waiting for an active shared display…" });
        return;
      }

      void socket.join(SESSION_CHANNEL);
      acknowledge({ ok: true, name: result.player.name });
      io.to(SESSION_CHANNEL).emit("lobby:updated", lobbySnapshot(result.room));
      socket.emit("canvas:snapshot", canvasSnapshot(result.room));
    });

    socket.on("canvas:stroke", (stroke, acknowledge) => {
      const room = rooms.addStroke(socket.id, stroke);
      if (room) {
        acknowledge({ ok: true });
        socket.to(SESSION_CHANNEL).emit("canvas:stroke", stroke);
      } else {
        acknowledge({ ok: false, message: "That stroke could not be shared. Please try again." });
      }
    });

    socket.on("disconnect", () => {
      const hostedRoom = rooms.deleteByHost(socket.id);

      if (hostedRoom) {
        io.to(SESSION_CHANNEL).emit("room:closed");
        return;
      }

      const playerRoom = rooms.removePlayer(socket.id);

      if (playerRoom) {
        io.to(SESSION_CHANNEL).emit("lobby:updated", lobbySnapshot(playerRoom));
      }
    });
  });
}
