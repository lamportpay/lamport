# Instructions for GitHub Copilot

Before suggesting or changing anything in this repository:

1. Read `CLAUDE.md`: the project rules (non-custodial payments, one 2% fee, TEST/LIVE mode,
   secrets handling, which database may be used). They win over any other document.
2. Read `docs/STATUS.md`: what is built, where the code is, what is left and what needs the
   owner's approval before LIVE.
3. Work on a feature branch from `vercel-preview-migration` and open a pull request into it
   (`docs/LOCAL-SETUP-WINDOWS.md` section 6). Never push to `main`, deploy to Production, switch
   on LIVE mode, change the domain or DNS, or use the Lovable live database without the owner's
   approval. `https://lamportpay.com` stays the domain.
4. Never put secrets in code, commits or `VITE_` variables. Amounts are integer minor units
   (`src/lib/money.ts`); all fee arithmetic lives in `src/lib/payments/fee-math.ts`.
