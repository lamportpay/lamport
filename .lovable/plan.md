# Align LamportPay with Stables

## Scope
- Replace generic or unnamed payout-provider wording across public pages with Stables-specific information and link to the official Stables website/documentation.
- Keep Jupiter clearly identified only as the SOL-to-USDC swap infrastructure; preserve Solana and wallet references because they are product infrastructure, not alternative payout partners.
- Restrict the demo’s selectable currencies to Stables’ officially documented support:
  - Pay-in display currencies: AUD and AED.
  - Payout currencies: AED, ARS, AUD, BRL, CNY, COP, EUR, GBP, GHS, HKD, IDR, INR, KES, MXN, NGN, PHP, RWF, SGD, THB, TZS, UGX, USD, VND, XAF, XOF, ZAR, and ZMW.
  - Keep USDC and USDT identified as Stables-supported stablecoins, while leaving LamportPay’s existing SOL-to-USDC swap unchanged.
- Update the transfer demo, product explanations, compliance wording, workflow, white paper, homepage, and public MCP descriptions where they expose partner or corridor information.
- Preserve clear capability labels: Stables payout/KYC remains demo or disabled unless the existing runtime reports a configured integration; do not imply that live fiat payout is active.

## Technical details
- Centralize the Stables-supported currency metadata in the existing demo-data module so selectors, quotes, and MCP output use one list.
- Update payout-rail presentation mappings for the supported list without changing API routes, authentication, database, wallet connection, or Jupiter execution.
- Use indicative demo FX values only and label them as non-live.
- Validate the public pages and transfer selector on desktop and mobile, then check the generated build status and targeted tests.
