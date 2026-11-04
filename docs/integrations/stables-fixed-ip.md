# Stables production: one fixed outbound IP (investigated 4 Nov 2026)

Stables accepts production (`sti_live_`) API calls only from allowlisted server IPs (production
checklist step 2; dashboard "AI agents" page, checked 3 Nov). Nothing below has been bought,
created or configured. No IP is fixed until it is verified with a request seen by Stables.

## What the app does today

All Stables calls are server-side `fetch` in `src/lib/stables/client.server.ts`, to
`STABLES_API_URL` (`src/lib/stables/config.server.ts`). Vercel Functions call it directly, so the
source IP is whatever Vercel uses at that moment.

## Options (sources: vercel.com/docs/networking/static-ips, read 4 Nov)

| Option | Fixed IPs | Plan and cost | Notes |
| --- | --- | --- | --- |
| Vercel today (Hobby, no add-on) | None: outbound IPs are dynamic | – | Cannot be allowlisted |
| Vercel Static IPs | A **pair** of IPs per configured region, from a pool **shared** with a small group of other customers | Pro or Enterprise only; $100/month per project plus Private Data Transfer | Project-wide: applies to every environment (Preview too) and all function egress; not middleware. Not one IP |
| Vercel Secure Compute | Dedicated | Enterprise only, custom pricing | Beyond current needs |
| Hosted fixed-IP proxy service | Depends on the provider and plan (not verified) | Monthly fee; works on Hobby | A third party sits in the traffic path; check dedicated vs shared IP, IP count, region, uptime terms |
| Own small server as forward proxy | **One** reserved static IPv4 | Server cost only | LamportPay runs it: patching, monitoring, availability |

## Recommendation

For exactly **one** fixed public IPv4: a small server with a reserved static IPv4 running an
HTTPS forward proxy that is restricted to `CONNECT api.stables.money:443`, requires proxy
credentials, and is firewalled. TLS stays end-to-end between the app and Stables, so the proxy
never sees the Stables API key or request bodies. If it is down, Stables calls fail and payments
stop safely (no fallback to a direct, unallowlisted call).

If a managed service is preferred over running a server: Vercel Static IPs (needs Pro; two shared
IPs per region, both allowlisted), after Stables confirms that two IPs are acceptable.

## Code change once an option is approved (not implemented yet)

Route only the Stables client through the proxy: a server-only `STABLES_PROXY_URL` (secret,
includes the proxy credentials), used for `fetch` in `client.server.ts` alone; LIVE refuses to run
without it once required. Jupiter, Solana RPC and Supabase traffic stay direct. Tests: the proxy is
used only for Stables, never for other hosts, and an unreachable proxy fails closed.

## Questions for Stables

- How many IPs can be allowlisted, and are IPs shared with other customers acceptable?
- IPv4 only, or IPv6 as well?
- Does the allowlist also apply to webhooks we receive? (Webhooks are inbound and do not use
  the outbound IP.)
