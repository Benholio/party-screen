import express from "express";
import { createServer } from "node:http";
import { networkInterfaces } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { Server } from "socket.io";
import type { ClientToServerEvents, ServerToClientEvents } from "../shared/protocol.js";
import { RoomStore } from "./room-store.js";
import { registerSocketHandlers } from "./socket-handlers.js";

const port = Number(process.env.PORT ?? 3000);
const app = express();
const httpServer = createServer(app);
const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer);
const rooms = new RoomStore();
const currentDirectory = dirname(fileURLToPath(import.meta.url));
const clientDirectory = join(currentDirectory, "../../dist");

function findLanAddress(): string {
  const interfaces = networkInterfaces();
  const candidates = Object.entries(interfaces).flatMap(([name, addresses]) =>
    (addresses ?? [])
      .filter((address) => address.family === "IPv4" && !address.internal)
      .map((address) => ({ name, address: address.address })),
  );
  return candidates.find(({ name }) => name === "en0" || name === "eth0")?.address
    ?? candidates[0]?.address
    ?? "127.0.0.1";
}

app.get("/health", (_request, response) => {
  response.json({ status: "ok" });
});

app.use(express.static(clientDirectory));

app.get("/{*path}", (_request, response) => {
  response.sendFile(join(clientDirectory, "index.html"));
});

registerSocketHandlers(io, rooms, { fallbackPort: port, lanAddress: findLanAddress() });

httpServer.listen(port, "0.0.0.0", () => {
  console.log(`Party Screen server listening on http://localhost:${port}`);
});
