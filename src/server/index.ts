import express from "express";
import { createServer } from "node:http";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { Server } from "socket.io";

const port = Number(process.env.PORT ?? 3000);
const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer);
const currentDirectory = dirname(fileURLToPath(import.meta.url));
const clientDirectory = join(currentDirectory, "../../dist");

app.get("/health", (_request, response) => {
  response.json({ status: "ok" });
});

app.use(express.static(clientDirectory));

app.get("/{*path}", (_request, response) => {
  response.sendFile(join(clientDirectory, "index.html"));
});

io.on("connection", () => {
  // Room events are introduced in the next milestone.
});

httpServer.listen(port, "0.0.0.0", () => {
  console.log(`Party Screen server listening on http://localhost:${port}`);
});
