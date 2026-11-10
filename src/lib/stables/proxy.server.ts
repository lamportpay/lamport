/**
 * Stables calls through the fixed-IP forward proxy (STABLES_PROXY_URL), for Stables'
 * production IP allowlist (docs/integrations/stables-fixed-ip.md). Server-only; used by
 * the Stables client alone, so no other traffic (Jupiter, Solana RPC, Supabase) goes
 * through the proxy. HTTPS to Stables is tunnelled (CONNECT), so the proxy never sees
 * the API key or request bodies. A failing proxy fails the call: there is no fallback
 * to a direct, unallowlisted request.
 */
import { ProxyAgent, fetch as undiciFetch } from "undici";

let cached: { url: string; agent: ProxyAgent } | null = null;

function agentFor(proxyUrl: string): ProxyAgent {
  if (cached?.url !== proxyUrl) cached = { url: proxyUrl, agent: new ProxyAgent(proxyUrl) };
  return cached.agent;
}

/** `fetch` to `url` through the proxy at `proxyUrl`. */
export async function fetchViaProxy(
  proxyUrl: string,
  url: string,
  init: RequestInit,
): Promise<Response> {
  const response = await undiciFetch(url, {
    ...(init as Parameters<typeof undiciFetch>[1]),
    dispatcher: agentFor(proxyUrl),
  });
  return response as unknown as Response;
}
