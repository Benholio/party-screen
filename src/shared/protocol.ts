export type CreateRoomResult = { ok: true } | { ok: false; message: string };

export type JoinRoomResult =
  | { ok: true; name: string }
  | { ok: false; message: string };

export interface LobbyPlayer {
  id: string;
  name: string;
}

export interface LobbySnapshot {
  players: LobbyPlayer[];
}

export interface CanvasPoint {
  x: number;
  y: number;
}

export interface CanvasStroke {
  id: string;
  points: CanvasPoint[];
}

export interface CanvasSnapshot {
  strokes: CanvasStroke[];
}

export type CanvasStrokeResult = { ok: true } | { ok: false; message: string };

export interface ClientToServerEvents {
  "room:create": (acknowledge: (result: CreateRoomResult) => void) => void;
  "room:join": (acknowledge: (result: JoinRoomResult) => void) => void;
  "canvas:stroke": (
    stroke: CanvasStroke,
    acknowledge: (result: CanvasStrokeResult) => void,
  ) => void;
}

export interface ServerToClientEvents {
  "lobby:updated": (lobby: LobbySnapshot) => void;
  "room:closed": () => void;
  "canvas:snapshot": (canvas: CanvasSnapshot) => void;
  "canvas:stroke": (stroke: CanvasStroke) => void;
}
