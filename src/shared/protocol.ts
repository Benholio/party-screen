export type CreateRoomResult =
  | { ok: true; code: string }
  | { ok: false; message: string };

export interface JoinRoomRequest {
  code: string;
  name: string;
}

export type JoinRoomResult =
  | { ok: true; code: string; name: string }
  | { ok: false; message: string };

export interface ClientToServerEvents {
  "room:create": (acknowledge: (result: CreateRoomResult) => void) => void;
  "room:join": (
    request: JoinRoomRequest,
    acknowledge: (result: JoinRoomResult) => void,
  ) => void;
}

// Server-pushed lobby events are introduced when players can join rooms.
export type ServerToClientEvents = Record<never, never>;
