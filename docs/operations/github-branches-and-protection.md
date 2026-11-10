# GitHub: branches, pull requests and protection of `main` (30 Oct 2026)

Read-only inspection of `lamportpay/lamport`. Nothing was deleted, merged into `main`, closed
or force-pushed. The repository is **public**: every branch, commit and document is readable by
anyone, including history.

## People and automation that write to the repository

| Who | Access | Writes to |
|---|---|---|
| `lamportpay` | admin | all branches (also the account Claude Code sessions push as) |
| `GhazanfarGw` | write | feature branches, PR #1 |
| `gpt-engineer-app[bot]` (Lovable's GitHub App) | app | **pushes straight to `main`** on every Lovable edit |
| `github-actions` (`.github/workflows/lockfile.yml`) | `GITHUB_TOKEN` | **pushes to `main`** when `package.json` changes without the lock file |

## Branches (30 Oct, after `git fetch`)

"Not in `main`" / "not in dev" count commits that exist only on that branch.

| Branch | Not in `main` | Not in dev | Last commit | Recommendation |
|---|---|---|---|---|
| `main` | – | 0 (merged into dev, `1d93a4d`) | 30 Oct, Lovable | **Keep.** Production branch |
| `vercel-preview-migration` | all new work | – | 30 Oct | **Keep as the shared development branch** (see below) |
| `fix/vercel-readiness` | 1 | 0 | 29 Oct | Head of open PR #1; fully contained in dev. Close PR #1 as superseded when dev → `main` is opened, then delete |
| `claude/jolly-archimedes-f39xm5` | 1 | 0 | 29 Oct | Fully contained in dev. Delete after approval |
| `fix/launch-blockers` | 0 | 0 | 26 Oct | Fully merged. Delete after approval |
| `docs/readme-accuracy` | 0 | 0 | 25 Oct | Fully merged. Delete after approval |
| `fix/dependency-audit` | 0 | 0 | 24 Oct | Fully merged. Delete after approval |
| `docs/readme-refresh` | 0 | 0 | 21 Oct | Fully merged. Delete after approval |
| `docs/update-project-documentation` | 0 | 0 | 21 Oct | Fully merged. Delete after approval |
| `social-media` | 11 (unrelated history) | 11 | 29 Oct | **Keep** until its content is moved to its own repository (owner decision); it shares no history with the app |

**Pull requests:** one ever opened: lamportpay/lamport#1 (`fix/vercel-readiness` → `main`,
open, by GhazanfarGw, "Prepare for Vercel: cron secret, recovery fallback, schema parity"). Its
single commit is in `vercel-preview-migration`, so the dev → `main` PR supersedes it.

## Shared development branch

Use `vercel-preview-migration` as the one shared development branch for now. Its 22 Vercel
Preview variables are scoped to this branch name; renaming it (for example to `develop`) means
re-scoping every variable first. Feature work: short branches from it, merged back by PR.

## Safe cleanup plan (run only after approval, one command per branch)

1. Approve the list above (everything marked "Delete after approval").
2. Re-check that each branch is still contained before deleting (prints nothing when safe):
   `git fetch origin && git log --oneline origin/vercel-preview-migration..origin/<branch>`
3. Delete: `git push origin --delete <branch>` (or GitHub → Branches → bin icon; GitHub keeps a
   "Restore" button for deleted branches for a while).
4. PR #1: close with a comment pointing to the dev → `main` PR, then delete `fix/vercel-readiness`.
5. `social-media`: create `lamportpay/social-media` (private), push the branch there, verify, then
   delete it here.

## Protecting `main`

A ready-to-import ruleset is in `.github/rulesets/main.json`: GitHub → Settings → Rules →
Rulesets → New ruleset → **Import a ruleset**. It applies to the default branch and:

- blocks deletion and force-pushes;
- requires a pull request with 1 approval, dismisses approvals on new pushes, requires the
  approver to be someone other than the last pusher, and requires review threads resolved;
- requires the CI job `checks` (`.github/workflows/ci.yml`) to pass on an up-to-date branch.

**Decisions before enabling (it changes how Lovable works):**

1. **Lovable edits.** With the ruleset active, Lovable can no longer push to `main`. Either stop
   editing in Lovable (the hosting move makes Lovable optional), or add the Lovable GitHub App as a
   bypass actor (Ruleset → Bypass list → Add bypass → Apps), which lets Lovable skip review.
2. **Lock-file workflow.** `lockfile.yml` pushes to `main` with `GITHUB_TOKEN`; it will be refused.
   It exists for Lovable's dependency edits, so it can be removed if Lovable stops editing, or
   changed to open a PR.
3. **Reviews with two people.** `lamportpay` and `GhazanfarGw` review each other's PRs. A PR that
   only one person can approve (for example when the other is away) waits; an admin can bypass
   only if added to the bypass list, which weakens the rule.
4. Optional: Settings → General → "Automatically delete head branches"; and a lighter ruleset for
   `vercel-preview-migration` (block deletion and force-push only).
