# Stables production: one fixed outbound IP (investigated 4 Nov 2026)

Stables accepts production (`sti_live_`) API calls only from allowlisted server IPs (production
checklist step 2; dashboard "AI agents" page, checked 3 Nov). The proxy server now exists (Oracle
Always Free, $0; see "Server created (7 Nov 2026)" below). The IP counts as working only once Stables
has allowlisted it and a production request has gone through.

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

## Code (implemented 4 Nov)

`STABLES_PROXY_URL` (server-only secret; may hold proxy credentials) routes the Stables client,
and nothing else, through the proxy (`src/lib/stables/proxy.server.ts`, `undici` ProxyAgent).
Unset means direct calls, so local TEST work is unchanged. An invalid value leaves Stables
unconfigured with a message that never repeats the value. Jupiter, Solana RPC and Supabase stay
direct. Tests (`tests/stables-proxy.unit.test.ts`): proxied calls never go direct, unproxied calls
never use the proxy, and an unreachable proxy fails the call with no direct fallback. Since 5 Nov
LIVE refuses to start without `STABLES_PROXY_URL`.

## Questions for Stables

- How many IPs can be allowlisted, and are IPs shared with other customers acceptable?
- IPv4 only, or IPv6 as well?
- Does the allowlist also apply to webhooks we receive? (Webhooks are inbound and do not use
  the outbound IP.)

## Server created (7 Nov 2026)

| Item | Value |
| --- | --- |
| Provider | Oracle Cloud Infrastructure, Always Free, tenancy `ghazanfargwi`, home region India West (Mumbai) `ap-mumbai-1` |
| Instance | `lamportpay-stables-proxy`, VM.Standard.E2.1.Micro (Always Free-eligible), Ubuntu 24.04 Minimal |
| **Fixed outbound IPv4** | **130.210.11.66** (reserved public IP `lamportpay-stables-proxy-ip`; it stays with the tenancy even if the instance is rebuilt) |
| Proxy | Squid on TCP 3129, set up by `infra/stables-proxy/setup-stables-proxy.sh` |
| Rules | HTTPS `CONNECT` to port 443 of `api.stables.money` and `api.sandbox.stables.money` only; proxy password required; no caching; no client address forwarded |
| Firewall | OCI security list: TCP 22 (SSH) and TCP 3129 from anywhere; host iptables the same; everything else rejected |
| Updates | Ubuntu unattended security upgrades on |
| SSH | Key `lamportpay_proxy_ed25519` on the owner's Windows PC (`%USERPROFILE%\.ssh`), user `ubuntu` |
| `STABLES_PROXY_URL` | Saved only on the owner's PC: `C:\LamportPay\secrets\stables-proxy-url.txt` (form `http://lamportpay:<password>@130.210.11.66:3129`). It goes into Vercel → Production only; never into the repository or chat |

### Verified 7 Nov (from the owner's PC)

| Test | Result |
| --- | --- |
| Proxy with password → `api.sandbox.stables.money` | Tunnel opened (CONNECT 200); Stables answered |
| Proxy with password → `api.stables.money` | Tunnel opened (CONNECT 200); Stables answered 403 (expected until the IP is allowlisted) |
| Proxy without password | Refused (407) |
| Proxy with password → any other site | Refused (403) |
| Plain HTTP through the proxy | Refused (403) |
| The app's own client (`undici` ProxyAgent with the URL) | Works (Stables sandbox answered) |
| Server's outbound IP (`ifconfig.me` from the server) | 130.210.11.66 |

### Still to do

1. Stables allowlists **130.210.11.66** for the production key (request drafted; ask also whether webhooks need anything).
2. `STABLES_PROXY_URL` added to Vercel → Production (owner, from the file above).
3. First production call through the proxy, checked in the Squid log and the Stables dashboard.

### Known limits and follow-ups

- **Idle reclaim:** Oracle may reclaim Always Free instances that stay idle for 7 days (CPU, network
  under 20 %). The proxy is mostly idle. Upgrading the Oracle account to Pay As You Go removes this
  while Always Free resources stay at no cost. The reserved IP survives a reclaim; only the instance
  would need recreating with the setup script.
- **Proxy password in transit:** the app talks to the proxy over plain HTTP before the encrypted
  tunnel starts, so the proxy password crosses the internet unencrypted (the Stables API key and all
  Stables data stay inside TLS). Someone who captured it could only open tunnels to Stables from this
  IP, still without our API key. Hardening option: a TLS proxy port with a certificate for a
  subdomain such as `proxy.lamportpay.com` (needs a DNS record, so owner approval).
- **Single server:** if it is down, Stables calls fail closed (no direct fallback). Uptime check and
  alert to be added with the operations alerts channel.

### Operations

- Rotate the proxy password: generate a new one on the PC, load it with
  `sudo htpasswd -i /etc/squid/passwords lamportpay` (password on stdin), `sudo systemctl reload squid`,
  then update `STABLES_PROXY_URL` in Vercel.
- Logs: `/var/log/squid/access.log` (time, client, method, host, status, bytes; no bodies).
- Rebuild: create an E2.1.Micro Ubuntu 24.04 instance, attach the reserved IP, open TCP 3129, run the
  setup script, load the password.
