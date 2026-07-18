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

    socket.on("disconnect", () => {
      rooms.deleteByHost(socket.id);
    });
  });
}
