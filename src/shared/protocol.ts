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

export const DRAWING_COLORS = [
  { name: "Ink", value: "#17132b" },
  { name: "Red", value: "#ef476f" },
  { name: "Orange", value: "#f78c35" },
  { name: "Yellow", value: "#ffd166" },
  { name: "Green", value: "#43aa8b" },
  { name: "Blue", value: "#3787ff" },
  { name: "Purple", value: "#8b5cf6" },
] as const;

export interface CanvasStroke {
  color: string;
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
  "app:config": (config: { joinUrl: string }) => void;
  "lobby:updated": (lobby: LobbySnapshot) => void;
  "room:closed": () => void;
  "canvas:snapshot": (canvas: CanvasSnapshot) => void;
  "canvas:stroke": (stroke: CanvasStroke) => void;
}
