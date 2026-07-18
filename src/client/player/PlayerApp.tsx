import { useEffect, useState } from "react";
import type { CanvasStroke, LobbySnapshot } from "../../shared/protocol";
import { CollaborativeCanvas } from "../CollaborativeCanvas";
import { socket } from "../socket";

export function PlayerApp() {
  const [error, setError] = useState<string>();
  const [joinedAs, setJoinedAs] = useState<{ name: string }>();
  const [lobby, setLobby] = useState<LobbySnapshot>();
  const [strokes, setStrokes] = useState<CanvasStroke[]>([]);
  const [canvasError, setCanvasError] = useState<string>();

  useEffect(() => {
    let retryTimer: number | undefined;

    function joinActiveSession() {
      if (!socket.connected) return;
      socket.timeout(5_000).emit("room:join", (timeoutError, result) => {
        if (timeoutError) {
          setError("The server didn't respond. Retrying…");
          retryTimer = window.setTimeout(joinActiveSession, 1_500);
          return;
        }

        if (result.ok) {
          setJoinedAs({ name: result.name });
          setError(undefined);
          return;
        }

        setError(result.message);
        retryTimer = window.setTimeout(joinActiveSession, 1_500);
      });
    }

    function roomClosed() {
      setJoinedAs(undefined);
      setLobby(undefined);
      setStrokes([]);
      setError("The shared display disconnected, so the room was closed.");
      retryTimer = window.setTimeout(joinActiveSession, 1_500);
    }

    socket.on("lobby:updated", setLobby);
    socket.on("room:closed", roomClosed);
    socket.on("canvas:snapshot", (canvas) => setStrokes(canvas.strokes));
    socket.on("canvas:stroke", (stroke) => {
      setStrokes((current) => current.some(({ id }) => id === stroke.id) ? current : [...current, stroke]);
    });
    socket.on("connect", joinActiveSession);
    socket.connect();
    return () => {
      window.clearTimeout(retryTimer);
      socket.off("lobby:updated", setLobby);
      socket.off("room:closed", roomClosed);
      socket.off("canvas:snapshot");
      socket.off("canvas:stroke");
      socket.off("connect", joinActiveSession);
      socket.disconnect();
    };
  }, []);

  function addStroke(stroke: CanvasStroke) {
    setCanvasError(undefined);
    socket.timeout(5_000).emit("canvas:stroke", stroke, (timeoutError, result) => {
      if (timeoutError) {
        setCanvasError("That stroke didn't reach the shared display. Please try again.");
      } else if (!result.ok) {
        setCanvasError(result.message);
      } else {
        setStrokes((current) => [...current, stroke]);
      }
    });
  }

  return (
    <main className="screen screen--player">
      <p className="eyebrow">Player phone</p>
      {joinedAs ? (
        <section className="joined-card">
          <h1>Draw together</h1>
          <p className="lead">
            Drawing as <strong>{joinedAs.name}</strong>
          </p>
          <div className="shared-canvas">
            <CollaborativeCanvas onStroke={addStroke} strokes={strokes} />
          </div>
          {canvasError && <p className="form-error">{canvasError}</p>}
          {lobby && (
            <div className="phone-lobby" aria-live="polite">
              <h2>Players</h2>
              <ul className="player-list">
                {lobby.players.map((player) => (
                  <li key={player.id}>{player.name}</li>
                ))}
              </ul>
            </div>
          )}
        </section>
      ) : (
        <>
          <h1>Joining…</h1>
          <p className="status">{error ?? "Looking for the active session…"}</p>
        </>
      )}
    </main>
  );
}
