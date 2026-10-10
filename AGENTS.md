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
- Keep public roadmap milestones in shared content for the homepage and whitepaper; animate the timeline only on viewport entry and respect reduced motion, so wording remains consistent and accessible.
- Treat interrupted HTTP connections as expected cancellations, not reportable SSR failures, so navigation cannot trigger a false crash screen.
- Asset intake routing lives in src/lib/asset-routing (networks separate from assets; providers selected by listing; intake requires explicit allowlist) so new conversion providers plug in without touching the live Jupiter endpoints.
- Lovable Cloud serves preview and production from one shared Supabase instance (LAMPORTPAY_SHARED_DB=1); the two-database TEST-mode rule is relaxed accordingly, never with a production database.
