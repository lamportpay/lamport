// Solana web3.js / wallet adapters expect Node's Buffer + `global` in the browser.
// Import this module BEFORE any @solana/* import.
import { Buffer } from "buffer";

export function installBufferPolyfill() {
  const g = globalThis as unknown as { Buffer?: typeof Buffer; global?: unknown };
  if (typeof g.Buffer === "undefined") g.Buffer = Buffer;
  if (typeof g.global === "undefined") g.global = globalThis;
}

installBufferPolyfill();

export {};