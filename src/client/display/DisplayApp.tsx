import { useEffect, useState } from "react";
import type {
  CanvasStroke,
  CreateRoomResult,
  LobbySnapshot,
} from "../../shared/protocol";
import { CollaborativeCanvas } from "../CollaborativeCanvas";
import { socket } from "../socket";
import { JoinQrCode } from "./JoinQrCode";

export function DisplayApp() {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string>();
  const [lobby, setLobby] = useState<LobbySnapshot>();
  const [strokes, setStrokes] = useState<CanvasStroke[]>([]);
  const [joinUrl, setJoinUrl] = useState<string>();

  useEffect(() => {
    function createRoom() {
      setError(undefined);
      socket.emit("room:create", (result: CreateRoomResult) => {
        if (result.ok) {
          setReady(true);
        } else {
          setError(result.message);
        }
      });
    }

    socket.on("connect", createRoom);
    socket.on("lobby:updated", setLobby);
    socket.on("app:config", ({ joinUrl: nextJoinUrl }) => setJoinUrl(nextJoinUrl));
    socket.on("canvas:snapshot", (canvas) => setStrokes(canvas.strokes));
    socket.on("canvas:stroke", (stroke) => {
      setStrokes((current) => current.some(({ id }) => id === stroke.id) ? current : [...current, stroke]);
    });
    socket.connect();

    return () => {
      socket.off("connect", createRoom);
      socket.off("lobby:updated", setLobby);
      socket.off("app:config");
      socket.off("canvas:snapshot");
      socket.off("canvas:stroke");
      socket.disconnect();
    };
  }, []);

  return (
    <main className="screen screen--display">
      {error ? (
        <>
          <p className="eyebrow">Shared display</p>
          <p className="status status--error">{error}</p>
        </>
      ) : ready ? (
        <div className="display-layout">
          <aside className="display-sidebar">
            <p className="eyebrow">Shared display</p>
            <h1>Creative mode</h1>
            <p className="lead">Join anytime and draw together</p>
            {joinUrl && <JoinQrCode joinUrl={joinUrl} />}
            <section className="lobby" aria-live="polite">
              <h2>
                {lobby?.players.length
                  ? `${lobby.players.length} player${lobby.players.length === 1 ? "" : "s"}`
                  : "Waiting for players…"}
              </h2>
              {lobby && lobby.players.length > 0 && (
                <ul className="player-list">
                  {lobby.players.map((player) => (
                    <li key={player.id}>{player.name}</li>
                  ))}
                </ul>
              )}
            </section>
          </aside>
          <div className="shared-canvas shared-canvas--display">
            <CollaborativeCanvas strokes={strokes} />
          </div>
        </div>
      ) : (
        <>
          <p className="eyebrow">Shared display</p>
          <p className="status">Creating the shared canvas…</p>
        </>
      )}
    </main>
  );
}
