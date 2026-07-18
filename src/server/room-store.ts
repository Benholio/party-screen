import { randomInt } from "node:crypto";

const ROOM_CODE_ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";
const ROOM_CODE_LENGTH = 4;
const MAX_CODE_ATTEMPTS = 100;

export interface Room {
  code: string;
  hostSocketId: string;
  players: Map<string, Player>;
}

export interface Player {
  id: string;
  name: string;
}

type CodeGenerator = () => string;
type JoinResult =
  | { ok: true; room: Room; player: Player }
  | { ok: false; reason: "invalid-code" | "invalid-name" | "duplicate-name" | "already-joined" };

function generateRoomCode(): string {
  return Array.from(
    { length: ROOM_CODE_LENGTH },
    () => ROOM_CODE_ALPHABET[randomInt(ROOM_CODE_ALPHABET.length)],
  ).join("");
}

export class RoomStore {
  private readonly rooms = new Map<string, Room>();

  constructor(private readonly codeGenerator: CodeGenerator = generateRoomCode) {}

  create(hostSocketId: string): Room {
    const existingRoom = this.findByHost(hostSocketId);

    if (existingRoom) {
      return existingRoom;
    }

    for (let attempt = 0; attempt < MAX_CODE_ATTEMPTS; attempt += 1) {
      const code = this.codeGenerator();

      if (!this.rooms.has(code)) {
        const room = { code, hostSocketId, players: new Map<string, Player>() };
        this.rooms.set(code, room);
        return room;
      }
    }

    throw new Error("Could not generate a unique room code");
  }

  get(code: string): Room | undefined {
    return this.rooms.get(code.trim().toUpperCase());
  }

  join(code: string, socketId: string, name: string): JoinResult {
    if (this.findPlayerRoom(socketId)) {
      return { ok: false, reason: "already-joined" };
    }

    const room = this.get(code);

    if (!room) {
      return { ok: false, reason: "invalid-code" };
    }

    const normalizedName = name.replace(/\s+/g, " ").trim();

    if (normalizedName.length === 0 || normalizedName.length > 20) {
      return { ok: false, reason: "invalid-name" };
    }

    const normalizedNameKey = normalizedName.toLocaleLowerCase();
    const nameTaken = Array.from(room.players.values()).some(
      (player) => player.name.toLocaleLowerCase() === normalizedNameKey,
    );

    if (nameTaken) {
      return { ok: false, reason: "duplicate-name" };
    }

    const player = { id: socketId, name: normalizedName };
    room.players.set(socketId, player);
    return { ok: true, room, player };
  }

  deleteByHost(hostSocketId: string): Room | undefined {
    const room = this.findByHost(hostSocketId);

    if (room) {
      this.rooms.delete(room.code);
    }

    return room;
  }

  removePlayer(socketId: string): Room | undefined {
    const room = this.findPlayerRoom(socketId);

    if (room) {
      room.players.delete(socketId);
    }

    return room;
  }

  private findByHost(hostSocketId: string): Room | undefined {
    return Array.from(this.rooms.values()).find((room) => room.hostSocketId === hostSocketId);
  }

  private findPlayerRoom(socketId: string): Room | undefined {
    return Array.from(this.rooms.values()).find((room) => room.players.has(socketId));
  }
}
