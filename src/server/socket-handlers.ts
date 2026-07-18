import type { Server } from "socket.io";
import type { ClientToServerEvents, ServerToClientEvents } from "../shared/protocol.js";
import type { RoomStore } from "./room-store.js";

type PartyServer = Server<ClientToServerEvents, ServerToClientEvents>;

export function registerSocketHandlers(io: PartyServer, rooms: RoomStore): void {
  io.on("connection", (socket) => {
    socket.on("room:create", (acknowledge) => {
      try {
        const room = rooms.create(socket.id);
        void socket.join(room.code);
        acknowledge({ ok: true, code: room.code });
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
    });

    socket.on("disconnect", () => {
      rooms.deleteByHost(socket.id);
      rooms.removePlayer(socket.id);
    });
  });
}
