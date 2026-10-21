import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/Layout";
import { pageSeo } from "@/lib/seo";
import { FurtherReading } from "@/components/site/blog/FurtherReading";
import { PaymentFlowStatus } from "@/components/site/PaymentFlowStatus";
import { PAYMENT_COSTS, PAYMENT_JOURNEY } from "@/content/payment-flow";

export const Route = createFileRoute("/docs")({
  head: () => pageSeo({
    path: "/docs",
    title: "LamportPay Docs — Architecture and Payment Flow",
    description: "Current LamportPay architecture, wallet identity, quote-first payment flow, Stables test environment, Jupiter read-only routing, fees and operational safeguards.",
  }),
  component: Docs,
});

const stack = [
  { title: "Application", detail: "TanStack Start, React, Vite and Tailwind CSS. Separate marketing, wallet-connected payment app and protected admin experiences." },
  { title: "Payment orchestration", detail: "Server functions and API routes coordinate quotes, bank-field validation, verification gates, transfer references and payment tracking." },
  { title: "Wallet & settlement asset", detail: "Solana wallet signatures and transaction verification. USDC is enabled; USDT payment support remains DISABLED. This build runs on a Solana test network." },
  { title: "Conversion · LIVE read-only", detail: "Jupiter supplies eligible Solana-to-USDC market quotes. The sandbox build blocks mainnet order and execution; USDC payments skip the swap." },
  { title: "Payout · SANDBOX/SIMULATED", detail: "Stables' test environment provides quotes, hosted verification, checked bank details and transfer status. Production payouts and KYC are DISABLED." },
  { title: "Runtime & hosting", detail: "Node.js and TypeScript on the server. Managed cloud hosting today, with a planned move to AWS as volume grows." },
  { title: "Engineering", detail: "Built from scratch by our in-house team. AI tools (ChatGPT, Claude, Lovable) assist with support, automation, marketing and coding; the team designs, reviews and owns the code." },
  { title: "Security roadmap", detail: "Core controls are in place (access rules, signed webhooks, audit log, rate limits, scans). An independent audit, penetration testing and hardening form the next funded phase before go-live." },
  { title: "Data & operations", detail: "SQL / PostgreSQL stores payment records, identity links, verification status, timeline events and append-only admin audit records—not customer balances." },
];

const contents = [
  { id: "architecture", title: "Architecture" },
  { id: "identity", title: "Identity & access" },
  { id: "journey", title: "Payment sequence" },
  { id: "costs", title: "Amounts & costs" },
  { id: "operations", title: "Status & safeguards" },
  { id: "boundaries", title: "Integration boundaries" },
];

function Docs() {
  return (
    <SiteLayout>
      <section className="max-w-6xl mx-auto px-5 py-12 md:py-16">
        <div className="text-xs font-semibold uppercase tracking-wider text-primary">Documentation</div>
        <h1 className="mt-3 text-4xl md:text-5xl font-semibold">LamportPay Docs</h1>
        <p className="mt-4 max-w-3xl text-lg text-muted-foreground">How LamportPay works under the hood: architecture, wallet identity, the payment sequence and our safeguards. LamportPay does not offer a public API; we build on partner APIs from Stables and Jupiter.</p>
        <p className="mt-3 text-xs text-muted-foreground">Updated 15 October 2026</p>
        <PaymentFlowStatus />

        <div className="mt-12 grid gap-10 md:grid-cols-[200px_minmax(0,1fr)]">
          <nav aria-label="Docs contents" className="self-start md:sticky md:top-24">
            <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Contents</h2>
            <ul className="grid gap-3 sm:grid-cols-2 md:grid-cols-1 text-sm">
              {contents.map((item) => <li key={item.id}><a href={`#${item.id}`} className="text-muted-foreground hover:text-foreground focus-visible:outline-primary">{item.title}</a></li>)}
            </ul>
          </nav>
          <div className="min-w-0 space-y-12">
            <section id="architecture" className="scroll-mt-24">
              <h2 className="text-2xl font-semibold">Architecture</h2>
              <dl className="mt-5 grid gap-x-8 sm:grid-cols-2">
                {stack.map((item) => <div key={item.title} className="border-t border-border py-5"><dt className="font-semibold">{item.title}</dt><dd className="mt-2 text-sm text-muted-foreground leading-relaxed">{item.detail}</dd></div>)}
              </dl>
            </section>

            <section id="identity" className="scroll-mt-24">
              <h2 className="text-2xl font-semibold">Identity & access</h2>
              <div className="mt-4 space-y-3 text-sm text-muted-foreground leading-relaxed">
                <p>Customer sign-in uses a SIWS-style plain-text Solana message. The server checks origin, freshness, Ed25519 signature and one-time use, then records the wallet in server-controlled identity data. This is not a payment transaction and never requests a private key or seed phrase.</p>
                <p>Payment endpoints require a customer session and enforce ownership. Wallet sign-in, wallet holdings and the estimate endpoint serve pre-checkout requests; they do not grant access to private payment records. A wallet connection alone is not a session or KYC approval. Admin functions separately re-check the admin role on the server.</p>
                <p>Wallet-only accounts use a non-deliverable placeholder email internally, not a real contact address. When verification needs an email, the customer provides it for Stables customer setup. Documents are handled on Stables' hosted page; LamportPay keeps the verification link and status.</p>
              </div>
            </section>

            <section id="journey" className="scroll-mt-24">
              <h2 className="text-2xl font-semibold">Quote-first payment sequence</h2>
              <ol className="mt-5 list-decimal pl-5 space-y-4 text-sm text-muted-foreground leading-relaxed">
                {PAYMENT_JOURNEY.map((step) => <li key={step.title}><strong className="text-foreground">{step.title}. </strong>{step.detail}</li>)}
              </ol>
              <p className="mt-5 text-sm text-muted-foreground leading-relaxed">A transfer is created only for a verified sender. Own-account payouts use the verified holder name; beneficiary payouts require the beneficiary's name, type and an appropriate payment purpose. Bank details are validated by Stables in either case.</p>
            </section>

            <section id="costs" className="scroll-mt-24">
              <h2 className="text-2xl font-semibold">Amounts & costs</h2>
              <p className="mt-4 text-sm text-muted-foreground leading-relaxed">Payment arithmetic uses integer minor units rather than floating-point amounts. LamportPay's fee is taken from the user's sent total once; optional minimum and maximum fee bounds are off by default. The payment record keeps the applicable fee rule. The sandbox build collects no real revenue.</p>
              <dl className="mt-4 divide-y divide-border text-sm">
                {PAYMENT_COSTS.map((cost) => <div key={cost.title} className="py-4"><dt className="font-semibold">{cost.title}</dt><dd className="mt-1 leading-relaxed text-muted-foreground">{cost.detail}</dd></div>)}
              </dl>
              <p className="mt-3 text-sm text-muted-foreground leading-relaxed">Country-to-currency defaults are reference data, not supported-corridor guarantees. Stables quotes establish country/currency availability, bank-field validation checks recipient details, and configured limits are enforced by the payment app.</p>
            </section>

            <section id="operations" className="scroll-mt-24">
              <h2 className="text-2xl font-semibold">Status synchronization & safeguards</h2>
              <ul className="mt-4 list-disc pl-5 space-y-3 text-sm text-muted-foreground leading-relaxed">
                <li>Stables transfer status is authoritative. Signed webhooks are the primary update path; live status reads and background reconciliation recover missed events without moving progress backwards.</li>
                <li>Provider writes carry idempotency keys. Webhooks are stored before processing; invalid signatures are refused. A temporary provider error preserves the stored payment status.</li>
                <li>The sandbox build verifies memo signer, payment reference, transaction success, freshness and non-reuse before simulating a deposit. A wallet signature alone does not mark a payout complete.</li>
                <li>Rate limits and emergency payment controls restrict payment actions. Admin audit records are append-only; the admin payout queue refreshes status only, never creates a transfer or simulates a deposit.</li>
                <li>Travel Rule requirements are payment requirements. Refunds, compliance holds needing operational follow-up and manual review are handled through operations cases, not invented settlement outcomes.</li>
              </ul>
              <p className="mt-4 text-sm text-muted-foreground leading-relaxed">Some sandbox destinations can remain processing. Receipts update when Stables reports completion; a sandbox receipt does not prove a real bank payout. These controls do not constitute a completed security certification.</p>
            </section>

            <section id="boundaries" className="scroll-mt-24">
              <h2 className="text-2xl font-semibold">Integration boundaries</h2>
              <div className="mt-4 space-y-3 text-sm text-muted-foreground leading-relaxed">
                <p>In the production design, the user's wallet sends USDC directly to Stables' single-use deposit address. LamportPay never holds funds, keys or customer balances; its ledger records activity only. The sandbox build moves no payment funds and executes no mainnet swaps.</p>
                <p>Asset and network models are separate. New intake requires an explicit allowlist, provider selection and a validated conversion route without changing the existing Jupiter endpoints. A Hyperliquid route for major digital assets such as Bitcoin and Ethereum is IN PROGRESS and additional networks are PLANNED; none of them are accepted deposits, and Hyperliquid trading, deposits and withdrawals remain DISABLED.</p>
                <p>Keep private provider credentials server-side and out of source control and browser configuration. Production availability requires security review, end-to-end validation, provider onboarding and applicable legal readiness. The current documentation does not announce a production launch.</p>
              </div>
              <div className="mt-6 flex flex-wrap gap-x-6 gap-y-3 text-sm">
                <Link to="/workflow" className="text-primary hover:underline">Workflow</Link>
                <Link to="/whitepaper" className="text-primary hover:underline">Whitepaper</Link>
                <Link to="/compliance" className="text-primary hover:underline">Compliance</Link>
              </div>
            </section>
          </div>
        </div>
      </section>
      <FurtherReading slugs={["solana-payments-for-developers", "web3-payment-rails-architecture", "why-stablecoins-settle-cross-border-payments"]} />
    </SiteLayout>
  );
}