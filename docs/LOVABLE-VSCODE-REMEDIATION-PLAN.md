# LamportPay: Lovable and VS Code remediation plan (for approval)

**31 October 2026.** Based on
`docs/LOVABLE-VSCODE-WORKFLOW-AUDIT.md`, `CLAUDE.md` and `docs/STATUS.md` (remote branch
`vercel-preview-migration` at `1422b62`, `main` at `e1b3e61`).

**Progress (31 Oct).** Done: R0 (verified backup sent to the owner), R4 (`73847d7`), R6 files
(`d7e9de6`), R5 (`b48d85f`). Owner approved all remaining approvals the same day: R1 set and
checked (Vercel Ignored Build Step); R2 branch `lovable/legacy` created at `e1b3e61` (owner switches
Lovable to it); R3 rulesets in `.github/rulesets/` for the owner to import. Decisions applied:
D1 no approval count beyond the code owner; D2 `@lamportpay` only; D3 admin bypass for pull
requests only; D4 retarget (done); D5 MCP server removed after LIVE (R10); D6 Lovable UI work after
the live move; D7 R1 applied by engineering. R7 deferred until after LIVE. Implemented R6 differs from the draft below in one point: the
sitemap route, `src/lib/seo.ts` and `public/robots.txt` stay owner-only (a server route and the
page head), and CODEOWNERS is `* @lamportpay` minus exactly the allowlist, kept equal by a test.

### Evidence (31 Oct 2026)

| Item | State | Evidence |
| --- | --- | --- |
| R0 backup | Done | Full and code-only Git bundles, restore-tested, sent to the owner; Windows steps in `docs/LOCAL-SETUP-WINDOWS.md` section 2 |
| R1 Production protected | Done | Vercel Ignored Build Step = `if [ -f scripts/vercel-ignore-build.sh ]; then sh scripts/vercel-ignore-build.sh; else exit 0; fi`: Production builds only from `main` (deliberate deployment), Previews only for the integration branch, any commit without the script (Lovable's `main`, `lovable/legacy`) skipped. `vercel.json`: Git pushes never deploy `main`, auto-deploy only the integration branch. The 31 Oct Preview build log shows the guard running; `tests/deploy-guards.unit.test.ts` covers every case |
| R2 Lovable separated | Branch ready; owner switch pending | `lovable/legacy` created at `e1b3e61` (= today's `main`, the live site's code). Owner: Lovable → project → GitHub → branch `lovable/legacy` |
| R3 Branch protection | Files ready; owner import pending | `.github/rulesets/main.json`, `vercel-preview-migration.json`, README with the import steps; `tests/deploy-guards.unit.test.ts` checks their rules. The tools available to engineering cannot create rulesets |
| R4 No live fallback | Done | `73847d7`; `tests/public-env.unit.test.ts` |
| R5 Lockfile bot | Done | `b48d85f`; `tests/lockfile-workflow.unit.test.ts` |
| R6 Path guard, CODEOWNERS | Done (enforced after R3) | `d7e9de6`; `tests/codeowners.unit.test.ts`, `tests/lovable-path-guard.unit.test.ts` |
| R7 Pull requests on the integration branch | Ready; active with the ruleset import | Integration ruleset requires a pull request with `checks` and `lovable-path-guard`; `.githooks/pre-push` refuses direct pushes to `main`, the integration branch and `lovable/legacy` (`git config core.hooksPath .githooks`); workflow in `docs/LOCAL-SETUP-WINDOWS.md` section 6 |
| D1 approvals on `main` | Applied | `required_approving_review_count` 0, `require_code_owner_review` true (`main.json`) |
| D2 code owners | Applied | `.github/CODEOWNERS`: `@lamportpay` only |
| D3 admin bypass | Applied | `bypass_mode: pull_request` for repository admins in both rulesets: no direct pushes for anyone |
| D4 lockfile | Applied | Retargeted (R5) |
| D5 MCP server | Decided: remove after the live move | R10 item 8; until then it stays as is |
| D6 Lovable UI work | Decided: after the live move | R9 gates |
| D7 who applies R1 | Applied | Engineering through the Vercel API; checked in the build log |

## 0. Order of work

| Phase | Goal | Priority | Owner approval | Can start under existing approvals |
| --- | --- | --- | --- | --- |
| R0 | Safety net: full backup of every branch, settings recorded | 1 | No (local only) | **Yes** |
| R1 | No Production build from a Git push (Vercel) | 1 | **Yes** (Vercel setting) | No |
| R2 | Move Lovable off `main` to a frozen copy of today's live code | 1 | **Yes** (new branch, Lovable setting) | No |
| R3 | Protect `main` and the VS Code branch on GitHub | 1 | **Yes** (GitHub settings) | No |
| R4 | Remove the live Supabase fallback; validate configuration explicitly | 2 | Covered by "finish the security work" (30 Oct) | **Yes** (branch, CI, Preview) |
| R5 | Correct the lockfile workflow | 3 | File change covered; takes effect on `main` only through R8 | **Yes** (file only) |
| R6 | CODEOWNERS and the Lovable path guard | 4–5 | Files covered; enforcement is a GitHub setting (R3) | **Yes** (files only) |
| R7 | Pull-request workflow on the VS Code branch | 6 | **Yes** (changes how every session works) | No |
| R8 | `main` catches up through one reviewed pull request; Production only on request | – | **Yes** (STATUS approval 4) | No |
| R9 | Workflow rehearsal, then Lovable UI work on `lovable/ui` | 10 | **Yes** | No |
| R10 | Remove Lovable-specific dependencies (after the live move) | 9 | **Yes**, item by item | No |

**Invariants for every phase.** The payment architecture (non-custodial, one 2% fee, Stables
authoritative, forward-only states), the security controls (admin MFA, RLS, webhook checks,
rate limits, headers), SEO (canonical `lamportpay.com`, sitemap, robots, structured data) and
customer data stay as they are. The live application, the Lovable live database, its customer
data and the domain are not touched (`CLAUDE.md`). No commit on `vercel-preview-migration` is
rewritten or removed. Vercel stays the host.

**The ordering that matters.** Lovable syncs `main`. Any code merged into `main` while Lovable
still syncs it reaches Lovable's preview, which runs against the live database (Lovable Cloud).
So R2 (Lovable off `main`) must happen before anything new reaches `main` (R8), and R1 and R3
must be in place before `vercel.json` on `main` becomes valid.

---

## R0. Safety net

**Goal.** Make every commit recoverable before any setting changes.

**Files and settings.**
- A `git bundle` of all remote branches and tags (`git bundle create lamport-all-2026-10-31.bundle --all`
  from a fresh mirror clone), checked with `git bundle verify`, sent to the owner for Drive.
- A written record of the current settings: Vercel → Settings → Git (production branch, Ignored
  Build Step command), Deployment Protection; Lovable → project → GitHub (synced branch);
  GitHub → Settings → Rules (none today), collaborators, installed GitHub Apps.
- Local checkout fast-forwarded to `origin/vercel-preview-migration` (7 commits behind today;
  local only).

**Risks and dependencies.** None for the product. The bundle holds code only (no secrets: `.env`
is not committed). Recording Lovable and GitHub App settings needs the owner's screens.

**Tests.** `git bundle verify` passes; a mirror restored from the bundle has every branch and tag
at the same commit as GitHub; `git fsck` is clean. (Done 31 Oct: 10 branches and tag v0.3.0.)

**Rollback.** Not needed; nothing changes.

**Approval.** Not needed for the bundle; the owner provides the screenshots.

---

## R1. No Production deployment from a Git push

**Goal.** A push to `main` (by Lovable or anyone) never builds Production; Production is only
deployed by an explicit, owner-approved action.

**Files and settings.**
- Now: Vercel → `lamport` → Settings → Git → **Ignored Build Step**, custom command (record the
  current one first):
  `if [ "$VERCEL_ENV" = "production" ]; then echo "Production deploys only on request"; exit 0; fi; [ "$VERCEL_GIT_COMMIT_REF" = "vercel-preview-migration" ] && exit 1 || exit 0`
  (exit 0 = skip the build, exit 1 = build).
- With R8: `vercel.json` on `main` stops being empty. The branch's version already sets
  `"git": { "deploymentEnabled": false }`, so no Git push deploys anything; Previews and
  Production are created on request (API or `vercel deploy`), as Previews already are.
- Keep Production variables empty until the LIVE approvals (`docs/STATUS.md` §7). After R4 a
  Production build without the `VITE_SUPABASE_*` values also fails at build time.

**Risks and dependencies.**
- Whether the Ignored Build Step also runs for deployments created through the API with a Git
  source is not documented clearly; R9 checks it on a Preview before any Production deploy. If it
  does, Production is deployed from a local checkout with `vercel deploy --prod` (file upload)
  or the command is relaxed for that one deploy, both owner-approved.
- Today only an empty `vercel.json` stops Lovable's pushes from building Production; this phase
  removes that dependence.

**Tests.** Read the setting back after saving. Run the command locally with the variable
combinations (production/main → skip, preview/`vercel-preview-migration` → build, preview/other →
skip). Create one Preview of `vercel-preview-migration` on request: READY. The next push to
`main`, if any, shows as Canceled, not Error.

**Rollback.** Paste back the recorded command (takes effect on the next push).

**Approval.** **Yes.** I can set it through the Vercel API on your go-ahead, or you paste it in
the dashboard.

---

## R2. Lovable moves off `main`

**Goal.** Lovable keeps working on exactly the code that runs on lamportpay.com today, and stops
both writing to `main` and receiving whatever `main` later becomes.

**Files and settings.**
- New branch `lovable/legacy` created at `e1b3e61` (today's `main`, the live site's source).
- Lovable → project → GitHub settings → branch picker → `lovable/legacy` (owner; Lovable syncs
  one branch at a time and can be switched there).
- Lovable project Knowledge: "Do not publish. Edit only UI files" until R9.

**Risks and dependencies.**
- The switch must happen while Lovable is not editing (Lovable blocks switching mid-edit).
- `lovable/legacy` has the same code as today's synced branch, so Lovable's preview and its
  database see no change. Publishing from Lovable would still publish this same code; the domain
  is untouched.
- If Lovable reports a diverged branch it pushes to `lovable-sync` instead; nothing is lost.

**Tests.** After the switch: GitHub shows no new commits on `main` for 48 hours of normal Lovable
use; one harmless Lovable edit (a comment) lands on `lovable/legacy`, then is reverted there;
lamportpay.com unchanged (compare the page HTML before and after).

**Rollback.** Switch Lovable back to `main` in the same setting; `lovable/legacy` can stay.

**Approval.** **Yes** (new branch and a Lovable setting, done by the owner).

---

## R3. Protect GitHub branches

**Goal.** No force push, rewrite or deletion of `main` or the VS Code branch; `main` changes only
through a reviewed pull request with green CI.

**Files and settings.** GitHub → Settings → Rules → Rulesets (owner imports JSON I prepare;
the tools available here cannot create rulesets):

- **Ruleset A, `main` (default branch):** block deletion; block non-fast-forward (force push);
  require a pull request (dismiss stale approvals; required approvals **0** with you merging, or
  **1** with GhazanfarGw as reviewer: GitHub never counts the author's own approval); require the
  `checks` status check, up to date with the base; code-owner review switched on once
  `CODEOWNERS` is on `main` (R8). Bypass: none, or "repository admin, pull requests only" for
  emergencies (your choice).
- **Ruleset B, `vercel-preview-migration` (and `develop` if created):** block deletion and
  force push only. Normal pushes from VS Code and Claude sessions keep working. Pull requests
  are added in R7.
- Settings → Code security: secret scanning with push protection; Dependabot alerts.

**Risks and dependencies.**
- `lockfile.yml` pushes to `main`; under ruleset A that push is refused. Harmless once R2 is done
  (Lovable no longer pushes to `main`), and fixed for good by R5.
- If Lovable were still on `main`, its pushes would go to `lovable-sync`; R2 first avoids that.
- Required approvals 1 with a single human blocks every merge; decide before importing.

**Tests.** On a throwaway branch `ruleset-test` added to ruleset B for the test: a force push and
a deletion are both refused, then the pattern and branch are removed. The branch API shows
`main` and `vercel-preview-migration` as protected. A direct push to `main` is refused (tested
with a no-op branch push, never with real content). A test pull request into `main` shows the
required check and cannot merge while CI runs.

**Rollback.** Set each ruleset's enforcement to Disabled (instant); delete later if wanted.

**Approval.** **Yes.**

---

## R4. Remove the live Supabase fallback; validate configuration

**Goal.** No build can silently point browsers at the Lovable live database. Missing or
inconsistent public configuration stops the build with a clear message.

**Files.**
- `vite.config.ts`: delete `PUBLIC_BACKEND_DEFAULTS` and the loop that fills it in; call the
  validator below for both `dev` and `build`.
- New `src/lib/public-env.ts` (pure function, no browser or server imports, usable by
  `vite.config.ts` and tests): `validatePublicEnv(env)` returns problems:
  - `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_SUPABASE_PROJECT_ID` required;
  - URL is `https://<ref>.supabase.co` and `<ref>` equals `VITE_SUPABASE_PROJECT_ID`;
  - the key is a publishable key (`sb_publishable_…`, or a legacy anon JWT), never a secret or
    service-role key;
  - the live Lovable project ref is refused unless `LAMPORTPAY_SHARED_DB=1` (Lovable only) and
    never when `VERCEL_ENV=preview`;
  - `VITE_LAMPORTPAY_MODE` equals `LAMPORTPAY_MODE` when both are set.
- Project refs: move `DEV_SUPABASE_REF` / `LIVE_SUPABASE_REF` from `src/lib/app-mode.server.ts`
  into a small shared module so the validator and the mode guard use the same constants.
- `.github/workflows/ci.yml`: placeholder public values for the build step (a 20-character
  dummy ref and `sb_publishable_ci_placeholder`), so CI never builds against a real project.
- `.env.example`: list the three `VITE_SUPABASE_*` values as required, with the dev project.
- `src/integrations/supabase/client.ts` (and `client.server.ts`, `auth-middleware.ts`): the
  error text says "set it in .env (see .env.example)" instead of "Connect Supabase in Lovable
  Cloud" (taking ownership of these generated files, see R10).
- Docs: `CLAUDE.md` (one line under Environments), `docs/STATUS.md`, the stale `AGENTS.md`
  Lovable note about fallbacks marked superseded in the "Start here" section.

**Risks and dependencies.**
- Vercel Preview already has all three `VITE_SUPABASE_*` values plus `VITE_LAMPORTPAY_MODE`,
  scoped to `vercel-preview-migration` (checked 30 Oct): the Preview keeps working.
- Local VS Code: your `.env` must contain the three values for the dev project, otherwise
  `npm run dev` stops with the message (that is the point of the change).
- Lovable: its builds relied on the fallback. Unaffected while Lovable syncs `lovable/legacy`
  (R2), which keeps the old file; before R9 the values go into Lovable's environment.
- Production: stays empty, so a Production build fails at validation until the LIVE setup; one
  more layer under R1.

**Tests.**
- Unit (`tests/public-env.unit.test.ts`): each rule, accepted and refused cases, including
  "live ref refused on a Vercel Preview" and "secret key refused".
- Static: `vite.config.ts` contains no project ref or key.
- Build: CI passes with placeholders; a local build with no `VITE_*` fails with the message.
- Preview: deploy and check that the built browser files contain the dev project ref and **not**
  the live ref (deployment file listing or a local build with the Preview's values); `/`,
  `/pay`, `/admin/login`, `/api/integration-status` load; wallet sign-in reaches the dev project.
- SEO: page titles, canonical links, sitemap and robots on the Preview unchanged.

**Rollback.** Revert the commit; the fallback returns exactly as before.

**Approval.** Covered by your 30 Oct instruction to finish the security work and the standing
branch workflow (commit on `vercel-preview-migration`, CI, Preview). It changes neither `main`
nor Production.

---

## R5. Lockfile workflow

**Goal.** No bot writes to `main`; Lovable's dependency edits still arrive with a matching
`package-lock.json`, for review.

**Today.** `.github/workflows/lockfile.yml` runs on pushes to `main` that change
`package.json`, regenerates the lock with `npm install --package-lock-only` and pushes it to
`main` with a write token. CI's `npm ci` already fails when the two files disagree.

**Files.**
- `.github/workflows/lockfile.yml`: trigger on `lovable/**` branches only (where Lovable pushes
  with bun), never `main`; keep `contents: write` scoped to that job; pin the actions to commit
  SHAs.
- Alternative if you prefer no bot at all: delete the workflow; a Lovable dependency change then
  fails CI and is fixed in VS Code (`npm install`).

**Risks and dependencies.**
- A push-triggered workflow runs the file from the pushed commit, so the new trigger applies to
  `lovable/**` branches cut from `vercel-preview-migration`; `main` keeps the old file until R8,
  which is harmless once R2 and R3 are done.
- `package.json` is a protected path (R6): a Lovable dependency change still needs owner review.

**Tests.** On a test branch `lovable/test-lock`: change `package.json` only, and the bot adds one
lock commit to that branch; CI then passes. A push to any other branch triggers no lock commit.
An out-of-sync pull request fails CI at `npm ci`.

**Rollback.** Restore the previous file.

**Approval.** The file change on the working branch is covered (CI configuration, inert for
`main`). It reaches `main` only with R8.

---

## R6. CODEOWNERS and the Lovable path guard

**Goal.** Lovable can change only UI files; any change to payment, wallet signing, Stables, API,
admin, database, security or deployment files needs the owner's review, whoever makes it.

**Files.**
- `.github/CODEOWNERS` (owners: `@lamportpay`, plus `@GhazanfarGw` if you want two reviewers):
  `src/lib/payments/`, `src/lib/stables/`, `src/lib/identity/`, `src/lib/jupiter/`,
  `src/lib/hyperliquid/`, `src/lib/ops/`, `src/lib/ai/`, `src/lib/*.functions.ts`,
  `src/lib/*.server.ts`, `src/lib/app-mode*.ts`, `src/lib/admin*.ts`, `src/lib/security-headers.ts`,
  `src/lib/csp-report.server.ts`, `src/lib/wallet-*.ts`, `src/lib/money.ts`, `src/lib/tokens.ts`,
  `src/lib/buffer-polyfill.ts`, `src/lib/analytics-consent.ts`, `src/routes/api/`,
  `src/routes/_authenticated/`, `src/routes/admin*`, `src/routes/__root.tsx`,
  `src/routes/mcp.ts`, `src/routes/[.mcp]/`, `src/routes/[.well-known]/`,
  `src/routes/[.]lovable.oauth.consent.tsx`, `src/components/app/`, `src/components/admin/`,
  `src/components/site/wallet/`, `src/components/site/Layout.tsx`,
  `src/components/site/GoogleAnalytics.tsx`, `src/components/site/CookieConsent.tsx`,
  `src/integrations/`, `src/server.ts`, `supabase/`, `drizzle/`, `vite.config.ts`,
  `vercel.json`, `package.json`, `package-lock.json`, `bun.lock`, `bunfig.toml`, `.env.example`,
  `.github/`, `scripts/`, `tests/`, `CLAUDE.md`, `AGENTS.md`, `docs/security/`,
  legal pages (`src/routes/privacy.tsx`, `terms.tsx`, `cookies.tsx`).
- `.github/lovable-allowed-paths.txt` (allowlist, deny by default): marketing routes
  (`src/routes/index.tsx`, `about`, `people`, `how-it-works`, `workflow`, `technology`,
  `partners`, `roadmap`, `whitepaper`, `compliance`, `docs`, `faq`, `contact`, `blog*`, `news*`),
  `src/components/site/**` except the files above, `src/components/ui/**`, `src/content/**`,
  `src/assets/**`, `public/**`, `src/styles.css`, SEO files (`src/routes/sitemap[.]xml.ts`,
  `src/lib/company-profile.ts`; reviewed in the pull request like any change).
- `scripts/check-lovable-paths.mjs`: lists the files a pull request changes
  (`git diff --name-only <base>...HEAD`) and fails on any file outside the allowlist.
- `.github/workflows/ci.yml`: job `lovable-path-guard`, on pull requests whose head branch starts
  with `lovable/` or is `lovable-sync` (skipped otherwise, which GitHub counts as passing).
- Tests: `tests/lovable-path-guard.unit.test.ts` (matcher cases) and
  `tests/codeowners.unit.test.ts` (every protected pattern is in `CODEOWNERS` and none is in the
  Lovable allowlist).
- Lovable Knowledge text (owner, in Lovable): edit only UI files; never add scripts, packages,
  routes under `api/`, or migrations.

**Risks and dependencies.**
- Enforcement comes from settings: `lovable-path-guard` and code-owner review become required in
  rulesets A and B (R3). Until then the files are inert.
- A code owner cannot approve their own pull request; with one human the bypass choice in R3
  decides how you merge your own protected-path changes.
- Allowlist too narrow: Lovable pull requests fail and need an owner decision; too wide: a
  critical file slips through. Deny-by-default plus the consistency test keeps new files
  protected until listed.

**Tests.** Unit tests above. With test branches: `lovable/test-ui` changing a marketing component
passes the guard and needs no code owner; `lovable/test-pay` changing `src/lib/payments/fee-math.ts`
fails the guard and requests the owner; `lovable/test-script` adding a `<script>` to
`__root.tsx` fails. GitHub shows no errors for `CODEOWNERS` (file view).

**Rollback.** Remove the job from the required checks, or delete the files.

**Approval.** Files: covered. Making the check and code-owner review required: **yes** (R3).

---

## R7. Pull requests on the VS Code branch

**Goal.** Several writers (VS Code, Claude sessions) stop pushing straight to the shared branch.

**Files and settings.**
- Keep `vercel-preview-migration` as the integration branch for now: renaming it to `develop`
  would break the Preview variables scoped to that name and every document pointing to it.
  Rename later together with re-scoping the Vercel variables.
- Ruleset B adds: pull request required, `checks` required.
- Work on `feat/*` / `fix/*` branches from it; open a pull request; Preview deployed after merge.
- `docs/STATUS.md`, `AGENTS.md`, `.github/copilot-instructions.md`, `CLAUDE.md`: workflow
  section updated (branch from the integration branch, pull request, never push directly).

**Risks and dependencies.** Slower small fixes; sessions that push directly get refused and must
switch to a branch. Needs R3.

**Tests.** A feature branch pull request runs CI, merges, and a Preview of the merge is READY. A
direct push is refused.

**Rollback.** Remove the pull-request rule from ruleset B.

**Approval.** **Yes.**

---

## R8. `main` catches up; Production only on request

**Goal.** `main` holds the reviewed code (with a valid `vercel.json` that disables Git
deployments) and Production is deployed only when you ask.

**Steps.** After R1–R4 and R6: pull request `vercel-preview-migration` → `main` (fast-forward
possible today: `main` is an ancestor). Close PR #1 as superseded. Delete the merged branches
listed in the audit (§2) after approval. Turn on code-owner review in ruleset A.

**Risks and dependencies.** Must follow R2 (otherwise Lovable's preview receives the new code and
runs it against the live database). Production variables stay empty until the LIVE approvals.

**Tests.** After merge: no Vercel deployment is created by the merge; CI green on `main`; ruleset
A reports protected; Lovable still on `lovable/legacy` and unchanged.

**Rollback.** Before any Production deploy, `main` can be reset only by a revert pull request
(force push stays blocked); a revert of the merge restores the previous tree.

**Approval.** **Yes** (`docs/STATUS.md` §7, approval 4).

---

## R9. Workflow rehearsal, then Lovable UI work

**Goal.** Prove the whole workflow with test branches before Lovable edits anything real.

**Preconditions (gates).**
1. R1–R6 done; R7 if you want the full flow.
2. Answered: does Lovable Cloud apply files in `supabase/migrations/` to its database when its
   synced branch changes? (Ask Lovable support or check Lovable Cloud's migration history.)
   Until this is known, Lovable must not sync a branch with migrations its database lacks.
3. Lovable's environment has the `VITE_SUPABASE_*` values (R4) and TEST mode; Lovable Publish is
   not used until the domain moves to Vercel, so lamportpay.com cannot change from Lovable.
4. Lovable Knowledge set (R6).

**Rehearsal (all with test branches; nothing reaches `main`).**

| # | Test | Pass when |
| --- | --- | --- |
| T1 | Backup bundle | Verifies; heads and counts match |
| T2 | Branch protection | Force push and deletion refused on `ruleset-test`; direct push to `main` refused; pull request into `main` needs `checks` |
| T3 | Vercel | Ignored Build Step script cases correct; a Preview on request builds; a test push to an unlisted branch creates no deployment |
| T4 | Configuration | CI builds with placeholders; local build without `VITE_*` fails clearly; Preview bundle contains the dev ref, not the live ref |
| T5 | Lockfile | `lovable/test-lock` gets one bot lock commit; no other branch does |
| T6 | Path guard and code owners | `lovable/test-ui` passes; `lovable/test-pay` and `lovable/test-script` fail and request the owner |
| T7 | Lovable isolation | Lovable on `lovable/legacy`; no commits on `main` for 48 h; a Lovable test edit lands on `lovable/legacy` |
| T8 | Lovable UI end to end | Lovable switched to `lovable/ui` (cut from the integration branch); a copy change in Lovable becomes a commit on `lovable/ui` → pull request → CI and guard pass → merge → Preview shows it; Lovable Cloud migration history unchanged; lamportpay.com unchanged |
| T9 | No overwrite | A VS Code change merged into `lovable/ui` appears in Lovable; a conflicting edit ends on `lovable-sync`, both versions kept |
| T10 | Regression | Full unit suite and CI; the 10-step TEST-mode end-to-end run on the Preview; SEO checks (titles, canonical, sitemap, robots, structured data) |
| T11 | Rollback drills | Ruleset disabled and re-enabled; Lovable switched back to `lovable/legacy` |

**Rollback.** Switch Lovable back to `lovable/legacy`; delete `lovable/ui` and the test branches.

**Approval.** **Yes**, after the gates.

---

## R10. Lovable-specific dependencies to remove or replace

Order: after the live site and its data have moved to Vercel and the company's production
Supabase project (Phase 4, separate approval), unless marked earlier.

| # | Dependency | Where | Action | When |
| --- | --- | --- | --- | --- |
| 1 | Live site hosting and Lovable Cloud database (customer data, early-access sign-ups) | Lovable | Migrate to Vercel and production Supabase; export early-access entries first | Phase 4, separate approval |
| 2 | Live-database build fallbacks | `vite.config.ts` | Remove; validate (R4) | Now (R4) |
| 3 | Lovable publish build path (`LOVABLE_SANDBOX`, `DEV_SERVER__PROJECT_PATH`, Cloudflare preset) | `vite.config.ts` | Remove when Lovable no longer publishes | After the live move |
| 4 | `LAMPORTPAY_SHARED_DB` (TEST mode on the live database) | `src/lib/app-mode.server.ts` | Remove | After the live move |
| 5 | `LOVABLE_CRON_SECRET`, `LOVABLE_CRON_SECRET_PREVIOUS` | `src/lib/cron-auth.server.ts` | Remove; `CRON_SECRET` only | After the live move |
| 6 | Unused Lovable cron helper | `src/integrations/supabase/cron-auth.ts` | Delete | Any time (with R10 cleanup) |
| 7 | AI gateway (`LOVABLE_API_KEY`, `@ai-sdk/openai`, `ai`) | `src/lib/ai/recovery.server.ts` | Keep fixed steps only, or move to a provider named in the privacy policy; drop the packages if unused | After the live move |
| 8 | MCP server (`@lovable.dev/mcp-js`) and its routes and manifest | `src/lib/mcp/`, `src/routes/mcp.ts`, `src/routes/[.mcp]/`, `src/routes/[.well-known]/oauth-protected-resource.ts`, `src/routes/[.]lovable.oauth.consent.tsx`, `.lovable/mcp/manifest.json` | Decide: own it (remove the generated-file banners, replace the invented fee text) or remove | Decision any time |
| 9 | Lovable error reporting (unused) | `src/lib/lovable-error-reporting.ts` | Delete or replace with own monitoring | Any time |
| 10 | Lovable-generated Supabase files | `src/integrations/supabase/client.ts`, `client.server.ts`, `auth-middleware.ts`, `types.ts` | Take ownership; generate `types.ts` from our migrations with the Supabase CLI | With R4 (messages) and after the live move |
| 11 | Lovable editor auth broker | `src/integrations/supabase/previewAuthStorage.ts` (used by `client.ts`) | Remove when Lovable previews are no longer used | After Lovable is retired |
| 12 | Lovable hosts accepted for wallet sign-in | `src/lib/identity/wallet-session.server.ts` (`lamportpay.lovable.app`, `*.lovableproject.com`, `id-preview--*.lovable.app`) | Remove those hosts | When Lovable no longer serves the app |
| 13 | Custom wallet sign-in route built because Lovable Cloud could not enable Supabase's Web3 provider | `src/routes/api/wallet/sign-in.ts`, notes in `AGENTS.md` | Confirm which sign-in path Vercel uses (`CLAUDE.md` describes Supabase Web3); keep one | Before LIVE |
| 14 | Cloudflare client-IP branch | `src/lib/payments/rate-limit.server.ts` | Keep for portability or drop | Optional |
| 15 | bun install files and Lovable's package mirror | `bun.lock`, `bunfig.toml` | Remove when Lovable no longer installs packages | After Lovable is retired |
| 16 | Lockfile bot (exists for bun) | `.github/workflows/lockfile.yml` | R5; remove with #15 | R5, then later |
| 17 | Lovable-kept migrations | `drizzle/migrations/` (guarded by `tests/migration-trail.unit.test.ts`) | Delete with the guard's list | After Lovable is retired |
| 18 | Lovable agent memory and task list | `AGENTS.md` (Lovable block and notes), `roadmap.md` | Keep while Lovable edits; then rewrite `AGENTS.md` and drop `roadmap.md` | After Lovable is retired |
| 19 | Lovable GitHub App access to the repository | GitHub → Settings → Integrations | Remove the installation | Last step, owner |
| 20 | Lovable project secrets and environment | Lovable Cloud (not in the repository) | Inventory by the owner; rotate anything shared with Vercel (G2) | With G2 |

---

## First safe changes under existing approvals

All on `vercel-preview-migration`, one commit each, full CI, Preview deployed and checked; nothing
touches `main`, Production, Lovable, the live database, DNS or any setting. You said not to
implement yet, so these wait for your "go".

1. **R0 backup bundle** (local, sent to you): no repository or setting change. **Done.**
2. **R4** remove the live Supabase fallback and add the configuration validator, with tests and
   CI placeholders. **Done (`73847d7`).** Before it is deployed, make sure your local `.env` has the three
   `VITE_SUPABASE_*` values for the dev project.
3. **R6 files**: `CODEOWNERS`, the Lovable allowlist, the guard script, the CI job and their
   tests (inert until R3 makes them required). **Done (`d7e9de6`).**
4. **R5 file**: `lockfile.yml` retargeted to `lovable/**` with pinned actions (inert for `main`).
   **Done (`b48d85f`).**
5. **Docs**: `docs/LOVABLE-VSCODE-WORKFLOW-AUDIT.md` and this plan are committed (owner OK,
   31 Oct). A pointer to them in `docs/STATUS.md` still needs your OK, as you asked for
   `STATUS.md`.

Need your approval, in this order: **R1** (Vercel Ignored Build Step), **R2** (`lovable/legacy`
and the Lovable branch switch), **R3** (rulesets and security settings), then R7, R8, R9, R10.

## Decisions needed

| # | Question | Recommendation |
| --- | --- | --- |
| D1 | Required approvals on `main`: 0 (pull request and CI only) or 1 (GhazanfarGw reviews)? | 1 if GhazanfarGw is available; otherwise 0 plus code owners |
| D2 | Code owners: you only, or you and GhazanfarGw? | Both, so either can review the other |
| D3 | Emergency bypass for the repository admin? | Yes, "pull requests only" mode |
| D4 | Lockfile: retarget to `lovable/**` or delete? | Retarget |
| D5 | MCP server: keep and own, or remove? | Remove unless an AI client uses it |
| D6 | Lovable UI work: before or after the live move off Lovable Cloud? | After, unless gate 2 in R9 is answered "no migrations applied" |
| D7 | R1 applied by me through the Vercel API, or by you in the dashboard? | By me, with a read-back |
