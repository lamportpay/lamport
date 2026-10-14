import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/Layout";
import { pageSeo } from "@/lib/seo";
import { FurtherReading } from "@/components/site/blog/FurtherReading";
import { FUTURE_EXPLORATION, ROADMAP_NOTE, ROADMAP_PHASES } from "@/content/roadmap";
import { PAYMENT_COSTS, PAYMENT_JOURNEY } from "@/content/payment-flow";
import { PaymentFlowStatus } from "@/components/site/PaymentFlowStatus";

export const Route = createFileRoute("/whitepaper")({
  head: () =>
    pageSeo({
      path: "/whitepaper",
      title: "LamportPay Whitepaper — Payment Architecture, Fees and Roadmap",
      description:
        "LamportPay's non-custodial Solana payment design, quote-first journey, transparent fees, Stables demo integration, security controls and public roadmap.",
      type: "article",
    }),
  component: Whitepaper,
});

const sections: { title: string; body: React.ReactNode }[] = [
  {
    title: "1. Executive summary",
    body: (
      <p>
        LamportPay is a non-custodial crypto-to-bank payment interface built around Solana and
        USDC settlement. Users keep control of their wallet; LamportPay records payment activity
        without holding funds, private keys or customer balances. Stables is the payout infrastructure
        provider, and Jupiter supplies the Solana conversion route when needed. The current experience
        is a demo demonstration, not a live bank-payout service.
      </p>
    ),
  },
  {
    title: "2. Problem",
    body: (
      <p>
        Crypto wallets and local banking systems use different payment rails. A sender needs to
        understand the conversion, recipient details, verification requirements and total costs
        before authorizing a payment. Unclear fees and disconnected status updates make that journey
        difficult to assess.
      </p>
    ),
  },
  {
    title: "3. Solution",
    body: (
      <p>
        LamportPay brings the quote, checked bank details, hosted verification, wallet approval
        and payment tracking into one journey. Payouts are designed for the sender's own bank account
        or a beneficiary's bank account, with a verified sender required in either case.
        Mobile-wallet, card and cash payouts are not offered.
      </p>
    ),
  },
  {
    title: "4. Product positioning",
    body: (
      <p>
        LamportPay provides the payment interface and orchestration layer. It is not a bank and
        does not maintain customer balances or control wallet keys. This technical model does not
        establish a regulatory exemption: production availability depends on applicable legal
        requirements, payout coverage and provider approval.
      </p>
    ),
  },
  {
    title: "5. Core flow",
    body: (
      <ol className="space-y-4 list-decimal pl-5">
        {PAYMENT_JOURNEY.map((step) => (
          <li key={step.title}>
            <strong className="text-foreground">{step.title}. </strong>{step.detail}
          </li>
        ))}
      </ol>
    ),
  },
  {
    title: "6. Technology architecture",
    body: (
      <div className="space-y-3">
        <ArchRow
          k="Frontend"
           v="TanStack Start, React and Tailwind CSS. Separate marketing, wallet-connected payment app and protected admin experiences."
        />
        <ArchRow
          k="Backend"
           v="Server functions and API routes orchestrate quotes, checked bank details, hosted verification, transfers, wallet-signature checks and status synchronization."
        />
        <ArchRow
          k="Blockchain"
           v="Solana wallet connection and transaction verification. The demo build signs a real test network memo that moves no funds; Jupiter mainnet execution is disabled."
        />
        <ArchRow
          k="Partner"
           v="Stables demo customer records, hosted verification links, quote and bank-field validation, transfer references and signed status events."
        />
        <ArchRow
          k="Database"
           v="Identity links, payments, quotes, verification status, provider references, transaction signatures, timeline events and audit records. The ledger is a record, not a stored-value balance."
        />
      </div>
    ),
  },
  {
    title: "7. AI layer",
    body: (
      <p>
        The assistant can explain the payment journey and costs. It is an informational layer,
        not a payment authority: it cannot sign transactions, approve verification, perform
        compliance checks or override provider decisions. Users authorize payments in their wallet.
      </p>
    ),
  },
  {
    title: "8. Liquidity layer",
    body: (
      <p>
        USDC payments do not require a swap. For an eligible SOL route, Jupiter supplies the
        conversion quote into USDC, including route costs and price impact. LIVE · read-only market
        quotes are available in the demo build; mainnet swap execution is DISABLED. Additional asset
        intake requires an explicit allowlist and a validated conversion route, not just a wallet balance.
      </p>
    ),
  },
  {
    title: "9. Settlement partner layer",
    body: (
      <p>
        Stables is the sole payout infrastructure provider shown for the current flow
        (DEMO/SIMULATED). In the production design, a verified sender authorizes a transfer to
        the single-use deposit address returned by Stables for that payment. LamportPay never
        holds those funds. Stables reports the bank-payout outcome; the demo build instead simulates
        the deposit and follows demo status updates. Real bank payouts remain DISABLED.
      </p>
    ),
  },
  {
    title: "10. Supported assets",
    body: (
      <p>
        USDC on Solana is the enabled settlement currency. The model includes USDT on Solana,
        but USDT payments are currently DISABLED. SOL routing is available where supported by
        the wallet; the demo build does not execute the conversion or move payment funds.
        Bitcoin, Ethereum and other networks are PLANNED exploration, not accepted deposits.
        Hyperliquid is PLANNED / integration in progress; trading, deposits and withdrawals remain DISABLED.
      </p>
    ),
  },
  {
    title: "11. Supported countries and currencies",
    body: (
      <p>
        The app offers configured destination countries and fills the payout currency from a
        country reference table. That reference is not a promise of coverage: Stables quotes
        determine whether a country/currency pair is available, and Stables validates the required
        bank fields. The demo build restricts the country picker to demo destinations; production
        coverage is not confirmed. Limits are shown in the payment app and checked before approval.
      </p>
    ),
  },
  {
    title: "12. Payment status lifecycle",
    body: (
      <div className="space-y-3">
        <p>
          The seven-step journey is a user-facing progress indicator, not a separate settlement
          ledger. Before transfer creation, LamportPay records payment setup, verification and
          quote stages. Once a Stables transfer exists, its status is authoritative and the app
          follows it without moving a payment backwards.
        </p>
        <p>
          Signed webhooks are the primary update path. Live status reads and background
          reconciliation recover missed updates; a temporary provider error preserves the last
          stored status. Completion requires Stables to report completion, not merely a wallet signature.
          Some demo destinations may remain processing.
        </p>
        <p>
          Refunds, compliance checks and manual reviews are operations cases, not invented payment
          states. A demo receipt records a demonstration only.
        </p>
      </div>
    ),
  },
  {
    title: "13. Compliance positioning",
    body: (
      <p>
        Verification is performed on Stables' hosted page, not through document collection in
        LamportPay. The app stores a verification link and status, not identity-document uploads.
        A verified sender is required before a transfer is created. For an own-account payout,
        the account-holder name comes from the verified customer record; beneficiary payouts
        require beneficiary details and a suitable payment purpose. Travel Rule requirements
        remain attached to the payment. Production verification is DISABLED; the demo flow
        is not evidence of production compliance approval.
      </p>
    ),
  },
  {
    title: "14. Business model",
    body: (
      <div className="space-y-4">
        <p>
          LamportPay's approved platform fee is 2% of the total the user sends, taken out of that
          total once. For a 150 USDC payment, 3 USDC is the LamportPay fee and 147 USDC is allocated
          to Stables—not 153 USDC leaving the wallet. Partner, swap and network costs remain
          separate and are disclosed before approval. The payment app displays the fee amount.
        </p>
        <dl className="divide-y divide-border">
          {PAYMENT_COSTS.map((cost) => (
            <div key={cost.title} className="py-3">
              <dt className="font-semibold text-foreground">{cost.title}</dt>
              <dd className="mt-1">{cost.detail}</dd>
            </div>
          ))}
        </dl>
        <p>
          Optional minimum and maximum fee bounds are off by default. In production, LamportPay's
          revenue transfer is separate from the Stables deposit within the user-signed transaction;
          no additional LamportPay swap fee is charged. The demo build collects no real revenue.
        </p>
      </div>
    ),
  },
  {
    title: "15. Roadmap",
    body: (
      <div className="space-y-3">
        <List
          items={ROADMAP_PHASES.map(
            (p) =>
              `Phase ${p.phase}: ${p.title} (${p.status === "current" ? "DEMO / DEVNET-SANDBOX" : "PLANNED"}). ${p.summary} Milestone: ${p.dependsOn}`,
          )}
        />
        <p className="text-sm">{ROADMAP_NOTE}</p>
        <h3 className="pt-3 font-semibold text-foreground">PLANNED · Future exploration</h3>
        <ul className="space-y-4">
          {FUTURE_EXPLORATION.map((item) => (
            <li key={item.title}>
              <span className="font-semibold text-foreground">{item.title}. </span>
              {item.detail}
            </li>
          ))}
        </ul>
      </div>
    ),
  },
  {
    title: "16. Risk management",
    body: (
      <div className="space-y-3">
        <div>
           <span className="font-semibold text-foreground">Risks: </span>expired quotes, conversion
           price impact, incorrect recipient details, wallet compromise, verification rejection,
           provider outages, payout delays and regulatory or coverage changes.
        </div>
        <div>
           <span className="font-semibold text-foreground">Controls: </span>checked bank details,
           verification before transfer creation, explicit wallet approval, one-time sign-in
           signatures, idempotent provider writes, signed webhooks, forward-only status updates,
           rate limits and emergency payment controls. Admin access is checked on the server;
           audit records are append-only. The payout queue refreshes status only—it cannot create
           transfers or simulate deposits.
        </div>
        <p>
          These controls do not guarantee a risk-free service or establish a completed security
          certification. Production remains disabled pending validated end-to-end testing,
          security review and operational readiness.
        </p>
      </div>
    ),
  },
  {
    title: "17. Conclusion",
    body: (
      <p>
        LamportPay aims to make wallet-to-bank payments understandable: quote first, disclose
        costs, verify the sender, authorize in the wallet and track the provider's outcome.
        The current demo demonstrates that design; broader assets, payout coverage and
        production availability remain subject to validation rather than promises of live service.
      </p>
    ),
  },
];

function Whitepaper() {
  return (
    <SiteLayout>
      <section className="max-w-6xl mx-auto px-5 py-12 md:py-16">
        <div className="text-xs font-semibold uppercase tracking-wider text-primary">
          White paper
        </div>
        <h1 className="mt-3 text-4xl md:text-5xl font-semibold">
          LamportPay Whitepaper
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Crypto in. Local money out.
        </p>
        <p className="mt-3 max-w-3xl text-muted-foreground leading-relaxed">
          Non-custodial payment architecture, the quote-first journey, transparent costs and
          the path from demo validation to bank payouts.
        </p>
        <PaymentFlowStatus />

        <div className="mt-14 grid md:grid-cols-[220px_1fr] gap-10">
          <aside className="md:sticky md:top-24 self-start">
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
              Contents
            </div>
            <nav aria-label="Whitepaper contents">
            <ul className="grid gap-2 sm:grid-cols-2 md:grid-cols-1 text-sm">
              {sections.map((s) => (
                <li key={s.title}>
                  <a
                    href={`#${slug(s.title)}`}
                    className="text-muted-foreground hover:text-foreground focus-visible:outline-primary"
                  >
                    {s.title}
                  </a>
                </li>
              ))}
            </ul>
            </nav>
          </aside>
          <div className="space-y-12">
            {sections.map((s) => (
              <section key={s.title} id={slug(s.title)} className="scroll-mt-24">
                <h2 className="text-2xl font-semibold">{s.title}</h2>
                <div className="mt-3 text-muted-foreground leading-relaxed">{s.body}</div>
              </section>
            ))}
          </div>
        </div>
      </section>
      <FurtherReading
        slugs={[
          "why-stablecoins-settle-cross-border-payments",
          "web3-payment-rails-architecture",
          "compliance-roles-in-crypto-payouts",
        ]}
      />
    </SiteLayout>
  );
}

function slug(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+$/, "");
}

function List({ items }: { items: string[] }) {
  return (
    <ol className="space-y-2 list-decimal pl-5">
      {items.map((i) => (
        <li key={i}>{i}</li>
      ))}
    </ol>
  );
}

function ArchRow({ k, v }: { k: string; v: string }) {
  return (
    <div className="border-b border-border py-4">
      <div className="font-semibold text-foreground">{k}</div>
      <div className="text-sm mt-1">{v}</div>
    </div>
  );
}
