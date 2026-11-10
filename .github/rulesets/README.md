# GitHub rulesets (remediation R3, owner-approved 31 Oct 2026)

GitHub does not read these files by itself. The owner imports each one once:
GitHub → repository **Settings → Rules → Rulesets → New ruleset → Import a ruleset** → choose the
file → **Create**. Check afterwards that both show "Active".

| File | Branch | What it does |
| --- | --- | --- |
| `main.json` | `main` (default branch) | No deletion, no force push. Changes only through a pull request with the CI checks `checks` and `lovable-path-guard` green and up to date, and review by the code owner (`.github/CODEOWNERS`). Repository admins may merge a pull request without the review (bypass "pull requests only"); nobody can push to `main` directly |
| `vercel-preview-migration.json` | `vercel-preview-migration` | No deletion, no force push. Changes only through a pull request with `checks` and `lovable-path-guard` green (plan R7); no review count, so the owner can merge their own pull requests. Admins may bypass for pull requests only |

Decisions behind them (plan D1–D3, owner approval 31 Oct): no separate approval count beyond the
code owner; `@lamportpay` is the only code owner; admins may bypass for pull requests only, never
for direct pushes.

Check after importing (nothing is pushed): Settings → Rules → Rulesets lists both as **Active**,
and Code → Branches shows `main` and `vercel-preview-migration` with the protected (shield) mark.
Do not "test" by pushing to `main`. The local hook `.githooks/pre-push` refuses the same pushes on
a PC where `git config core.hooksPath .githooks` was run.

AI sessions and scripts that used to push straight to `vercel-preview-migration` must push a
feature branch and open a pull request once the integration ruleset is active.

To switch a ruleset off in an emergency: open it and set Enforcement to **Disabled** (instant).
