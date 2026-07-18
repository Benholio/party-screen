export type CreateRoomResult =
  | { ok: true; code: string }
  | { ok: false; message: string };

export interface ClientToServerEvents {
  "room:create": (acknowledge: (result: CreateRoomResult) => void) => void;
}

// Server-pushed lobby events are introduced when players can join rooms.
export type ServerToClientEvents = Record<never, never>;
