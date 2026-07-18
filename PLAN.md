# Initial Implementation Plan

This plan describes the smallest vertical slice needed to validate the product vision in `docs/PROJECT.md`. It is intentionally limited to room creation, joining, and a synchronized lobby; it does not define a reusable game framework or implement gameplay.

## Proposed architecture

- A single TypeScript project containing the browser client and Node.js server.
- Two browser entry points or routes:
  - A shared display that creates the active session and shows connected players.
  - A phone interface that automatically joins the active session with a temporary name.
- A Node.js server that serves the application, owns room state, validates client actions, and sends lobby updates in real time.
- Socket.IO as the proposed real-time transport. It provides connections, room broadcasts, acknowledgements, and reconnection behavior without building those mechanisms directly on raw WebSockets.
- In-memory room storage for the initial slice. The server is authoritative, and clients render the latest lobby state sent by it.
- React with Vite as the proposed browser stack. React is useful for state-driven screens, while Vite keeps the development and build setup small.
- Plain CSS for the initial interface. No component library or design system is needed yet.

The first protocol should contain only the actions required by the lobby: create a room, join a room, receive a lobby update, and learn that a room has closed. Expected create and join results can use Socket.IO acknowledgements rather than a separate general-purpose error system.

## Initial project structure

```text
party-screen/
├── src/
│   ├── client/
│   │   ├── display/
│   │   │   └── DisplayApp.tsx
│   │   ├── player/
│   │   │   └── PlayerApp.tsx
│   │   ├── main.tsx
│   │   ├── socket.ts
│   │   └── styles.css
│   ├── server/
│   │   ├── index.ts
│   │   ├── room-store.ts
│   │   └── socket-handlers.ts
│   └── shared/
│       └── protocol.ts
├── tests/
│   ├── room-store.test.ts
│   └── lobby.integration.test.ts
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

This is one package rather than a monorepo. `shared/protocol.ts` should hold only the event payload and lobby-state types used by both sides. More layers or packages should be introduced only after repeated needs appear.

## MVP milestones

### 1. Establish the application shell

- Configure TypeScript, the browser build, the Node.js server, and development scripts.
- Add separate shared-display and phone screens with placeholder content.
- Configure linting, type checking, and the initial test runner.
- Confirm the server can serve a production browser build.

### 2. Create the active session

- Add a small in-memory session store.
- Let the shared display create the single active session.
- Test session creation and lookup independently of the network layer.

### 3. Join from a phone

- Automatically discover and join the active session without phone input.
- Assign a temporary player name on the server.
- Retry while no shared display session is available.
- Add the player to the authoritative room state after a valid join.

### 4. Synchronize the lobby

- Broadcast a complete lobby snapshot whenever membership changes.
- Show connected players on the shared display and phone interface.
- Remove a player when their connection ends and broadcast the updated lobby.
- Close the room when its shared-display connection ends for the initial version.
- Add an integration test covering create, join, update, and disconnect.

### 5. Verify the vertical slice on real devices

- Run the application on a local network and join from at least one phone.
- Check readability on a shared display and touch usability on a phone.
- Document local development, build, and manual verification steps.
- Run tests, linting, and type checking.

This milestone completes the initial proof of concept. Gameplay should begin as a separate follow-up slice.

**Status:** Complete. The shared display was verified on a second computer and the player interface on a phone over the same local network. No essential usability blockers were found during this check.

## Important tradeoffs or open decisions

- **Single project versus multiple apps:** A single package is proposed because it minimizes setup and makes shared TypeScript types straightforward. This can be revisited if the clients later need independent deployment or substantially different tooling.
- **Socket.IO versus raw WebSockets:** Socket.IO is proposed for faster delivery of the lobby slice. Raw WebSockets would reduce protocol overhead but require more connection, acknowledgement, and room-management code.
- **In-memory state versus persistent storage:** In-memory state is sufficient for the proof of concept, but rooms will disappear when the server restarts and will not span multiple server instances. Persistence is intentionally deferred.
- **Complete snapshots versus incremental updates:** Complete lobby snapshots are simpler and less prone to synchronization errors while rooms are small. Incremental events can wait until state size or update frequency makes them necessary.
- **Connection identity versus persistent player identity:** Using a connection as a player's identity is the simplest initial behavior, but a reconnect may appear as leaving and rejoining. Stable session tokens remain an open decision for gameplay.
- **Session discovery and limits:** The MVP exposes one active session, so phones can join without codes or input. The server assigns temporary `Player N` names. Multiple simultaneous sessions, custom names, and a player-capacity limit remain open.
- **Client routing:** The MVP uses simple path detection for `/display` and `/play`, avoiding a routing dependency. This can be revisited if navigation becomes more complex.
- **Host recovery:** The proposed initial behavior closes a room when the display disconnects. Recovering a host session is deferred until real-device testing shows whether it is necessary.
- **Framework boundaries:** No generic game engine, plugin system, phase abstraction, deployment architecture, authentication system, or database is proposed yet. The first playable game should reveal which abstractions are actually useful.

## Current next step

Creative mode is the active gameplay direction: one automatically discoverable active session, an always-open shared canvas, ephemeral server-held strokes, server-assigned temporary player names, and late joining. Verify the zero-input join flow and multi-device collaboration before considering optional naming and image saving. Timers, prompts, rounds, submissions, reveals, and scoring are intentionally out of scope.
