# Party Screen

An early TypeScript prototype for a second-screen party game: a shared browser display, phone-based player interfaces, and a Node.js real-time server.

## Development

```sh
npm install
npm run dev
```

Open `http://localhost:5173/display` for the shared display and `http://localhost:5173/play` for the phone interface. Vite proxies real-time connections to the Node.js server on port 3000.

To test from another device on the same network, use the network URL printed by Vite and ensure the development machine allows incoming connections.

## Checks

```sh
npm run lint
npm run typecheck
npm test
npm run build
```

To run the production build locally:

```sh
npm run build
npm start
```

Then open `http://localhost:3000/display` or `http://localhost:3000/play`.
