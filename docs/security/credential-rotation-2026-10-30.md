# Credential rotation after the shared `.env` (30 Oct 2026)

On 29 Oct a local `.env` was shared in a chat session. Treat every secret in it as exposed. This is
the checklist to replace them, prove the replacements work, and only then revoke the old ones.
No values, and no fingerprints of the old values, are written here; the owner's private report
lists the old fingerprints to compare against.

**Scope:** development and test credentials only. Stables **production** credentials do not exist
yet and are not part of this. Nothing here enables LIVE mode.

**What was checked (30 Oct):** none of the shared values appears anywhere in the git history of
any branch (exact-value search over all refs), so the exposure is the chat upload plus the copies
in Vercel (encrypted, Preview and branch-scoped) and in local `.env` files.

## Order for every credential

1. **Create** the new credential in the provider's dashboard (keep the old one working).
2. **Replace** it everywhere it is used (table below): Vercel Preview variable (Settings →
   Environment Variables → edit the value only; keep Preview + branch `vercel-preview-migration`),
   every developer's local `.env`, and Lovable's project secrets **if** the live site uses the
   same credential (owner checks; production is not touched otherwise).
3. **Verify** locally: `node --env-file=.env scripts/verify-credentials.mjs` must show `OK` and a
   fingerprint different from the old one. Then ask for a Preview redeploy and check.
4. **Revoke** the old credential in the provider's dashboard.
5. **Re-verify** (script and Preview) to prove nothing still depended on the old one.

Never paste a credential into chat, a ticket, a commit or a document.

## Checklist

| # | Credential (variables) | Where it is used | Create / revoke in | How to verify | Notes |
|---|---|---|---|---|---|
| 1 | Supabase **secret** key (`SUPABASE_SERVICE_ROLE_KEY`) | Server only: Vercel Preview, local `.env` | Supabase → project → Project Settings → API Keys → Secret keys | Script: "server read accepted"; Supabase logs show the new key prefix with HTTP 200 | The key in the shared file (prefix `sb_secret_jgY7p`) is **not registered** on the dev project. Look for that prefix in **every** Supabase project you control and delete it there. The key now on the Preview (`sb_secret_G_1KH`) was entered directly in Vercel and was not shared: no rotation needed |
| 2 | Supabase publishable key (`SUPABASE_PUBLISHABLE_KEY`, `VITE_…`) | Browser bundle (public by design) | – | Script: "accepted by the project" | Not a secret; rotation optional |
| 3 | Alchemy Solana RPC keys (`SOLANA_DEVNET_RPC_URL`, `SOLANA_RPC_URL`; the key is the last path segment) | Devnet: Vercel Preview + local. Mainnet: local only (LIVE only, deliberately not in Vercel) | Alchemy dashboard → Apps → create a new app/key for each network; delete the old app/key | Script: genesis hash = devnet / mainnet; Preview `/api/solana/health?cluster=devnet` reachable via Alchemy | Read-only RPC; mainnet is blocked in TEST mode |
| 4 | Jupiter API key (`JUPITER_API_KEY`) | Vercel Preview + local | portal.jup.ag → API keys | Script: "quote accepted"; a quote on the Preview `/pay` page | Quotes only in TEST mode |
| 5 | Stables **sandbox** API key (`STABLES_API_KEY`, `sti_test_…`) | Vercel Preview + local | Stables sandbox dashboard → API keys | Script: "sandbox read accepted"; a sandbox quote on the Preview | Never create or touch production (`sti_live_`) keys here |
| 6 | Stables sandbox webhook secret (`STABLES_WEBHOOK_SECRET`, `whsec_…`) | Vercel Preview + local | Stables sandbox dashboard → Webhooks → endpoint → rotate signing secret | Script: format; then "send test event" → endpoint answers 200 | Svix keeps the old secret valid for a short overlap and signs with both; `src/lib/stables/webhook.server.ts` accepts either signature, so update Vercel and local within the overlap. Check which URL the sandbox endpoint points to (the Preview needs Vercel's protection bypass to receive it) |
| 7 | Cron secret (`CRON_SECRET`) | Vercel Preview + local; Vercel's cron sends it automatically | Generate locally: `openssl rand -hex 32` | Script: length; `/api/cron/reconcile-payments` with the new secret → 200, with the old → 401 | For a caller you cannot update at once, set the old value as `CRON_SECRET_PREVIOUS` (accepted by `src/lib/cron-auth.server.ts`), then remove it. The dev database's pg_cron job has no URL or secret in Vault (runs as a no-op), so nothing to update there |

**Not secrets** (no rotation): `SUPABASE_URL`, `SUPABASE_PROJECT_ID`, `STABLES_API_URL`,
`LAMPORTPAY_REVENUE_WALLET` (a public address), fee and limit values, `LAMPORTPAY_MODE`.

## What Claude can do in this process

Redeploy the Preview after you update a Vercel value; check the Preview's endpoints and the
Supabase logs (key prefix and status only); run the verification script's checks against mocks
in CI. Claude never needs, and should never be given, a credential value.
