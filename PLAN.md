# Initial Implementation Plan

This plan describes the smallest vertical slice needed to validate the product vision in `docs/PROJECT.md`. It is intentionally limited to room creation, joining, and a synchronized lobby; it does not define a reusable game framework or implement gameplay.

## Proposed architecture

- A single TypeScript project containing the browser client and Node.js server.
- Two browser entry points or routes:
  - A shared display that creates a room and shows its short code and connected players.
  - A phone interface that accepts a room code and player name, then shows the lobby.
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

### 2. Create rooms

- Add a small in-memory room store.
- Generate a short, server-owned room code and check it for collisions.
- Display the code on the shared screen.
- Test room creation and lookup independently of the network layer.

### 3. Join from a phone

- Add a phone-friendly form for room code and player name.
- Validate and normalize input on the server.
- Return understandable errors for an invalid room or invalid name.
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

## Important tradeoffs or open decisions

- **Single project versus multiple apps:** A single package is proposed because it minimizes setup and makes shared TypeScript types straightforward. This can be revisited if the clients later need independent deployment or substantially different tooling.
- **Socket.IO versus raw WebSockets:** Socket.IO is proposed for faster delivery of the lobby slice. Raw WebSockets would reduce protocol overhead but require more connection, acknowledgement, and room-management code.
- **In-memory state versus persistent storage:** In-memory state is sufficient for the proof of concept, but rooms will disappear when the server restarts and will not span multiple server instances. Persistence is intentionally deferred.
- **Complete snapshots versus incremental updates:** Complete lobby snapshots are simpler and less prone to synchronization errors while rooms are small. Incremental events can wait until state size or update frequency makes them necessary.
- **Connection identity versus persistent player identity:** Using a connection as a player's identity is the simplest initial behavior, but a reconnect may appear as leaving and rejoining. Stable session tokens remain an open decision for gameplay.
- **Room-code format and limits:** Room codes are four uppercase characters using an ambiguity-free alphabet and exist only while their display is connected. Room capacity and player-name rules remain open for the joining milestone.
- **Client routing:** The display and phone interfaces may use simple path detection or a small routing library. This should be decided when establishing the application shell; a routing dependency is not required by the current scope.
- **Host recovery:** The proposed initial behavior closes a room when the display disconnects. Recovering a host session is deferred until real-device testing shows whether it is necessary.
- **Framework boundaries:** No generic game engine, plugin system, phase abstraction, deployment architecture, authentication system, or database is proposed yet. The first playable game should reveal which abstractions are actually useful.

## Current next step

Implement milestone 3: add the phone join form, server-side input validation, and authoritative player membership. Lobby broadcasts and disconnect synchronization remain in milestone 4.
