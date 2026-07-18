import { DisplayApp } from "./display/DisplayApp";
import { PlayerApp } from "./player/PlayerApp";

export function App() {
  return window.location.pathname.startsWith("/play") ? <PlayerApp /> : <DisplayApp />;
}
