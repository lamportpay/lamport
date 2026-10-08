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
- Treat interrupted HTTP connections as expected cancellations, not reportable SSR failures, so navigation cannot trigger a false crash screen.
- Asset intake routing lives in src/lib/asset-routing (networks separate from assets; providers selected by listing; intake requires explicit allowlist) so new conversion providers plug in without touching the live Jupiter endpoints.
