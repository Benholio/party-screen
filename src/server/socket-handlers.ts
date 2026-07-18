import type { Server } from "socket.io";
import type {
  ClientToServerEvents,
  LobbySnapshot,
  ServerToClientEvents,
} from "../shared/protocol.js";
import type { Room, RoomStore } from "./room-store.js";

type PartyServer = Server<ClientToServerEvents, ServerToClientEvents>;

function lobbySnapshot(room: Room): LobbySnapshot {
  return {
    code: room.code,
    players: Array.from(room.players.values()),
  };
}

export function registerSocketHandlers(io: PartyServer, rooms: RoomStore): void {
  io.on("connection", (socket) => {
    socket.on("room:create", (acknowledge) => {
      try {
        const room = rooms.create(socket.id);
        void socket.join(room.code);
        acknowledge({ ok: true, code: room.code });
        io.to(room.code).emit("lobby:updated", lobbySnapshot(room));
      } catch {
        acknowledge({ ok: false, message: "Unable to create a room. Please try again." });
      }
    });

    socket.on("room:join", (request, acknowledge) => {
      const result = rooms.join(request.code, socket.id, request.name);

      if (!result.ok) {
        const messages = {
          "invalid-code": "We couldn't find that room.",
          "invalid-name": "Enter a name between 1 and 20 characters.",
          "duplicate-name": "That name is already in use in this room.",
          "already-joined": "This phone has already joined a room.",
        };
        acknowledge({ ok: false, message: messages[result.reason] });
        return;
      }

      void socket.join(result.room.code);
      acknowledge({ ok: true, code: result.room.code, name: result.player.name });
      io.to(result.room.code).emit("lobby:updated", lobbySnapshot(result.room));
    });

    socket.on("disconnect", () => {
      const hostedRoom = rooms.deleteByHost(socket.id);

      if (hostedRoom) {
        io.to(hostedRoom.code).emit("room:closed");
        return;
      }

      const playerRoom = rooms.removePlayer(socket.id);

      if (playerRoom) {
        io.to(playerRoom.code).emit("lobby:updated", lobbySnapshot(playerRoom));
      }
    });
  });
}
