# GitHub branch protection (checked 4 Nov 2026)

**Finding:** `GET /repos/lamportpay/lamport/rulesets` returns no rulesets. The two files in
`.github/rulesets/` were prepared on 31 Oct but never imported, so GitHub enforces nothing today;
only the local pre-push hook (`.githooks/pre-push`, opt-in per clone) refuses pushes to `main`,
`vercel-preview-migration` and `lovable/legacy`. The account used on this PC (`GhazanfarGw`) has
push but not admin rights, so an organisation owner/admin must import them. Nothing was changed.

## Settings to import

**`main` (`.github/rulesets/main.json`, "Protect main"):** target the default branch; enforcement
active; block deletion; block force pushes (non-fast-forward); pull request required with code
owner review, stale reviews dismissed on push and all review threads resolved; required status
checks `checks` and `lovable-path-guard` (GitHub Actions), branch up to date before merging;
bypass: repository admins via pull request only.

**`vercel-preview-migration` (`.github/rulesets/vercel-preview-migration.json`):** block
deletion and force pushes; pull request required (0 approvals); required checks `checks` and
`lovable-path-guard`; bypass: admins via pull request only.

How to import: GitHub → `lamportpay/lamport` → Settings → Rules → Rulesets → New ruleset → Import
a ruleset → choose each JSON file → Create. Steps also in `.github/rulesets/README.md`.

With the integration ruleset active, routine work still reaches `vercel-preview-migration` only
through a pull request, as decided on 4 Nov.
