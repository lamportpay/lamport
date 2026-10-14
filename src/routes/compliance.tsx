import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/Layout";
import { ShieldCheck, XCircle, CheckCircle2 } from "lucide-react";
import { pageSeo } from "@/lib/seo";
import { FurtherReading } from "@/components/site/blog/FurtherReading";
import { PaymentFlowStatus } from "@/components/site/PaymentFlowStatus";
import { PAYMENT_COSTS } from "@/content/payment-flow";
import { BankRestrictions } from "@/components/site/BankRestrictions";

export const Route = createFileRoute("/compliance")({
  head: () =>
    pageSeo({
      path: "/compliance",
      title: "LamportPay Compliance — Verification, Responsibilities and Safeguards",
      description:
        "LamportPay's non-custodial model, Stables-hosted verification, own-account and beneficiary bank-payout design, security safeguards and demo-only status.",
    }),
  component: Compliance,
});

const LAST_UPDATED = "12 October 2026";

function Compliance() {
  const negatives = [
    "Hold customer funds, private keys or balances. Our ledger is a record only.",
    "Collect identity documents. Verification happens on the payout partner's hosted page.",
    "Convert currency or send bank payouts itself.",
    "Offer mobile-wallet, card or cash payouts, or accept unsupported assets and networks.",
    "Ask for a seed phrase or private key. Wallet sign-in is a message signature, never a transaction.",
    "Claim a licence or regulatory approval of its own.",
  ];
  const positives = [
    "Provides the software: quote, checkout, wallet signing request and payment tracking.",
    "Discloses one LamportPay fee, separate payout partner costs, and applicable swap, price-impact and network costs before approval.",
    "Supports a bank-payout design for a verified sender's own account or a beneficiary's account. Current payouts are demo demonstrations only.",
    "Follows the payout partner's transfer status. The partner's record is authoritative.",
    "Keeps an append-only audit log of admin actions.",
    "Uses USDC on Solana as the enabled settlement currency; eligible SOL routing uses Jupiter quotes without mainnet execution in the demo build.",
  ];
  const roles: { activity: string; who: string }[] = [
    {
      activity: "Wallet funds and authorization",
      who: "You control your wallet. In the production design, you send USDC directly to the single-use deposit address Stables issues for the payment. LamportPay holds no funds. The demo build moves no payment funds.",
    },
    {
      activity: "Identity verification (KYC)",
      who: "Stables, on its hosted page. LamportPay collects the name and contact email needed for customer setup, keeps a verification link and status, and does not collect identity documents. Production KYC is DISABLED.",
    },
    { activity: "AML and sanctions screening", who: "Stables' compliance process governs transfer acceptance and any holds. Demo responses do not establish production screening approval." },
    {
      activity: "Travel Rule",
      who: "Stables determines requirements for the transfer. LamportPay records and surfaces required Travel Rule information as a payment requirement, not a separate payment status.",
    },
    {
      activity: "Bank details check, currency conversion and payout",
      who: "Stables validates bank fields, quotes local-currency payout and reports transfer outcomes. Real bank payouts remain DISABLED.",
    },
    {
      activity: "Crypto conversion route",
      who: "Jupiter supplies eligible Solana-to-USDC routing. LIVE · read-only market quotes are available; mainnet swap execution is DISABLED in the demo build.",
    },
    {
      activity: "Quote, fee disclosure, checkout and status tracking",
      who: "LamportPay.",
    },
    { activity: "Approving the transaction", who: "You, in your own wallet. Sign-in uses a plain-text message; demo Pay Now uses a real test network memo transaction that moves no funds." },
  ];
  return (
    <SiteLayout>
      <section className="max-w-5xl mx-auto px-5 py-12 md:py-16">
        <div className="text-xs font-semibold uppercase tracking-wider text-primary">
          Compliance
        </div>
        <h1 className="mt-3 text-4xl md:text-5xl font-semibold">
          LamportPay Compliance
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Non-custodial by design. Clear responsibilities for wallet authorization, verification
          and bank payouts. This page describes the current model; it is not a certification,
          regulatory approval or legal advice.
        </p>
        <p className="mt-2 text-xs text-muted-foreground">Last updated {LAST_UPDATED}.</p>

        <PaymentFlowStatus />

        <div className="mt-6 grid md:grid-cols-2 gap-4">
          <section className="border-t border-border py-6">
            <h2 className="flex items-center gap-2 font-semibold mb-4">
              <XCircle aria-hidden="true" className="w-5 h-5 shrink-0 text-destructive" /> What LamportPay does not do
            </h2>
            <ul className="space-y-3 text-sm">
              {negatives.map((n) => (
                <li key={n} className="text-muted-foreground">
                  {n}
                </li>
              ))}
            </ul>
          </section>
          <section className="border-t border-border py-6">
            <h2 className="flex items-center gap-2 font-semibold mb-4">
              <CheckCircle2 aria-hidden="true" className="w-5 h-5 shrink-0 text-[color:var(--success)]" /> What LamportPay does
            </h2>
            <ul className="space-y-3 text-sm">
              {positives.map((n) => (
                <li key={n} className="text-muted-foreground">
                  {n}
                </li>
              ))}
            </ul>
          </section>
        </div>

        <BankRestrictions />

        <section className="mt-10 border-t border-border pt-6">
          <h2 className="text-2xl font-semibold">Who does what</h2>
          <dl className="mt-4 divide-y divide-border/60 text-sm">
            {roles.map((r) => (
              <div key={r.activity} className="grid gap-1 py-3 sm:grid-cols-[14rem_1fr] sm:gap-4">
                <dt className="font-medium">{r.activity}</dt>
                <dd className="text-muted-foreground">{r.who}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="mt-10 border-t border-border pt-6 flex items-start gap-4">
          <ShieldCheck aria-hidden="true" className="w-6 h-6 text-primary shrink-0 mt-1" />
          <div>
            <h2 className="text-2xl font-semibold">Verification and recipient safeguards</h2>
            <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
              Quotes can be shown before verification. Bank details are checked with Stables,
              and the sender must be verified before a transfer is created. Verification runs
              on Stables' hosted demo page; LamportPay does not build its own document-verification flow.
            </p>
            <dl className="mt-4 space-y-4 text-sm">
              <div>
                <dt className="font-semibold">Own bank account · default</dt>
                <dd className="mt-1 text-muted-foreground leading-relaxed">The account-holder name comes from the verified Stables customer record and is not editable in checkout.</dd>
              </div>
              <div>
                <dt className="font-semibold">Beneficiary bank account</dt>
                <dd className="mt-1 text-muted-foreground leading-relaxed">The verified sender supplies the beneficiary's name, individual or business type, and a payment purpose other than transfer to own account. Provider validation and compliance rules still apply.</dd>
              </div>
            </dl>
            <p className="mt-4 text-sm text-muted-foreground leading-relaxed">Stables may reject or hold a transfer. Connecting a wallet or signing in is not identity verification or payout approval.</p>
          </div>
        </section>

        <section className="mt-10 border-t border-border pt-6">
          <h2 className="text-2xl font-semibold">Costs and payment records</h2>
          <dl className="mt-4 divide-y divide-border text-sm">
            {PAYMENT_COSTS.map((cost) => (
              <div key={cost.title} className="py-3">
                <dt className="font-semibold">{cost.title}</dt>
                <dd className="mt-1 text-muted-foreground leading-relaxed">{cost.detail}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-3 text-sm text-muted-foreground leading-relaxed">Stables is authoritative for transfer status. Signed webhooks, live status reads and reconciliation update the record. Wallet approval alone is not evidence of a completed payout, and a demo receipt is not proof that real money reached a bank.</p>
        </section>

        <section className="mt-10 border-t border-border pt-6">
          <h2 className="text-2xl font-semibold">Security controls and operational review</h2>
          <ul className="mt-4 space-y-3 text-sm text-muted-foreground list-disc pl-5">
            <li>Wallet sign-in checks the message origin, age and signature, with one-time signature use. No seed phrase or private key is requested.</li>
            <li>Provider writes use idempotency keys; webhook signatures are verified and transfer progress is synchronized without moving backwards.</li>
            <li>Admin actions require server-side role checks and are audit logged. The payout queue only refreshes status; it does not create transfers or simulate deposits.</li>
            <li>Rate limits and emergency payment controls restrict payment actions. Refunds, compliance and manual reviews are operations cases, not invented payout statuses.</li>
          </ul>
          <p className="mt-4 text-sm text-muted-foreground leading-relaxed">These safeguards are not a guarantee against loss or a completed security certification. End-to-end demo testing, security review and operational readiness must be validated before production availability.</p>
        </section>

        <section className="mt-10 border-t border-border pt-6">
          <h2 className="text-2xl font-semibold">Infrastructure and regulatory context</h2>
          <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
            LamportPay's payout partner is{" "}
            <a
              href="https://www.stables.money/legal/about-us"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              Stables
            </a>
             , used here in demo mode. Its external listing in the{" "}
            <a
              href="https://partners.circle.com/directory/stables-money"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              official Circle Alliance Directory
            </a>{" "}
             is not a LamportPay partnership, endorsement or production approval.
          </p>
          <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
            Circle's licenses cover Circle's own regulated activities. They do not automatically
            license, authorize, endorse or extend regulatory coverage to Stables, LamportPay or any
            other company that uses Circle's products. LamportPay does not claim to be licensed by
            Circle. Stables' own licensing and regulatory information is published on{" "}
            <a
              href="https://www.stables.money/legal"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              its legal page
            </a>
            .
          </p>
          <p className="mt-3 text-sm text-muted-foreground leading-relaxed">Non-custodial software does not automatically qualify for a regulatory exemption. Real-money availability requires applicable legal review, Stables production onboarding, validated payout coverage and production safeguards. No direct Circle or Tether partnership is confirmed. Production bank payouts and KYC remain DISABLED.</p>
        </section>

        <section className="mt-10 border-t border-border pt-6">
          <h2 className="text-2xl font-semibold">Company information</h2>
          <dl className="mt-4 grid gap-3 sm:grid-cols-2 text-sm">
            <div>
              <dt className="text-xs uppercase tracking-wider text-muted-foreground">
                Legal entity
              </dt>
              <dd className="mt-1 font-medium">Lamport Pay Ltd</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wider text-muted-foreground">
                Product / platform
              </dt>
              <dd className="mt-1 font-medium">LamportPay</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wider text-muted-foreground">
                Business email
              </dt>
              <dd className="mt-1">
                <a href="mailto:hello@lamportpay.com" className="font-medium hover:underline">
                  hello@lamportpay.com
                </a>
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wider text-muted-foreground">
                Registration number
              </dt>
              <dd className="mt-1 text-muted-foreground">To be provided</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wider text-muted-foreground">
                Registered address
              </dt>
              <dd className="mt-1 text-muted-foreground">To be provided</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wider text-muted-foreground">
                Licenses / regulatory approvals
              </dt>
              <dd className="mt-1 text-muted-foreground">
                None claimed by LamportPay. Demo access is not regulatory authorization.
              </dd>
            </div>
          </dl>
        </section>

        <div className="mt-10 text-xs text-muted-foreground">
          LamportPay holds no customer funds or wallet keys. Own-account and beneficiary bank
          payouts are part of the verified-sender design. The current experience is
          DEMO/SIMULATED; real bank payouts and production KYC are DISABLED.
        </div>
      </section>
      <FurtherReading
        slugs={[
          "compliance-roles-in-crypto-payouts",
          "crypto-to-fiat-payments-explained",
          "designing-transparent-payment-quotes",
        ]}
      />
    </SiteLayout>
  );
}
