import { type FormEvent, useEffect, useState } from "react";
import type { LobbySnapshot } from "../../shared/protocol";
import { socket } from "../socket";

export function PlayerApp() {
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string>();
  const [joining, setJoining] = useState(false);
  const [joinedAs, setJoinedAs] = useState<{ code: string; name: string }>();
  const [lobby, setLobby] = useState<LobbySnapshot>();

  useEffect(() => {
    function roomClosed() {
      setJoinedAs(undefined);
      setLobby(undefined);
      setError("The shared display disconnected, so the room was closed.");
    }

    socket.on("lobby:updated", setLobby);
    socket.on("room:closed", roomClosed);
    socket.connect();
    return () => {
      socket.off("lobby:updated", setLobby);
      socket.off("room:closed", roomClosed);
      socket.disconnect();
    };
  }, []);

  function joinRoom(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(undefined);

    if (!socket.connected) {
      setError("Still connecting. Please try again.");
      return;
    }

    setJoining(true);
    socket.timeout(5_000).emit("room:join", { code, name }, (timeoutError, result) => {
      setJoining(false);

      if (timeoutError) {
        setError("The server didn't respond. Please try again.");
        return;
      }

      if (result.ok) {
        setJoinedAs({ code: result.code, name: result.name });
      } else {
        setError(result.message);
      }
    });
  }

  return (
    <main className="screen screen--player">
      <p className="eyebrow">Player phone</p>
      {joinedAs ? (
        <section className="joined-card">
          <h1>You're in!</h1>
          <p className="lead">
            Playing as <strong>{joinedAs.name}</strong> in room {joinedAs.code}
          </p>
          <p className="status">Look at the shared screen to continue.</p>
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
          <h1>Join the party</h1>
          <form className="join-form" onSubmit={joinRoom}>
            <label>
              Room code
              <input
                autoCapitalize="characters"
                autoComplete="off"
                maxLength={4}
                name="code"
                onChange={(event) => setCode(event.target.value.toUpperCase())}
                placeholder="ABCD"
                required
                spellCheck={false}
                value={code}
              />
            </label>
            <label>
              Your name
              <input
                autoComplete="nickname"
                maxLength={20}
                name="name"
                onChange={(event) => setName(event.target.value)}
                placeholder="Sam"
                required
                value={name}
              />
            </label>
            {error && <p className="form-error">{error}</p>}
            <button disabled={joining} type="submit">
              {joining ? "Joining…" : "Join room"}
            </button>
          </form>
        </>
      )}
    </main>
  );
}
