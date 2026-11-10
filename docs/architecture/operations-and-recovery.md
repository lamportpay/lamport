# Payment operations, status sources and failure recovery

Status: design + current implementation, 7 Oct 2026 (TEST MODE). LIVE MODE stays locked.

## 1. Who owns the payment status

LamportPay owns the states **before** a Stables transfer exists (`PAYMENT_CREATED`, `KYC_PENDING`,
`KYC_APPROVED`, `QUOTED`, `KYC_REJECTED`). From the transfer on, the status **is Stables' transfer
status** (`CREATED` → `AWAITING_FUNDS_COLLECTION` → `FUNDS_COLLECTED` → `IN_PROGRESS` →
`PAYMENT_SUBMITTED` → `PAYMENT_PROCESSED` → `COMPLETED`, plus `COMPLIANCE_HOLD`, `FAILED`,
`CANCELLED`, `EXPIRED`). The state machine is `src/lib/payments/state.ts` together with the
database check constraint on `payments.status`:

- forward-only: a stale or replayed answer can never move a payment backwards;
- `COMPLETED`, `FAILED`, `CANCELLED`, `EXPIRED`, `KYC_REJECTED` are terminal;
- `COMPLIANCE_HOLD` resumes at the same state or later;
- `CANCELLED` / `EXPIRED` are only possible before funds are collected;
- nothing in LamportPay (admin included) can set `COMPLETED`; only Stables' reported status can.

### Why the checklist's extra states are not payment states

The checklist lists `REFUND_REQUIRED`, `REFUND_PENDING`, `REFUNDED`, `RETURNED_PAYOUT`,
`COMPLIANCE_REVIEW`, `COMPLIANCE_REJECTED`. Stables reports none of these as transfer states, and
the project rules forbid inventing payment states or a parallel Stables state machine. They are
modelled as:

| Checklist state                                                  | Where it lives                                                                                                        |
| ---------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| COMPLIANCE_REVIEW                                                | Stables' `COMPLIANCE_HOLD` (already a payment state)                                                                  |
| COMPLIANCE_REJECTED                                              | Stables ends the transfer (`FAILED`/`CANCELLED`); alert "ended after funds" + an operations case of kind `compliance` |
| REFUND_REQUIRED / REFUND_PENDING / REFUNDED                      | Operations case statuses (`refund_required` → `refund_requested` / `waiting_for_stables` → `refund_confirmed`)        |
| RETURNED_PAYOUT                                                  | Operations case of kind `returned_payout` (Stables handles returns manually, answer #8)                               |
| WALLET_APPROVAL / WALLET_TRANSACTION_DETECTED / DEPOSIT_RECEIVED | UI journey steps derived from the payment and its events (`dappStepFor`), not stored states                           |

If Stables later confirms dedicated refund/return statuses or events, they are added to the state
machine then, from Stables' definitions.

## 2. Three ways a status reaches LamportPay

| Layer                 | What                                                                                                                                                                                              | Where                                                              |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| Primary               | Stables webhooks (Svix-signed, 5-minute timestamp tolerance, deduplicated by `event_id` in `stables_webhook_events`, applied through the state machine)                                           | `/api/public/stables-webhook`, `src/lib/stables/webhook.server.ts` |
| Fallback              | Live status sync: whenever a payment is viewed (user or admin), its transfer is read from Stables (throttled to every 8 s) and applied; the admin list re-reads the 10 open payments most in need | `syncPaymentWithStables`, `syncOpenPayments`                       |
| Fallback (background) | Reconciliation job: retries stored webhooks that failed, then reads every active transfer                                                                                                         | `/api/cron/reconcile-payments` (Bearer `CRON_SECRET`)              |
| Emergency             | Admin **Recheck Stables** on the payment page (forced read, same state machine)                                                                                                                   | `recheckStablesAdmin`                                              |

Rules that hold for every layer: duplicate events are acknowledged and ignored; a failed read
keeps the last known status (never downgrades, never guesses); errors are logged with the payment
ID and the Stables correlation ID.

### Background schedule (corrected 7 Oct 2026, round 2)

| Scheduler                               | Frequency                                                                                                           | Where                                                                                                                                                                                                                                                 | State                                                                              |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| Vercel Cron (backstop)                  | once a day (`0 5 * * *`) — the most the Vercel **Hobby** plan allows; `RECONCILE_CRON_SCHEDULE` can raise it on Pro | `vite.config.ts` → Nitro `vercel.config.crons`                                                                                                                                                                                                        | Configured (runs once deployed)                                                    |
| **Supabase pg_cron + pg_net** (primary) | every 5 minutes                                                                                                     | migration `20261007130000_reconcile_scheduler.sql`: `cron` job `lamportpay-reconcile-payments` calls `public.trigger_payment_reconciliation()`, which POSTs to the deployed `/api/cron/reconcile-payments` with `Authorization: Bearer <CRON_SECRET>` | Installed on the dev DB; **inert** until two Vault secrets exist on an environment |

The earlier note "not scheduled" was wrong: the daily Vercel cron already existed. A daily run
is not enough for payments, so the 5-minute Supabase scheduler is the primary mechanism. It is
independent of the hosting plan, uses the existing Supabase project, and is safe to overlap
(the endpoint is idempotent: forward-only state machine, deduplicated webhooks, `reconciled_at`
rotation).

Enable on an environment (once, Supabase SQL editor — never commit the values):

```sql
select vault.create_secret('https://<deployment-host>/api/cron/reconcile-payments', 'lamportpay_reconcile_url');
select vault.create_secret('<CRON_SECRET of that deployment>', 'lamportpay_cron_secret');
```

The function refuses non-https URLs and does nothing without both secrets. Each run logs
`payments_reconciled` (counts) and one `reconcile_checked` line per payment (payment ID,
transfer ID, status before, advanced/settled); status changes are written to `payment_events`
with `source = reconcile`. pg_net keeps each HTTP response in `net._http_response` for checking.
The job also prunes old rate-limit counters.

## 3. Operations alerts

`src/lib/payments/attention.ts` (pure, unit-tested) decides what needs a person. It never
changes a payment.

| Alert                                | Severity                       | Rule                                                                                | Next action                                         |
| ------------------------------------ | ------------------------------ | ----------------------------------------------------------------------------------- | --------------------------------------------------- |
| Wrong deposit amount reached Stables | critical                       | a rejected deposit moved funds and no correct deposit was verified                  | open a case; Stables returns funds manually         |
| Ended after funds reached Stables    | critical                       | `FAILED`/`CANCELLED`/`EXPIRED` after funds were collected or a deposit was verified | open a refund case                                  |
| Compliance review at Stables         | warning                        | `COMPLIANCE_HOLD`                                                                   | ask Stables what information they need (answer #12) |
| No update from Stables               | warning ≥ 2 h, critical ≥ 24 h | after the deposit, no status change                                                 | Recheck Stables, then raise with Stables            |
| Deposit not received                 | info                           | transfer unfunded ≥ 24 h                                                            | none unless the user reports a deposit              |
| Quote expired, never paid            | info                           | `QUOTED`, quote expired ≥ 1 h                                                       | none                                                |
| Webhook failed to apply              | warning                        | a stored delivery for the transfer has a processing error                           | retried automatically; compare with Stables         |
| Operations case open                 | warning                        | an open case exists                                                                 | follow the case                                     |

Thresholds are constants in one place (`ATTENTION_AFTER_MS`, `STUCK_AFTER_MS`). The 24 h critical
threshold follows Stables' answers #10/#50 (local rails same day, SWIFT up to T+3).

The admin payments list shows the alerts and filters: needs attention, critical only, open case /
refund, pending, processing, completed, failed, compliance review, today, plus status and free
text (ID, transfer, user, wallet, country).

### 3a. Alerts pushed to the team (webhook failures, stuck payments, payments ended after funds; 30 Oct 2026)

The alerts above are shown in the admin. These are sent to the team's channel, because nobody
watches the admin all day. The reconcile job (`/api/cron/reconcile-payments`) runs them after it has
retried stored webhooks and re-read open transfers from Stables, so an alert means catching up did
not help. Rules (pure, unit-tested): `src/lib/ops/webhook-alerts.ts`, `src/lib/ops/payment-alerts.ts`;
sending: `src/lib/ops/alerts.server.ts`, `alert-policy.ts`, `notify.server.ts`.

| Alert (key)                                                                   | Severity                                                    | Rule                                                                                                                                                                                                                             | Next action                                                                                     |
| ----------------------------------------------------------------------------- | ----------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| Webhook secret missing (`webhook_secret_missing`)                             | critical                                                    | Stables is configured but `STABLES_WEBHOOK_SECRET` is not, so every signed delivery gets 503                                                                                                                                     | set the secret from the Stables dashboard and redeploy                                          |
| Webhooks not applied (`webhook_not_applied`)                                  | warning ≥ 15 min, critical ≥ 2 h                            | stored deliveries (last 14 days) with no `processed_at`; grouped by type and by `process_error`                                                                                                                                  | read the reasons; Recheck Stables; fix the cause                                                |
| Webhooks missing (`webhook_missing`)                                          | warning; critical when every recent transfer (≥ 2) has none | transfers created 30 min to 3 days ago with no stored delivery at all                                                                                                                                                            | check the endpoint in the Stables dashboard (URL, enabled, signing secret) and its delivery log |
| Payment stuck (`payment_stuck:<payment id>`, one per payment)                 | warning ≥ 2 h, critical ≥ 24 h                              | the admin's "No update from Stables" rule: funds at Stables (`FUNDS_COLLECTED` … `PAYMENT_PROCESSED`, `COMPLIANCE_HOLD`) and no status change; left out while the payment has an open operations case                            | Recheck Stables; raise the transfer ID with Stables; or open a case, which stops the alert      |
| Ended after funds (`payment_ended_after_funds:<payment id>`, one per payment) | critical                                                    | the admin's "ended after funds" rule: `FAILED`/`CANCELLED`/`EXPIRED` after a verified deposit or a funds state; left out once the payment has any operations case (open or closed); taken off the channel 14 days after it ended | open a refund case and arrange the return with Stables (answers #1, #19)                        |

- **Channel:** `OPS_ALERT_WEBHOOK_URL` (https; a Slack incoming webhook works as is; the URL is a
  credential and is never logged). Every alert is also logged as one `ops_alert` JSON line
  (with `delivery`: sent, failed or no_channel), and each run logs `ops_alerts_checked`.
- **No repeats:** `ops_alerts` keeps one row per key. An alert is sent when it opens, again at once
  if it becomes critical, then as a reminder every 6 h (critical) or 24 h (warning) while open. When
  the condition clears the row is resolved and a "Resolved after …" message follows. An
  ended-after-funds alert still without a case 14 days after the payment ended is closed with "No
  longer alerted after …" and the reason instead (it stays under Needs attention in the admin). Sending is
  claimed with a conditional update, so overlapping runs send once; a failed send is retried on the
  next run. At most 10 messages per run (most severe first); the rest go on the next run, so a burst
  (every open payment stuck in a Stables outage) stays inside the job's time budget.
- **One failing check does not hide the others:** if the webhook, stuck-payment or ended-payment
  facts cannot be read, the other sets still run, and the failed set's open alerts stay open (never resolved by a
  failed check). The run's report lists it under `errors`.
- **Content:** mode, severity, next step, counts, reasons, payment/transfer/event IDs. Never names,
  bank details, wallet addresses or amounts.
- **Runs only when the job runs:** the Supabase pg_cron job (every 5 minutes, needs its Vault
  secrets) or the daily Vercel Cron (Production only). Until the Vault secrets are set, alerts run
  once a day in Production and not at all on Preview.
- Not pushed (admin only): wrong deposit amounts, deposits not received, abandoned quotes. Refused deliveries with a wrong signature are not stored;
  the "missing" rule catches their effect.

## 4. Operations cases (refunds and other manual follow-ups)

Stables returns funds manually with its operations team (answers #1, #8, #19–22). LamportPay never
holds or moves customer funds, so a refund is coordination, recorded in an **operations case**
next to the payment (`payment_cases`, history in `payment_case_events`).

- Kinds: refund, wrong amount, returned payout, compliance, KYC, stuck, other.
- Workflow: refund required → refund requested → waiting for Stables → refund confirmed / refund
  failed (can be requested again) → customer notified → closed. Any open case can be closed with a
  required resolution note; a closed case never reopens (open a new one).
- Recorded facts: Stables reference, original wallet, amount, asset, refund amount, refund
  destination (agreed case by case), Stables communication, refund transaction hash, who did what
  and when.
- Database rules: one open case per payment; a refund transaction hash belongs to one case;
  admins only (RLS); history is append-only (trigger rejects update/delete); every action is also
  written to the admin audit log.
- A case never changes `payments.status`.

## 5. Failure recovery (checklist item 20)

| Failure                                                                  | What happens                                                                                                                   | Status                                                                                |
| ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------- |
| Browser closed / tab closed / internet lost after the wallet approved    | The deposit is on-chain; Stables sees it and sends webhooks; reopening `/pay` or the payment history shows the server's status | Implemented                                                                           |
| Payment made, browser disappears before LamportPay records the signature | Stables still collects the deposit and the status follows Stables (webhook / sync)                                             | Implemented                                                                           |
| Webhook delayed or never delivered                                       | Live sync on view; reconciliation job                                                                                          | Implemented; 5-minute schedule installed, **needs the Vault secrets per environment** |
| Webhook duplicated                                                       | Deduplicated by `event_id`; forward-only state machine                                                                         | Implemented                                                                           |
| Stables API down                                                         | Reads fail and keep the last known status; quote/transfer creation returns a clear error; nothing is guessed                   | Implemented                                                                           |
| Solana RPC down                                                          | Balance reads report "unavailable" (never zero); deposit verification refuses rather than guessing                             | Implemented                                                                           |
| Database unavailable                                                     | Requests fail with an error; webhook deliveries are not acknowledged, so Stables retries                                       | Implemented (relies on Stables' retries)                                              |
| Server restart                                                           | No in-memory payment state; everything is in the database                                                                      | Implemented                                                                           |
| A payment stuck for any reason                                           | Alerts + Recheck Stables + operations case                                                                                     | Implemented (this round)                                                              |

## 6. Customer notifications (checklist item 21) — architecture only

Not implemented (needs a decision on the provider and the wording). Design:

- Triggers are the existing state transitions and case changes: payment received
  (`FUNDS_COLLECTED`), processing (`IN_PROGRESS`), completed, failed, refund required (case
  opened), refund completed (case `refund_confirmed`), action required (Travel Rule / KYC).
- Sent by LamportPay only (Stables never messages our users, answer #6).
- One outbox table keyed by `(payment_id, event)` so a duplicate webhook can never send twice; a
  worker sends and records the provider message ID.
- Content: amount, currency, payment ID, current step, next step; never full bank details or KYC
  data.

## 7. Customer support model (checklist item 22)

Every support question is traced through the admin payment page, which shows: payment ID, customer
(user ID and verified wallet), Stables transfer ID, deposit address and transaction hash, full
timeline with Stables' answers, fee ledger and receipt. The operations case records the follow-up
(wrong amount, payout rejected, refund pending, compliance review, KYC problem, stuck).

## 8. Emergency controls (round 2)

Admin → Settings → **Emergency controls**, stored per mode in `business_settings.payment_controls`
(TEST rules never affect LIVE and the reverse). Pure rules in `src/lib/payments/controls.ts`.

| Control                                     | Effect (server-side)                                                                                                                                        |
| ------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Global pause (reason required)              | Refuses new payments, quotes, transfers, the in-app funding transaction and TEST Pay Now with 503 `payments_paused`. The `/pay` estimate shows the message. |
| Currency (corridor) pause (reason required) | Refuses new payments, quotes and transfers to that payout currency with 503 `corridor_paused`.                                                              |
| Currency limits (min/max USDC)              | Narrow the coin limits for that payout currency only (never widen); a contradiction with the coin limits fails closed (503).                                |

- Payments already sent are never touched: their status keeps following Stables.
- Invalid stored controls fail closed (everything paused) and log an error.
- Every change needs a note and is written to the admin audit log (`payments_paused`,
  `payments_resumed`, `payment_controls_changed`, with before/after values) and logged as
  `payment_controls_changed`.

## 9. Rate limiting (round 2)

Shared by every server instance: a fixed-window counter in Postgres (`rate_limit_hit`, service
role only). Per signed-in user per minute: 120 on every payment/KYC route, plus 10 payment
creations, 20 quotes, 10 transfers, 20 funding/Pay Now calls, 10 KYC starts. Public estimate and
balance endpoints keep their per-IP/user limits, now shared. The Stables webhook allows 300 per
minute per IP and refuses bodies over 256 KB before any signature work. If the database cannot be
reached the limiter falls back to the per-instance limit (never fully open). A refused call answers
429 `rate_limited` and is logged without the user ID or IP.

## 10. Reports (round 2)

Admin → Payments → **Reports (UTC)**: CSV export of payments for up to 31 days (formula-safe
cells, no bank details; audited as `payments_exported`), and a daily reconciliation report: payments
created by status, amounts sent per coin, LamportPay fees on those payments vs fee-ledger entries,
completed payouts (quoted vs actual — actual stays 0 until Stables reports `actual_payout`, #55),
open cases, failed webhooks and transfers waiting on Stables.
