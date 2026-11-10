# Lovable, VS Code, GitHub and Vercel: workflow audit

**Audit only, 31 October 2026.** Nothing was changed in code, configuration, GitHub, Lovable or
Vercel. Read against `origin/vercel-preview-migration` at `1422b62` and `origin/main` at
`e1b3e61`. `CLAUDE.md` rules apply throughout.

**Answer in one paragraph.** Keeping Lovable is technically safe **only after** five changes,
none of which is in place today: `main` protected, Lovable moved to its own branch, merges only
through pull requests with CI, Vercel never deploying Production straight from a Git push, and
the live site no longer published from Lovable. Today Lovable pushes straight to an unprotected
`main`, every one of those pushes starts a Vercel **Production** build (stopped only by an empty
`vercel.json`), Lovable has rewritten this repository's history before, and its last frontend
edits added third-party scripts to the payment and admin pages.

## 1. Current workflow and architecture

```
Lovable editor ──push──▶ main (unprotected, default) ──Git──▶ Vercel Production build (fails: empty vercel.json)
                              │                        └──▶ Lovable hosting: lamportpay.com + Lovable Cloud DB (live)
VS Code / Claude sessions ──push──▶ vercel-preview-migration (unprotected, 44 commits ahead of main)
                                        └── deployed by API ──▶ Vercel Preview (Vercel login, dev DB, sandbox)
```

| Piece | Today |
| --- | --- |
| Repository | `lamportpay/lamport`, public, owned by a personal GitHub account, created 12 Oct 2026, default branch `main` |
| Writers | `lamportpay` (admin), `GhazanfarGw` (write), plus GitHub Apps with write access (Lovable, Vercel, Claude). App permissions are not visible to this audit |
| Lovable | Syncs `main` (124 of 141 commits on `main` are by `gpt-engineer-app[bot]`, last on 30 Oct 00:13). Publishes the live site and runs on Lovable Cloud, whose database is the live one (`AGENTS.md`: preview and published app share it, `LAMPORTPAY_SHARED_DB=1`) |
| VS Code and Claude sessions | Work on `vercel-preview-migration`. All 44 commits not in `main` are by Claude sessions, pushed directly (no pull requests); several sessions pushed there on 30 Oct |
| Vercel | Project `lamport`, Hobby plan, production branch `main`. Preview deployments of `vercel-preview-migration` are created on request (its `vercel.json` sets `git.deploymentEnabled: false`). Vercel login protects every `*.vercel.app` URL, not custom domains |
| CI | `.github/workflows/ci.yml` on every push and pull request, read-only token, required by nothing |

## 2. GitHub and branch audit

### Branches

| Branch | Latest commit | Relationship | Note |
| --- | --- | --- | --- |
| `main` | `e1b3e61` 30 Oct, Lovable bot | Ancestor of `vercel-preview-migration` (0 commits missing from it) | Lovable's synced branch |
| `vercel-preview-migration` | `1422b62` 30 Oct, Claude | 44 commits ahead of `main`, 0 behind | All current work; VS Code branch |
| `fix/vercel-readiness` | `0156935` 29 Oct | 1 commit not in `main`, contained in `vercel-preview-migration` | Open PR #1 into `main`, superseded |
| `claude/jolly-archimedes-f39xm5` | `1b12d7e` 29 Oct | Contained in `vercel-preview-migration` | Can go after approval |
| `docs/readme-accuracy`, `docs/readme-refresh`, `docs/update-project-documentation`, `fix/dependency-audit`, `fix/launch-blockers` | 21–26 Oct | Fully merged into `main` | Can go after approval |
| `social-media` | `64089a7` 29 Oct | Unrelated history (own root commit), 11 commits of media files | Better in Drive or a separate repository |

### Findings

1. **No branch is protected**, `main` included (GitHub branch API). The ruleset prepared on
   30 Oct (`.github/rulesets/main.json`) has not been imported.
2. **Lovable can push directly to `main`**, and does: every Lovable edit lands there as its own
   commit (often titled only "Changes").
3. **Lovable has rewritten history before.** `main` has **four root commits**, all by the Lovable
   bot on 16–17 Oct (`6f3d39a`, `e8c6a14`, `d599fc5`, `b819e00`). `6f3d39a` alone holds the whole
   project (516 files). The repository's history starts on 16 Oct although the project's
   migrations and decisions go back to August and September: that earlier history is not in
   this repository.
4. **VS Code's branch has several writers and no review.** Claude sessions in the cloud and,
   from now on, VS Code push to the same branch. A force push or a rebase there would remove
   other people's commits, and nothing prevents one.
5. **A bot writes to `main`.** `.github/workflows/lockfile.yml` regenerates `package-lock.json`
   and pushes it to `main` whenever `package.json` changes there (Lovable installs with bun).
   Once `main` is protected this push is refused, so the workflow has to change at the same time.
6. **Open PR #1** (`fix/vercel-readiness` into `main`) is superseded by
   `vercel-preview-migration`; merging it separately would only add noise.
7. **Merge risk today is low:** `main` is a strict ancestor of `vercel-preview-migration`, so the
   eventual merge is a fast-forward. Any new Lovable commit on `main` before that merge makes the
   two diverge.

## 3. Lovable integration audit

**How it is connected.** Through Lovable's GitHub App and two-way sync with one branch, `main`
(evidence: bot commits carry `X-Lovable-Edit-ID`, and `AGENTS.md` has Lovable's managed block).
Lovable also hosts the live site and its backend (Lovable Cloud).

**What Lovable modifies.** Far more than frontend components. Files changed by Lovable commits
on `main`, by area: `src/components/site` (229), `src/lib/payments` (116), `src/routes/api` (112),
`supabase/migrations` (104), `src/routes/_authenticated` (80), `drizzle/migrations` (36),
`src/integrations/supabase` (29), `src/lib/stables` (16), `src/lib/identity` (16),
`.github/workflows` (8), `AGENTS.md` (11). Most backend counts come from the 16 Oct root commits;
since then Lovable has edited `src/integrations/supabase/previewAuthStorage.ts` (25 Oct),
`src/routes/__root.tsx` (Google Tag Manager on every page, 28 Oct), analytics before consent
(28 Oct), `AGENTS.md`, `roadmap.md`, SEO and sitemap files.

**Lovable-specific dependencies in the code**

| Item | Where | Effect outside Lovable |
| --- | --- | --- |
| Public build fallbacks to the **Lovable live** Supabase project | `vite.config.ts`, `PUBLIC_BACKEND_DEFAULTS` | **High risk.** Any build without `VITE_SUPABASE_*` (a VS Code `.env` without them, a Vercel environment missing them) points every browser at the live database |
| `LAMPORTPAY_SHARED_DB=1` | `src/lib/app-mode.server.ts` | Lets TEST mode run on the live database (needed on Lovable Cloud). Must never be set on Vercel |
| MCP server (`@lovable.dev/mcp-js`) | `src/lib/mcp/`, `src/routes/mcp.ts`, `src/routes/[.mcp]/`, `src/routes/[.well-known]/`, `src/routes/[.]lovable.oauth.consent.tsx`, `.lovable/mcp/manifest.json` | Public endpoint behind a Supabase sign-in; tools read static demo data only (no database, no Stables, no secrets), but advertise an invented "1%, minimum $1" Stables fee. Route files are regenerated by Lovable's plugin |
| AI gateway | `LOVABLE_API_KEY`, `src/lib/ai/recovery.server.ts` | Not used on Vercel (no key) and never in LIVE (fixed 30 Oct) |
| Cron secret names | `LOVABLE_CRON_SECRET`, `_PREVIOUS` | Still accepted next to `CRON_SECRET` |
| Error reporting | `src/lib/lovable-error-reporting.ts` | Inert: nothing calls it |
| Generated Supabase files | `src/integrations/supabase/` (`client.ts`, `client.server.ts`, `auth-middleware.ts`, `previewAuthStorage.ts`, `types.ts`, unused `cron-auth.ts`) | Lovable may regenerate them from the live schema |
| Lovable publish path | `vite.config.ts` (`LOVABLE_SANDBOX`, Cloudflare worker build) | Inert on Vercel |
| `bun.lock`, `bunfig.toml` | Repository root | Lovable's installer and mirror; Vercel and CI use `npm ci` |
| Lovable-kept migrations | `drizzle/migrations/` | Ported; `tests/migration-trail.unit.test.ts` fails if a new one is not |
| Agent memory | `AGENTS.md` (Lovable block and notes), `roadmap.md` | Notes partly out of date; the "Start here" section points to `CLAUDE.md` |

**Can Lovable stay an optional frontend tool?** Yes, technically: the application already runs
on Vercel and the dev database without any Lovable service. Two Lovable behaviours set the
limits:

- Lovable edits and syncs **one branch at a time**; the branch can be switched in the project's
  GitHub settings. If the synced branch is protected, or has diverged, Lovable pushes to a
  `lovable-sync` branch instead, and the next sync from GitHub replaces Lovable's version
  ([Lovable docs: GitHub](https://docs.lovable.dev/integrations/github),
  [Git sync overview](https://docs.lovable.dev/integrations/git-sync-overview)). Confirm the
  exact options in Lovable before relying on them; the docs site could not be opened from this
  audit.
- Lovable's preview and Publish run **its own** build with Lovable Cloud's secrets and the live
  database. Pointing Lovable at a branch that carries new server code or new migrations runs
  that code against the live database, and Publish would put it on lamportpay.com. Whether
  Lovable Cloud applies new files in `supabase/migrations/` automatically is **not verified** and
  must be checked before Lovable syncs such a branch.

## 4. Recommended VS Code workflow

| Branch | Who | Rules |
| --- | --- | --- |
| `main` | Nobody pushes | Production only. Pull request, CI green, owner review; no force push, no deletion. Production deployed only on the owner's explicit approval |
| `develop` (the current `vercel-preview-migration`, renamed or kept) | Integration branch | Pull requests only, CI green; no force push, no deletion. Vercel Preview of this branch is the test environment |
| `feat/*`, `fix/*` from `develop` | VS Code, Claude sessions | One task per branch, pull request into `develop` |
| `lovable/ui` from `develop` | Lovable only (its synced branch) | Pull request into `develop`; the path guard below and code-owner review apply |
| `lovable-sync` | Created by Lovable when a push is refused | Untrusted; reviewed like `lovable/ui` |

Day to day: VS Code works on a feature branch, opens a pull request into `develop`, CI runs, the
owner reviews, the merge updates the Preview, and the Preview is tested. `develop` is merged into
`lovable/ui` regularly so Lovable sees current code. Production: a pull request from `develop`
into `main`, then a deployment the owner starts explicitly.

## 5. Security review: keeping frontend changes away from critical code

The server enforces every money and permission rule, so a UI change cannot bypass them through
the browser. What a frontend tool **can** do is edit the server code itself (in this framework
server functions live next to UI code) or change what the wallet is asked to sign. The guard has
to work on file paths.

| Critical area | Where it is enforced | Paths a UI branch must not change without owner review |
| --- | --- | --- |
| Authentication and protected routes | `_authenticated` layout, `requireSupabaseAuth`, every server function re-checks | `src/routes/_authenticated/**`, `src/integrations/supabase/**`, `src/lib/*.functions.ts`, `src/lib/admin-path.ts` |
| Wallet signing and non-custodial flow | Funding transaction built and checked on the server; the browser asks the wallet to sign it. A changed browser component could ask the wallet to sign something else, and the server would only refuse to count it after funds had moved | `src/components/app/**`, `src/components/site/wallet/**`, `src/lib/wallet-sign-in.ts`, `src/lib/wallet-state.ts`, `src/lib/identity/**`, `src/lib/buffer-polyfill.ts`, `src/lib/payments/test-payment.ts` |
| Stables and webhooks | Server only | `src/lib/stables/**`, `src/routes/api/**` |
| Payment states and fees | `state.ts`, `fee-math.ts`; database triggers lock prices and the fee ledger | `src/lib/payments/**`, `src/lib/tokens.ts`, `src/lib/money.ts` |
| Admin MFA and authorization | `admin-guard.ts` (`aal2`) and `has_role()` in the database | `src/routes/admin*`, `src/components/admin/**`, `src/lib/admin*.ts` |
| RLS and server permissions | Migrations | `supabase/**`, `drizzle/**` |
| Credentials and environment | Vercel variables; CI scans the browser bundle for server key names | `.env.example`, `vite.config.ts`, `vercel.json`, `src/server.ts`, `src/lib/app-mode*.ts` |
| Third-party scripts | CSP (report-only today), consent-gated analytics | `src/routes/__root.tsx`, `src/components/site/Layout.tsx`, `src/components/site/GoogleAnalytics.tsx`, `src/lib/analytics-consent.ts`, `src/lib/security-headers.ts`, `src/lib/csp-report.server.ts` |
| Build and supply chain | CI, dependency audit | `package.json`, `package-lock.json`, `bun.lock`, `.github/**`, `scripts/**`, `CLAUDE.md`, `AGENTS.md` |

Controls, strongest first:

1. **Path guard in CI:** a job that fails when a pull request from `lovable/*` or `lovable-sync`
   changes any path above. Lovable then stays inside marketing pages, styles, public assets and
   content.
2. **`CODEOWNERS`** listing the same paths, with "require review from code owners" in the
   ruleset, so any branch changing them needs the owner.
3. **Enforced CSP:** once enforced, a script from an unapproved host does not run even if a UI
   change adds it (the Tag Manager case).
4. **Lovable project instructions (Knowledge):** edit only UI files, never add scripts, packages
   or server code. A soft control: the first three still apply if it is ignored.

## 6. Vercel deployment review

| Question | Finding |
| --- | --- |
| Which branches create Preview deployments? | None by Git today: `vercel-preview-migration`'s `vercel.json` sets `git.deploymentEnabled: false`; its Previews are created on request. The dashboard's Ignored Build Step (builds only `vercel-preview-migration`, per `docs/migration/vercel-preview.md`) could not be read back through the API |
| Can `main` trigger Production? | **Yes.** Lovable's push of `e1b3e61` (30 Oct 00:13) started a **Production** build. Its log ends with an error right after cloning, and `vercel.json` on `main` is an empty file, which Vercel cannot read: an accident, not a setting, stopped it. A skip by the Ignored Build Step would have shown as Canceled |
| Can a Lovable push deploy by accident? | Yes, as soon as `vercel.json` on `main` becomes valid (for example through Lovable, or by merging the working branch without changing it), unless Git deployments of `main` are switched off first. With Production variables filled in for LIVE, that would put unreviewed code live |
| Protection | Vercel login on all `*.vercel.app` URLs, not on custom domains. Preview variables are scoped to `vercel-preview-migration`; Production has none |

Recommended settings:

1. `vercel.json` on `main` (with the merge pull request): Git deployments off for `main`, so
   Production is only ever deployed by an explicit owner action (promote a tested Preview, or
   `vercel deploy --prod`). Keep `develop` Previews on.
2. Keep the Ignored Build Step as a second layer, allowing only `develop` (and
   `vercel-preview-migration` while it exists); confirm the command in Vercel → Settings → Git.
3. No Vercel builds for `lovable/*`: Lovable shows its own preview, and Preview variables stay
   scoped to `develop`.
4. Never put `LAMPORTPAY_SHARED_DB` or any live-database value in a Vercel Preview variable.
   Production secrets are entered by the owner only, as Sensitive.

## 7. Risks and conflicts

| # | Risk | Severity |
| --- | --- | --- |
| R1 | Lovable pushes to unprotected `main`; each push starts a Vercel Production build | High |
| R2 | History rewrite precedent (four Lovable root commits); no branch blocks force pushes or deletion | High |
| R3 | `vite.config.ts` falls back to the Lovable live database when `VITE_SUPABASE_*` is missing (VS Code `.env`, Vercel) | High |
| R4 | Lovable has edited payment, API, migration and CI files, and added third-party scripts to payment and admin pages | High |
| R5 | Lovable preview and Publish run the synced branch against the live database and the live domain | High until the domain moves to Vercel |
| R6 | Several writers on `vercel-preview-migration` without pull requests | Medium |
| R7 | `lockfile.yml` pushes to `main`; it breaks once `main` is protected | Medium (operational) |
| R8 | Lovable may regenerate `src/integrations/supabase/types.ts` and the MCP route files from its own schema and plugin | Medium |
| R9 | MCP server publishes invented fee figures | Low (accuracy) |
| R10 | Superseded PR #1 and stale branches invite mistaken merges | Low |

## 8. Required GitHub changes (for approval; none made)

1. Import the `main` ruleset with: pull request required; status check `checks` required;
   force push and deletion blocked; **code-owner review on**. With one human approver, either
   set required approvals to 0 (pull request and CI still required) or name GhazanfarGw as the
   second reviewer: GitHub never lets an author approve their own pull request.
2. The same protection for `develop` / `vercel-preview-migration` (pull request, CI, no force
   push, no deletion).
3. Add `.github/CODEOWNERS` for the paths in section 5 and the CI path-guard job.
4. Change `lockfile.yml` to open a pull request (or only check) instead of pushing to `main`.
5. Switch Lovable's synced branch to `lovable/ui` (Lovable → project → GitHub settings) after
   `main` is protected and after checking how Lovable Cloud treats new migrations.
6. Turn on secret scanning with push protection and Dependabot alerts (free for public
   repositories).
7. Close PR #1 as superseded; delete the merged branches listed in section 2 (owner approval).
8. Optional: move the repository to a GitHub organisation owned by the company, for team roles
   and an audit log.

## 9. Work left to make LamportPay independent of Lovable

| Item | Change |
| --- | --- |
| Live site and database | Move lamportpay.com and production data to Vercel and the company's production Supabase project (Phase 4); export the early-access sign-ups from Lovable Cloud first |
| `vite.config.ts` fallbacks | Remove the live-database defaults; fail the build clearly when `VITE_SUPABASE_*` is missing |
| `LAMPORTPAY_SHARED_DB`, `LOVABLE_CRON_SECRET*`, `LOVABLE_API_KEY` | Remove once Lovable no longer runs the app |
| MCP server | Decide: keep (fix the fee text, own the generated files) or remove with `@lovable.dev/mcp-js` |
| `src/integrations/supabase/` | Take ownership (no regeneration from Lovable); delete the unused `cron-auth.ts` |
| `lovable-error-reporting.ts`, Lovable publish path in `vite.config.ts`, `bun.lock`, `bunfig.toml`, `roadmap.md` | Remove or keep as inert once Lovable is UI-only |
| `lockfile.yml` | Pull-request based (section 8) |

## 10. Verdict

| Question | Answer |
| --- | --- |
| Is keeping Lovable technically safe? | **Not as configured today** (R1–R5). **Yes** for UI work once `main` is protected, Lovable syncs `lovable/ui` through pull requests with the path guard and code owners, Production never deploys from a Git push, and the live site has moved off Lovable (or Lovable's Publish is not used until then) |
| Can VS Code be the primary environment? | Yes; it already is in practice (all current work is on `vercel-preview-migration`) |
| Will either tool overwrite the other? | Not once both work only through pull requests on protected branches: Lovable's refused pushes go to `lovable-sync` instead of overwriting |
| Do frontend changes threaten payments or security? | Only through edits to the paths in section 5 or to signing components; the path guard and code owners close that |

Sources: GitHub branch, collaborator, pull request and repository APIs; `git log` of all remote
branches; Vercel project and deployment APIs; Lovable documentation via search
([GitHub sync](https://docs.lovable.dev/integrations/github),
[Git sync overview](https://docs.lovable.dev/integrations/git-sync-overview),
[branching for teams](https://lovable.dev/faq/team/workflows/branching-for-teams)).
