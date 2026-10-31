# LamportPay on a Windows PC: backup, VS Code setup and daily Git workflow

Written 31 October 2026 and checked against the repository. All commands are **PowerShell**
(Windows Terminal or the VS Code terminal). Run them in the order shown.

| What | Value |
| --- | --- |
| Repository | `https://github.com/lamportpay/lamport` (public) |
| Integration branch: normal development starts here | `vercel-preview-migration` |
| Production branch: never push or commit to it directly | `main` (still the Lovable code until the owner-approved release) |
| Lovable's branch: never touch from VS Code | `lovable/legacy` (copy of the live site's code at `e1b3e61`) |
| Latest commit | Run `git log -1 --oneline origin/vercel-preview-migration` after cloning; `docs/STATUS.md` §3 lists the work commit by commit |
| Node.js | **22.x** (`package.json` → `engines.node`; CI and Vercel use 22) with the npm 10 that comes with it |
| Dev server | `npm run dev` → `vite dev` on **http://localhost:8080** (fixed port, `strictPort`) |

Where things go on your PC:

| Folder | Contents |
| --- | --- |
| `C:\LamportPay\lamport` | Working copy you open in VS Code |
| `C:\LamportPay\backups\<date>\` | Mirror, Git bundle, source ZIP and checksums |
| A second place you control (external drive or Google Drive) | Copy of the bundle, ZIP and checksums |

Keep the working copy **outside** OneDrive or Google Drive folders: `node_modules` has tens of
thousands of files and sync tools lock them. Keep the path short (`C:\LamportPay`) because
Windows limits path length.

No secrets are in the repository (CI's secret scan checks every push). Your own `.env` file
holds keys; it is git-ignored and must **never** go into a backup, a ZIP, a chat or a commit.

---

## 1. Install the tools (once)

```powershell
winget install --id Git.Git -e
winget install --id Microsoft.VisualStudioCode -e
winget install --id GitHub.cli -e
winget install --id CoreyButler.NVMforWindows -e
```

Close and reopen the terminal, then install Node.js 22 with nvm-windows:

```powershell
nvm install 22
nvm use 22
node -v    # must print v22.x
npm -v     # 10.x
```

(Without nvm: download the **v22** Windows installer from nodejs.org → Download → "Previous
releases" / v22 line. Do not use a newer major version; `engines` requires 22.x.)

Git settings (once per PC):

```powershell
git config --global user.name "Your Name"
git config --global user.email "you@example.com"
git config --global core.longpaths true
gh auth login     # GitHub.com, HTTPS, log in with a browser
```

Line endings need nothing extra: `.gitattributes` keeps every file LF, which Prettier expects.

## 2. Complete local backup

Copy the whole block into PowerShell. It creates, in `C:\LamportPay\backups\<today>\`:
a mirror of every branch, tag and commit; a one-file Git bundle of all branches and tags; the
working copy in `C:\LamportPay\lamport`; a ZIP of the source at the latest commit (tracked files
only, so no `.env` and no `node_modules`); and a checksum file.

```powershell
$Repo   = "https://github.com/lamportpay/lamport.git"
$Branch = "vercel-preview-migration"
$Root   = "C:\LamportPay"
$Date   = Get-Date -Format "yyyy-MM-dd"
$Backup = Join-Path $Root "backups\$Date"
$Mirror = Join-Path $Backup "lamport-mirror.git"
$Bundle = Join-Path $Backup "lamport-all-$Date.bundle"
New-Item -ItemType Directory -Force -Path $Backup | Out-Null

# a) Mirror: every branch, tag and commit
git clone --mirror $Repo $Mirror

# b) One-file bundle of all branches and tags
git -C $Mirror bundle create $Bundle --branches --tags
git -C $Mirror bundle verify $Bundle

# c) Working copy for VS Code, on the integration branch
git clone --branch $Branch $Repo (Join-Path $Root "lamport")
Set-Location (Join-Path $Root "lamport")
git log -1 --format="Integration branch at %H (%ci): %s"

# d) Source ZIP of the latest commit (tracked files only)
$Sha = git rev-parse --short HEAD
$Zip = Join-Path $Backup "lamport-$Branch-$Sha.zip"
git archive --format=zip --output $Zip HEAD
```

The bundle is about 320 MB because the `social-media` branch holds videos; the mirror is similar.

### Verify the backup

```powershell
# 1. Every branch and tag on GitHub is in the bundle, at the same commit
$remote = git ls-remote --heads --tags $Repo | Where-Object { $_ -notmatch '\^\{\}$' } | ForEach-Object { $_ -replace "`t", " " } | Sort-Object
$inBundle = git -C $Mirror bundle list-heads $Bundle | Sort-Object
$diff = Compare-Object $remote $inBundle
if ($diff) { "MISMATCH:"; $diff } else { "OK: bundle matches GitHub ($($inBundle.Count) branches and tags)" }

# 2. The bundle restores to a working repository
$Test = Join-Path $env:TEMP "lamport-restore-test"
Remove-Item -Recurse -Force $Test -ErrorAction SilentlyContinue
git clone --quiet --no-checkout $Bundle $Test
git -C $Test log -1 --format="Restored: %h %s" origin/vercel-preview-migration
git -C $Test fsck --no-progress
Remove-Item -Recurse -Force $Test

# 3. The ZIP holds the project files, the 31 migrations and no env file with values
$Unz = Join-Path $env:TEMP "lamport-zip-test"
Remove-Item -Recurse -Force $Unz -ErrorAction SilentlyContinue
Expand-Archive $Zip $Unz
"CLAUDE.md","AGENTS.md","docs\STATUS.md",".env.example","package.json","package-lock.json","vite.config.ts","supabase\config.toml" |
  ForEach-Object { "{0,-24} present: {1}" -f $_, (Test-Path (Join-Path $Unz $_)) }
"Migrations: " + (Get-ChildItem (Join-Path $Unz "supabase\migrations") -Filter *.sql).Count + " (expected 31)"
"Env files other than .env.example (expected 0): " + (Get-ChildItem $Unz -Recurse -Force -Filter ".env*" | Where-Object Name -ne ".env.example").Count
Remove-Item -Recurse -Force $Unz

# 4. Checksums, plus the commit the backup was taken at
Get-ChildItem $Backup -File | Get-FileHash -Algorithm SHA256 |
  ForEach-Object { "{0}  {1}" -f $_.Hash, (Split-Path $_.Path -Leaf) } | Out-File (Join-Path $Backup "SHA256SUMS.txt")
git log -1 --format="Integration branch $Branch at %H (%ci)" | Out-File -Append (Join-Path $Backup "SHA256SUMS.txt")
Get-Content (Join-Path $Backup "SHA256SUMS.txt")
```

All four checks should report OK / True / 31 / 0. Then copy the backup to a second place, for
example an external drive `E:` or Google Drive for desktop `G:\My Drive`:

```powershell
$Offsite = "E:\LamportPay-backups\$Date"      # or "G:\My Drive\LamportPay-backups\$Date"
New-Item -ItemType Directory -Force -Path $Offsite | Out-Null
Copy-Item (Join-Path $Backup "*.bundle"), (Join-Path $Backup "*.zip"), (Join-Path $Backup "SHA256SUMS.txt") $Offsite
```

Restore later from the bundle alone:

```powershell
git clone C:\LamportPay\backups\2026-10-31\lamport-all-2026-10-31.bundle C:\LamportPay\lamport-restored
git -C C:\LamportPay\lamport-restored remote set-url origin https://github.com/lamportpay/lamport.git
```

What the backup does **not** contain, by design: `.env` files and keys, Vercel and Supabase
settings, the databases and their customer data. Those live in Vercel, Supabase and Lovable.

## 3. Open the project in VS Code

```powershell
Set-Location C:\LamportPay\lamport
git config core.hooksPath .githooks     # local guard: refuses pushes to main, the integration branch and lovable/legacy
npm ci                                  # installs exactly package-lock.json (never bun, never plain npm install)
code .
```

VS Code offers the recommended extensions from `.vscode/extensions.json` (ESLint, Prettier,
Tailwind CSS, Vitest, GitHub Pull Requests): accept them. Use the PowerShell terminal inside
VS Code (`` Ctrl+` ``).

Read `CLAUDE.md` (the rules) and `docs/STATUS.md` (what is done and left) before changing code.
Any AI assistant in VS Code starts from `AGENTS.md`, which points to both.

## 4. Environment variables (TEST mode, dev database)

```powershell
Copy-Item .env.example .env
code .env
```

Fill in only these for local work, leaving everything else empty. **Copy keys from the
dashboards; never paste them into chats or commits.**

```dotenv
LAMPORTPAY_MODE=test
VITE_LAMPORTPAY_MODE=test

VITE_SUPABASE_URL=https://gdksfksypkcfiohozzsx.supabase.co
VITE_SUPABASE_PROJECT_ID=gdksfksypkcfiohozzsx
VITE_SUPABASE_PUBLISHABLE_KEY=<dev project publishable key, sb_publishable_...>
SUPABASE_URL=https://gdksfksypkcfiohozzsx.supabase.co
SUPABASE_PROJECT_ID=gdksfksypkcfiohozzsx
SUPABASE_PUBLISHABLE_KEY=<same publishable key>
SUPABASE_SERVICE_ROLE_KEY=<dev project secret key, sb_secret_...; server only>

STABLES_API_URL=https://api.sandbox.stables.money
STABLES_API_KEY=<Stables SANDBOX key, sti_test_...>
```

Where to find them: Supabase dashboard → project **LamportPay** (`gdksfksypkcfiohozzsx`) →
Project Settings → API Keys (publishable and secret); Stables **sandbox** dashboard → API keys.
Optional: `SOLANA_DEVNET_RPC_URL` (your own devnet RPC), `JUPITER_API_KEY` (quotes),
`CRON_SECRET` (any long random string, only for `npm run reconcile`).

**Never put these in a local `.env`:** `LAMPORTPAY_SHARED_DB`, `SOLANA_RPC_URL` (mainnet),
`LAMPORTPAY_LIVE_APPROVED_BY` / `_AT` / `LAMPORTPAY_LIVE_URL`, any `sti_live_` key, or any value
of the Lovable project `zmcbnknjatrfwrcfvtzt`.

How local work is kept away from live data and real money:
- No Supabase default exists: `npm run dev` and `npm run build` stop if a `VITE_SUPABASE_*`
  value is missing or inconsistent, and refuse the live Lovable project (`src/lib/public-env.ts`).
- TEST mode refuses the live database, mainnet RPC and any live Stables key, and pays nothing:
  Pay Now signs a devnet memo that moves no funds.
- LIVE mode is locked in the code (`src/lib/app-mode-lock.ts`).

## 5. Run the app

```powershell
npm run dev
```

Open **http://localhost:8080**. Useful pages: `/pay` (the app), `/admin/login` (admin; needs
an admin account on the dev project with the authenticator app), and
`http://localhost:8080/api/integration-status`, which should show `"mode":"test"` and `"ok":true`.
Stop the server with `Ctrl+C`. After any change to `.env`, stop and start it again.

### Fixing configuration problems

| You see | Cause and fix |
| --- | --- |
| `LamportPay public configuration is not valid (vite serve): - Missing VITE_SUPABASE_URL, ...` | A browser-side Supabase value is empty: fill it in `.env` and restart |
| `... name different projects` | URL, project ID and `SUPABASE_URL` must all use `gdksfksypkcfiohozzsx` |
| `... holds a secret key` / `... service-role key` / `... is not a Supabase publishable key` | The publishable key field holds the wrong key: use `sb_publishable_...` |
| `... point at the live (Lovable Cloud) database` | A value names the Lovable project: replace it with the dev project's |
| `... VITE_LAMPORTPAY_MODE (x) and LAMPORTPAY_MODE (y) differ` | Set both to `test` |
| Server log `Missing Supabase environment variable(s): SUPABASE_URL ...` | Server-side values missing: `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY` |
| `/api/kyc` or `/api/payments` answer 503 | `STABLES_API_KEY` missing (sandbox key) |
| `/api/integration-status` shows `"ok": false` | Read its `problems` list; each names the variable to fix |
| Wallet sign-in says it is not switched on | Supabase dev project → Authentication → Providers → Web3 (Solana) on, and `http://localhost:8080` in URL Configuration → Redirect URLs |
| `Port 8080 is already in use` | `Get-Process -Id (Get-NetTCPConnection -LocalPort 8080).OwningProcess` then stop that process |
| `npm run build` fails with `EISDIR` on Windows | `$env:NITRO_NO_EXTERNALS = "1"; npm run build` |
| `npm ci` complains the lock file is out of sync | Someone changed `package.json` without the lock file: `npm install`, commit both files in a pull request |

Before every pull request, run what CI runs:

```powershell
node scripts/check-repo-secrets.mjs
npm run typecheck
npm run lint:ci
npm run test:unit
```

## 6. Daily Git workflow

Rules: every change goes on a **feature branch** and reaches `vercel-preview-migration`
through a **pull request** with green CI. Nobody pushes to `main`; it changes only through the
owner-approved release pull request. The local hook (section 3) and GitHub's rulesets refuse
direct pushes to `main`, `vercel-preview-migration` and `lovable/legacy`.

```powershell
# Where am I, and is anything uncommitted?
Set-Location C:\LamportPay\lamport
git branch --show-current
git status

# Start from the latest integration branch
git switch vercel-preview-migration
git pull --ff-only origin vercel-preview-migration

# New feature branch (feat/... for features, fix/... for fixes, docs/... for documents)
git switch -c feat/short-description

# ... edit in VS Code ..., then check what changed
git status
git diff

# Commit (repeat as often as useful)
git add -A
git commit -m "Short summary of the change"

# Push the branch and open a pull request into the integration branch
git push -u origin feat/short-description
gh pr create --base vercel-preview-migration --head feat/short-description --title "Short summary" --body "What changed and why"

# Watch CI; merge once it is green and you have reviewed the diff
gh pr checks --watch
gh pr merge --squash --delete-branch

# Back to the updated integration branch
git switch vercel-preview-migration
git pull --ff-only origin vercel-preview-migration
```

Without the GitHub CLI, open
`https://github.com/lamportpay/lamport/compare/vercel-preview-migration...feat/short-description`
and press **Create pull request**, then **Squash and merge** when CI is green.

Keep a long-running branch current: `git fetch origin` then
`git merge origin/vercel-preview-migration`. Never `git push --force` to a shared branch.

After a merge into `vercel-preview-migration`, Vercel builds a protected Preview of it
automatically (Vercel login needed to open it).

**Release to production (owner only):** a pull request from `vercel-preview-migration` into
`main` (`gh pr create --base main --head vercel-preview-migration`), merged only with the
owner's approval. Merging deploys nothing: Production is a separate, deliberate step
(`docs/migration/production-cutover-checklist.md`).
