/**
 * Network (blockchain) registry — kept separate from asset definitions.
 * Client-safe: no secrets.
 */
export type NetworkId = "solana" | "bitcoin" | "ethereum" | "hyperliquid";

export type NetworkStatus = "LIVE" | "PLANNED" | "DISABLED";

export interface NetworkInfo {
  id: NetworkId;
  name: string;
  family: "svm" | "evm" | "utxo" | "hypercore";
  status: NetworkStatus;
}

export const NETWORKS: Record<NetworkId, NetworkInfo> = {
  solana: { id: "solana", name: "Solana", family: "svm", status: "LIVE" },
  bitcoin: { id: "bitcoin", name: "Bitcoin", family: "utxo", status: "PLANNED" },
  ethereum: { id: "ethereum", name: "Ethereum", family: "evm", status: "PLANNED" },
  hyperliquid: { id: "hyperliquid", name: "Hyperliquid", family: "hypercore", status: "PLANNED" },
};

export function getNetwork(id: string): NetworkInfo | undefined {
  return (NETWORKS as Record<string, NetworkInfo>)[id];
}
