<!-- LOVABLE:BEGIN -->

> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

<!-- LOVABLE:END -->

- Stables is the sole payout infrastructure provider shown publicly; keep fiat payout and KYC labeled demo/disabled until production approval.
- Keep the educational payment journey, costs and mode disclaimer in shared content for the How it works, Workflow, Whitepaper and Docs pages so their explanations remain consistent.
- Keep public roadmap milestones in shared content for the homepage and whitepaper; animate the timeline only on viewport entry and respect reduced motion, so wording remains consistent and accessible.
- Treat interrupted HTTP connections as expected cancellations, not reportable SSR failures, so navigation cannot trigger a false crash screen.
- Asset intake routing lives in src/lib/asset-routing (networks separate from assets; providers selected by listing; intake requires explicit allowlist) so new conversion providers plug in without touching the live Jupiter endpoints.
- Lovable Cloud serves preview and production from one shared Supabase instance (LAMPORTPAY_SHARED_DB=1); the two-database TEST-mode rule is relaxed accordingly, never with a production database.
- Country flags in site UI are drawn as inline SVG rather than Unicode emoji, because emoji flags do not render on every desktop OS.
- Customer wallet sign-in is verified by our own server route (`/api/wallet/sign-in`: SIWS-style message, origin + age + Ed25519 check, one-time signature, wallet recorded in app_metadata.wallet_solana and user_wallets) because the backend's built-in Web3 provider cannot be enabled on Lovable Cloud; wallet accounts use a non-deliverable placeholder email that is never treated as a real email.
- A wallet becomes permanently verified after its first COMPLETED payment (DB trigger fills `verified_wallets`); `getKycStatus` then skips the verification step without re-asking Stables, because a completed Stables payout already proves verification.
- Buffer is resolved per build target by the `lamportpay-node-buffer-browser-shim` plugin in `vite.config.ts` (no `resolve.alias` entries for `buffer`/`node:buffer`/`lamportpay-real-buffer`): the browser gets the real `buffer` package through the private name `lamportpay-real-buffer` (never `buffer/index.js`, which Nitro's Cloudflare preset re-aliases to a minimal mock lacking `writeUIntLE` and breaking wallet signing), while the server/SSR build must resolve it to `src/lib/buffer-server-buffer.ts`, which re-exports Node's native Buffer. Bundling the browser package into the server bundle makes its CommonJS `require("base64-js")` become a `createRequire` call the edge worker cannot resolve, which 500s every server-rendered page (11 Oct 2026, main domain).
- package-lock.json must stay in sync with package.json because CI installs with `npm ci`; dependencies are often added with bun, which does not update the npm lock file. `.github/workflows/lockfile.yml` auto-regenerates and commits the lock file on any main-branch push that touches package.json, so the follow-up commit's CI run is green.
- `scripts/check-client-bundle.mjs` scans only browser-facing build output (`dist/client`, not all of `dist`), because the server bundle legitimately reads secret env names and would otherwise fail every build; the browser bundle must never contain them.
- Platform-generated files under `src/integrations/supabase/` are hand-edited never, so a lint finding inside one is fixed by adding that file to the ignores list in `eslint.config.js`, not by editing the generated file (a hand-edit is overwritten on regeneration and breaks CI until then).
- Public (publishable) backend connection values have built-in fallbacks in `vite.config.ts`, because `.env` is gitignored and a clean-checkout build (publish, Vercel, CI) otherwise ships a browser app that crashes with "Missing Supabase environment variable(s)"; only publishable values may go there, never secrets.
- Bank logos are static official-site assets referenced by a shared bank-name registry; missing assets retain a neutral fallback so branding never changes payout validation.
- Bank form selectors use the shared Picker field variant, while marketing mobile navigation uses the accessible right-side Sheet; shared controls preserve keyboard navigation and focus handling.
- Admin overview presentation uses a browser-safe data model and separate content component; all metrics come from the existing protected dashboard function, so UI organization cannot change financial actions or access controls.
- Homepage/workflow verification shares browser-safe payment content; distinguish wallet proof from hosted KYC without changing financial checks.
- Ecosystem branding/links live in shared content; preserve logo proportions and text fallbacks. Sliders use native scrolling, accessible controls and reduced-motion support.
