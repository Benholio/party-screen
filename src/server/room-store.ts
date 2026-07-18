import { randomInt } from "node:crypto";

const ROOM_CODE_ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";
const ROOM_CODE_LENGTH = 4;
const MAX_CODE_ATTEMPTS = 100;

export interface Room {
  code: string;
  hostSocketId: string;
}

type CodeGenerator = () => string;

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
        const room = { code, hostSocketId };
        this.rooms.set(code, room);
        return room;
      }
    }

    throw new Error("Could not generate a unique room code");
  }

  get(code: string): Room | undefined {
    return this.rooms.get(code);
  }

  deleteByHost(hostSocketId: string): boolean {
    const room = this.findByHost(hostSocketId);
    return room ? this.rooms.delete(room.code) : false;
  }

  private findByHost(hostSocketId: string): Room | undefined {
    return Array.from(this.rooms.values()).find((room) => room.hostSocketId === hostSocketId);
  }
}
