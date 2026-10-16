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
- Share roadmap content; integration paths follow measured logo positions and replay on viewport entry with reduced-motion support. Map transforms use d3-zoom for consistent touch, wheel and buttons.
- Treat interrupted HTTP connections as expected cancellations, not reportable SSR failures, so navigation cannot trigger a false crash screen.
- Asset intake routing lives in src/lib/asset-routing (networks separate from assets; providers selected by listing; intake requires explicit allowlist) so new conversion providers plug in without touching the live Jupiter endpoints.
- Lovable Cloud serves preview and production from one shared Supabase instance (LAMPORTPAY_SHARED_DB=1); the two-database TEST-mode rule is relaxed accordingly, never with a production database.
- Country flags in site UI are drawn as inline SVG rather than Unicode emoji, because emoji flags do not render on every desktop OS.
- Customer wallet sign-in is verified by our own server route (`/api/wallet/sign-in`: SIWS-style message, origin + age + Ed25519 check, one-time signature, wallet recorded in app_metadata.wallet_solana and user_wallets) because the backend's built-in Web3 provider cannot be enabled on Lovable Cloud; wallet accounts use a non-deliverable placeholder email that is never treated as a real email.
- A wallet becomes permanently verified after its first COMPLETED payment (DB trigger fills `verified_wallets`); `getKycStatus` then skips the verification step without re-asking Stables, because a completed Stables payout already proves verification.
- Buffer is resolved per build target by the `lamportpay-node-buffer-browser-shim` plugin in `vite.config.ts` (never `resolve.alias`): browser → real `buffer` via private name `lamportpay-real-buffer` (never `buffer/index.js`, which Nitro re-aliases to a mock lacking `writeUIntLE`); server/SSR → `src/lib/buffer-server-buffer.ts` (Node Buffer), since the browser package 500s every SSR page on the edge worker.
- package-lock.json must stay in sync with package.json because CI installs with `npm ci`; dependencies are often added with bun, which does not update the npm lock file. `.github/workflows/lockfile.yml` auto-regenerates and commits the lock file on any main-branch push that touches package.json, so the follow-up commit's CI run is green.
- `scripts/check-client-bundle.mjs` scans only browser-facing build output (`dist/client`, not all of `dist`), because the server bundle legitimately reads secret env names and would otherwise fail every build; the browser bundle must never contain them.
- Platform-generated files under `src/integrations/supabase/` are hand-edited never, so a lint finding inside one is fixed by adding that file to the ignores list in `eslint.config.js`, not by editing the generated file (a hand-edit is overwritten on regeneration and breaks CI until then).
- Public (publishable) backend connection values have built-in fallbacks in `vite.config.ts`, because `.env` is gitignored and a clean-checkout build (publish, Vercel, CI) otherwise ships a browser app that crashes with "Missing Supabase environment variable(s)"; only publishable values may go there, never secrets.
- Bank logos are static official-site assets referenced by a shared bank-name registry; missing assets retain a neutral fallback so branding never changes payout validation.
- Bank selectors use shared Picker fields. SiteLayout owns the sticky mode notice and desktop links/mobile Sheet; preserve keyboard focus and keep financial mode enforcement server-side.
- Admin overview presentation uses a browser-safe data model and separate content component; all metrics come from the existing protected dashboard function, so UI organization cannot change financial actions or access controls.
- Homepage/workflow shares browser-safe verification content; distinguish wallet proof from hosted KYC without changing financial checks.
- Ecosystem branding stays shared. Preserve logo proportions/fallbacks. Sliders scroll natively. Infrastructure uses measured DOM wires; token motion is viewport/reduced-motion gated, never financial state.
- Journey content is manual-only, above selectors, with previous/next controls, so reading stays uninterrupted. Decorative motion is viewport-gated and reduced-motion-aware, never financial state. Scope phone styling to `.commercial-home`. Public deposit warnings are not payout blacklists; pending submissions imply no backing.
- Heading reveals read the heading's own box on scroll/resize, never an IntersectionObserver on the heading: its own clip-path zeroes the observer's ratio, so the text would stay permanently hidden.
- Subdirectories may have their own AGENTS.md (e.g. src/routes/api); read it before changing files there.
