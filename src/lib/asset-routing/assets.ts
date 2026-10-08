/**
 * Asset registry. An asset is defined independently of any network; each
 * deployment of it on a specific network is an AssetListing.
 *
 * Being tradable on a venue (e.g. Hyperliquid) does NOT make an asset
 * depositable into LamportPay — `intakeEnabled` must be explicitly true.
 */
import { SOL_MINT, USDC_MINT } from "@/lib/tokens";
import type { NetworkId } from "./networks";

export type AssetId = "SOL" | "USDC" | "BTC" | "ETH";
export type AssetClass = "native-l1" | "spl" | "stablecoin" | "major";

export interface AssetInfo {
  id: AssetId;
  symbol: string;
  name: string;
  assetClass: AssetClass;
}

export interface AssetListing {
  asset: AssetId;
  network: NetworkId;
  /** Mint / contract / native identifier on that network. */
  address: string;
  decimals: number;
  /** Explicit allowlist flag for user deposits. Default false. */
  intakeEnabled: boolean;
}

export const SETTLEMENT_ASSET: AssetId = "USDC";

export const ASSETS: Record<AssetId, AssetInfo> = {
  SOL: { id: "SOL", symbol: "SOL", name: "Solana", assetClass: "native-l1" },
  USDC: { id: "USDC", symbol: "USDC", name: "USD Coin", assetClass: "stablecoin" },
  BTC: { id: "BTC", symbol: "BTC", name: "Bitcoin", assetClass: "major" },
  ETH: { id: "ETH", symbol: "ETH", name: "Ether", assetClass: "major" },
};

export const ASSET_LISTINGS: AssetListing[] = [
  { asset: "SOL", network: "solana", address: SOL_MINT, decimals: 9, intakeEnabled: true },
  { asset: "USDC", network: "solana", address: USDC_MINT, decimals: 6, intakeEnabled: false },
  // Planned major assets — architecture only, intake disabled.
  { asset: "BTC", network: "bitcoin", address: "native", decimals: 8, intakeEnabled: false },
  { asset: "ETH", network: "ethereum", address: "native", decimals: 18, intakeEnabled: false },
];

export function findListing(network: string, address: string): AssetListing | undefined {
  return ASSET_LISTINGS.find((l) => l.network === network && l.address === address);
}
