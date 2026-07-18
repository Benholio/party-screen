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

export interface LobbyPlayer {
  id: string;
  name: string;
}

export interface LobbySnapshot {
  code: string;
  players: LobbyPlayer[];
}

export interface ClientToServerEvents {
  "room:create": (acknowledge: (result: CreateRoomResult) => void) => void;
  "room:join": (
    request: JoinRoomRequest,
    acknowledge: (result: JoinRoomResult) => void,
  ) => void;
}

export interface ServerToClientEvents {
  "lobby:updated": (lobby: LobbySnapshot) => void;
  "room:closed": () => void;
}
