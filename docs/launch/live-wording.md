# Sandbox wording before LIVE (prepared 3 Nov 2026)

Decision (3 Nov): prepare for LIVE and keep the TEST switch. Users must never see "sandbox" or
"no real money" on a real payment, and the public site must not claim live bank payouts before the
first real payment has been verified (`docs/testing/real-money-test-plan.md`).

## 1. Payment app: switches with the mode (checked 3 Nov)

| Place | Behaviour |
| --- | --- |
| `PaymentJourney.tsx` devnet link and "no fee charged" line | Shown only for TEST payments (`p.testPayment`) |
| `PaymentReceipt.tsx` "Simulated deposit (Stables sandbox)" | Shown only for simulated sandbox deposits |
| `AdminShell.tsx` "DEMO / SIMULATED" badge | Reads the server mode |
| Admin "Sandbox: simulate the deposit" | Hidden unless Stables is the sandbox |
| `ModeBadge.tsx` | Mode indicator by design |
| `RecoveryHelper.tsx` "Demo payment — no real money moves" | **Fixed 3 Nov**: shown only in TEST builds |

`/pay` swaps run through `src/lib/payments/swaps.server.ts` (slippage and price-impact limits), not
through the 0.001–0.01 SOL cap below.

## 2. Public pages: switch at launch, wording to review first

These statements are true today and must change on the day LIVE is unlocked, not before. Plan: one
switch, "LIVE is active" (code lock open, approvals set, production config complete, the same check
as `/api/integration-status` `liveAvailable`), choosing between today's text and reviewed LIVE text.
Keying on the build mode alone is not enough: a Production build is LIVE-mode while still locked.

| File | Says today |
| --- | --- |
| `routes/__root.tsx` | Site description: "payment routing sandbox" |
| `routes/about.tsx` | Stage "Sandbox"; payouts and KYC in the partner's sandbox |
| `routes/compliance.tsx` | Payouts "sandbox demonstrations only"; KYC and payouts DISABLED |
| `routes/docs.tsx`, `routes/how-it-works.tsx`, `routes/blog.index.tsx`, `routes/blog.$slug.tsx` | Sandbox build, demonstration product |
| `routes/contact.tsx` | "Supported (sandbox)" |
| `site/LaunchPopup.tsx` | Runs on devnet, payouts tested in the sandbox |
| `site/HomeCapabilities.tsx`, `site/TechnologyEcosystem.tsx`, `site/VisionRoadmapEcosystem.tsx` | Status labels "Sandbox" |
| `site/SupportedCorridors.tsx`, `site/HomeBankNetwork.tsx`, `site/HomeRegionalNetwork.tsx` | Corridors "sandbox payouts verified" |
| `site/VerificationJourney.tsx` | Sandbox completion is not production KYC |
| `site/TransferSimulator.tsx`, `site/LiveRates.tsx`, `site/WorldPulse.tsx`, `site/VerifiedUsers.tsx`, `site/CitiesNeverSleep.tsx`, `site/PaymentFlowStatus.tsx`, `site/MultiAssetFlow.tsx` | Homepage demo components (kept by decision 30 Sep) labelled "Sandbox" |
| `site/LiveSwapTheater.tsx` + `site/wallet/SwapPanel.tsx`, `site/SwapRoutePreview.tsx` | Homepage swap demo, "Sandbox mode", fixed 0.001–0.01 SOL (`/api/jupiter/quote`, `/order`, `/execute`) |

Open points for the LIVE wording:

- The homepage swap demo: in LIVE its order and execute routes perform real mainnet swaps of the
  user's own SOL. Keep it (relabelled, real swap), turn it into a quote-only preview, or remove it.
- Corridor claims: list only corridors with a completed production payout or Stables' written
  confirmation.
- Marketing wording names LamportPay's own system; partner details belong in the compliance pages
  (marketing decision 29 Oct).

## 3. The switch (implemented 6 Nov 2026)

`getLaunchStage()` (`src/lib/launch-stage.functions.ts`) answers "live" only when the server runs
LIVE MODE and every LIVE requirement is met (`mode === "live" && ok && liveAvailable`); anything
else is "test". The root route loads it once per page load; components read it with
`useLaunchStage()` and route heads with `stageFromMatches(matches)` (`src/lib/launch-stage.ts`).
A LIVE build that is still locked therefore keeps today's wording.

Switched (TEST text unchanged; LIVE text below is a draft for owner/marketing review):

| Place | LIVE behaviour |
| --- | --- |
| `__root.tsx`, `index.tsx` descriptions and hero note | No "sandbox"; "you approve every payment in your own wallet" |
| `LaunchPopup` ("Mainnet launch coming soon") | Not shown |
| `about.tsx` | Stage "Live"; "Where we are" and goal text without sandbox |
| `how-it-works.tsx` | "Open App"; real deposit path described; journey and costs from `paymentFlowCopy("live")` |
| `contact.tsx` map legend | "Supported" |
| `HomeCapabilities`, `TechnologyEcosystem`, `MultiAssetFlow`, `HomeRegionalNetwork` | Sandbox pills become LIVE; sandbox sentences dropped |
| `HomeBankNetwork`, `SupportedCorridors` | No sandbox / DISABLED labels; corridors "open for bank payouts through our payout partner" |
| `VerificationJourney`, `PaymentFlowStatus`, `content/payment-flow.ts` | LIVE labels and LIVE journey / safety / cost text |
| `/pay` TEST notice | Now says the devnet transaction moves test tokens, including the fee |

Test: `tests/live-wording.unit.test.ts` renders the switched components in both stages.

Still to do (need owner, legal or marketing review before LIVE, not changed here):

- `compliance.tsx` (KYC and payouts "DISABLED", regulatory statements) — legal wording.
- `docs.tsx`, `whitepaper.tsx`, `workflow.tsx` — product documentation status lines.
- Corridor list: show only corridors with a completed production payout or Stables' written
  confirmation (`SupportedCorridors`, `contact.tsx` map, `HomeBankNetwork` banks).
- Homepage demo widgets (`LiveSwapTheater`, `SwapRoutePreview`, `WorldPulse`, `VerifiedUsers`,
  `LiveRates`, `CitiesNeverSleep`, `TransferSimulator`, `VisionRoadmapEcosystem`): keep, relabel or
  remove in LIVE (the swap demo is already quote-only in LIVE).
- Content data (`content/roadmap*.ts`, `integrations.ts`, `integration-status.ts`, `news.ts`, blog
  posts): dated or roadmap statements; review which become false at launch.
