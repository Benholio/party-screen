import { useEffect, useState } from "react";
import type { CreateRoomResult, LobbySnapshot } from "../../shared/protocol";
import { socket } from "../socket";

export function DisplayApp() {
  const [code, setCode] = useState<string>();
  const [error, setError] = useState<string>();
  const [lobby, setLobby] = useState<LobbySnapshot>();

  useEffect(() => {
    function createRoom() {
      setError(undefined);
      socket.emit("room:create", (result: CreateRoomResult) => {
        if (result.ok) {
          setCode(result.code);
        } else {
          setError(result.message);
        }
      });
    }

    socket.on("connect", createRoom);
    socket.on("lobby:updated", setLobby);
    socket.connect();

    return () => {
      socket.off("connect", createRoom);
      socket.off("lobby:updated", setLobby);
      socket.disconnect();
    };
  }, []);

  return (
    <main className="screen screen--display">
      <p className="eyebrow">Shared display</p>
      <h1>Join the party</h1>
      {error ? (
        <p className="status status--error">{error}</p>
      ) : code ? (
        <>
          <p className="lead">Enter this room code on your phone</p>
          <p className="room-code" aria-label={`Room code ${code}`}>
            {code}
          </p>
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
        </>
      ) : (
        <p className="status">Creating your room…</p>
      )}
    </main>
  );
}
