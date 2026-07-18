import type { CanvasStroke } from "../shared/protocol.js";

export interface Room {
  hostSocketId: string;
  players: Map<string, Player>;
  strokes: CanvasStroke[];
}

export interface Player {
  id: string;
  name: string;
}

type JoinResult =
  | { ok: true; room: Room; player: Player }
  | { ok: false; reason: "no-active-room" };

export class RoomStore {
  private activeRoom?: Room;

  create(hostSocketId: string): Room {
    if (this.activeRoom) return this.activeRoom;
    this.activeRoom = {
      hostSocketId,
      players: new Map<string, Player>(),
      strokes: [],
    };
    return this.activeRoom;
  }

  getActive(): Room | undefined {
    return this.activeRoom;
  }

  joinActive(socketId: string): JoinResult {
    const existingRoom = this.findPlayerRoom(socketId);
    if (existingRoom) {
      return { ok: true, room: existingRoom, player: existingRoom.players.get(socketId)! };
    }

    const room = this.activeRoom;
    if (!room) {
      return { ok: false, reason: "no-active-room" };
    }

    let playerNumber = 1;
    const names = new Set(Array.from(room.players.values(), ({ name }) => name));
    while (names.has(`Player ${playerNumber}`)) {
      playerNumber += 1;
    }

    const player = { id: socketId, name: `Player ${playerNumber}` };
    room.players.set(socketId, player);
    return { ok: true, room, player };
  }

  addStroke(socketId: string, stroke: CanvasStroke): Room | undefined {
    const room = this.findPlayerRoom(socketId);
    if (!room || room.strokes.length >= 5_000 || room.strokes.some(({ id }) => id === stroke.id)) {
      return undefined;
    }

    const valid = stroke.id.length <= 100 && stroke.points.length >= 2 && stroke.points.length <= 500
      && stroke.points.every(({ x, y }) => Number.isFinite(x) && Number.isFinite(y)
        && x >= 0 && x <= 1 && y >= 0 && y <= 1);
    if (!valid) return undefined;

    room.strokes.push(stroke);
    return room;
  }

  deleteByHost(hostSocketId: string): Room | undefined {
    const room = this.activeRoom?.hostSocketId === hostSocketId ? this.activeRoom : undefined;
    if (room) this.activeRoom = undefined;

    return room;
  }

  removePlayer(socketId: string): Room | undefined {
    const room = this.findPlayerRoom(socketId);

    if (room) {
      room.players.delete(socketId);
    }

    return room;
  }

  private findPlayerRoom(socketId: string): Room | undefined {
    return this.activeRoom?.players.has(socketId) ? this.activeRoom : undefined;
  }
}
