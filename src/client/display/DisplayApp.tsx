import { useEffect, useState } from "react";
import type { CreateRoomResult } from "../../shared/protocol";
import { socket } from "../socket";

export function DisplayApp() {
  const [code, setCode] = useState<string>();
  const [error, setError] = useState<string>();

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
    socket.connect();

    return () => {
      socket.off("connect", createRoom);
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
        </>
      ) : (
        <p className="status">Creating your room…</p>
      )}
    </main>
  );
}
