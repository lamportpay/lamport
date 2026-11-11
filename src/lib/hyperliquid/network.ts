/**
 * Which Hyperliquid network the app uses (owner decision, 11 Nov 2026): it
 * follows the app mode. TEST MODE uses the testnet; LIVE MODE uses mainnet
 * (real funds, the customer's own wallet signs). Shared by browser and server.
 */
export type HlNetwork = "testnet" | "mainnet";

export const HL_API_BASE: Record<HlNetwork, string> = {
  testnet: "https://api.hyperliquid-testnet.xyz",
  mainnet: "https://api.hyperliquid.xyz",
};

/** `hyperliquidChain` in user-signed actions (Hyperliquid docs: signing). */
export const HL_CHAIN: Record<HlNetwork, "Testnet" | "Mainnet"> = {
  testnet: "Testnet",
  mainnet: "Mainnet",
};

/** `source` of the phantom agent for L1 actions: "a" on mainnet, "b" on testnet. */
export const HL_SOURCE: Record<HlNetwork, "a" | "b"> = { testnet: "b", mainnet: "a" };

/** Name shown for the browser trading key in the customer's Hyperliquid account. */
export const HL_AGENT_NAME: Record<HlNetwork, string> = {
  testnet: "lamportpay-test",
  mainnet: "lamportpay",
};

/** Value stored in hyperliquid_test_events.network. */
export const HL_TRACKING_NETWORK: Record<HlNetwork, string> = {
  testnet: "hyperliquid-testnet",
  mainnet: "hyperliquid-mainnet",
};

export function networkForMode(mode: "test" | "live"): HlNetwork {
  return mode === "live" ? "mainnet" : "testnet";
}

export function networkOfChain(chain: "Testnet" | "Mainnet"): HlNetwork {
  return chain === "Mainnet" ? "mainnet" : "testnet";
}
