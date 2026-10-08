/**
 * Provider-independent conversion routing: incoming asset + network → provider → USDC.
 * Pure and client-safe. Does not execute anything; existing Jupiter endpoints
 * remain the only live execution path.
 */
import { ASSETS, SETTLEMENT_ASSET, findListing, type AssetListing } from "./assets";
import { getNetwork } from "./networks";

export type ProviderId = "jupiter" | "hyperliquid";
export type ProviderStatus = "LIVE" | "PLANNED" | "DISABLED";

export interface ConversionProvider {
  id: ProviderId;
  name: string;
  status: ProviderStatus;
  /** Whether this provider can handle the given listing. */
  supports(listing: AssetListing): boolean;
}

export const PROVIDERS: ConversionProvider[] = [
  {
    id: "jupiter",
    name: "Jupiter",
    status: "LIVE",
    supports: (l) => l.network === "solana",
  },
  {
    id: "hyperliquid",
    name: "Hyperliquid",
    status: "PLANNED",
    supports: (l) => ASSETS[l.asset].assetClass === "major",
  },
];

export type RouteDecision =
  | {
      ok: true;
      asset: AssetListing;
      provider: ProviderId;
      providerStatus: ProviderStatus;
      settlementAsset: typeof SETTLEMENT_ASSET;
      executable: boolean;
    }
  | { ok: false; reason: string };

export function resolveConversionRoute(network: string, address: string): RouteDecision {
  if (!getNetwork(network)) return { ok: false, reason: "Unsupported network." };
  const listing = findListing(network, address);
  if (!listing) return { ok: false, reason: "Unknown asset on this network." };
  if (listing.asset === SETTLEMENT_ASSET) {
    return { ok: false, reason: "Asset is already the settlement asset." };
  }
  if (!listing.intakeEnabled) return { ok: false, reason: "Asset intake is not enabled." };
  const provider = PROVIDERS.find((p) => p.supports(listing));
  if (!provider) return { ok: false, reason: "No conversion provider for this asset." };
  return {
    ok: true,
    asset: listing,
    provider: provider.id,
    providerStatus: provider.status,
    settlementAsset: SETTLEMENT_ASSET,
    executable: provider.status === "LIVE",
  };
}

/** Planned route preview for an asset regardless of intake flag (for docs/UI). */
export function plannedProviderFor(listing: AssetListing): ConversionProvider | undefined {
  return PROVIDERS.find((p) => p.supports(listing));
}
