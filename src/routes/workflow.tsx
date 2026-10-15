import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Wallet,
  Route as RouteIcon,
  Landmark,
  ShieldCheck,
  Radio,
  Code2,
} from "lucide-react";
import { SiteLayout } from "@/components/site/Layout";
import { PaymentFlowStatus } from "@/components/site/PaymentFlowStatus";
import { SwapRoutePreviewCard } from "@/components/site/SwapRoutePreview";
import { Button } from "@/components/ui/button";
import { PAYMENT_JOURNEY } from "@/content/payment-flow";
import { pageSeo } from "@/lib/seo";
import { FurtherReading } from "@/components/site/blog/FurtherReading";
import { VerificationJourney } from "@/components/site/VerificationJourney";

export const Route = createFileRoute("/workflow")({
  head: () =>
    pageSeo({
      path: "/workflow",
      title: "LamportPay Workflow — Web3 Identity and Payment Architecture",
      description:
        "Understand LamportPay’s wallet-signature verification, hosted Stables identity check, payment eligibility and non-custodial Solana payment architecture.",
    }),
  component: WorkflowPage,
});

const layers = [
  {
    icon: Wallet,
    title: "Wallet & identity",
    status: "LIVE · message sign-in",
    detail:
      "The server verifies a one-time Solana message signature. Wallet approval remains separate from sign-in.",
  },
  {
    icon: RouteIcon,
    title: "Jupiter routing",
    status: "LIVE · read-only quotes",
    detail:
      "SOL → USDC route discovery uses mainnet market data. Mainnet swap execution is DISABLED in the sandbox build.",
  },
  {
    icon: Landmark,
    title: "Stables payout",
    status: "SANDBOX/SIMULATED",
    detail:
      "Sandbox quotes, hosted verification and transfer status. Production KYC and real bank payouts are DISABLED.",
  },
];

const stages = [
  {
    title: "Wallet sign-in",
    provider: "LamportPay + Solana wallet",
    status: "LIVE",
    today:
      "Verify the signed message, its origin and freshness before linking the wallet to the customer account.",
    production: "The same wallet-first identity model; no private key or seed phrase is accepted.",
  },
  {
    title: "Amount & quote",
    provider: "Stables · Jupiter when needed",
    status: "SANDBOX/SIMULATED · payout quote",
    today:
      "Get a Stables sandbox quote before verification. SOL estimates use a read-only Jupiter route. Show the LamportPay fee and separate provider costs.",
    production:
      "An approved Stables production quote determines corridor support, pricing and customer limits.",
  },
  {
    title: "Payout details",
    provider: "Stables",
    status: "SANDBOX/SIMULATED",
    today:
      "Validate the bank fields Stables requires. Own-account holder names come from the verified record; beneficiaries require their details and a payment purpose.",
    production:
      "The verified sender can request an own-account or beneficiary bank payout, subject to partner checks.",
  },
  {
    title: "Verification & review",
    provider: "Stables hosted page",
    status: "SANDBOX/SIMULATED · KYC",
    today:
      "Complete any required sandbox verification with Stables, then review the recipient, quote and costs. LamportPay does not collect identity documents.",
    production:
      "Production KYC is DISABLED until approval. Transfers require a verified Stables customer.",
  },
  {
    title: "Wallet approval",
    provider: "Solana test network",
    status: "SANDBOX/SIMULATED",
    today:
      "Sign a real test-network memo transaction that moves no funds. The server checks the signer, memo, freshness and success before simulating the sandbox deposit.",
    production:
      "DISABLED: user-signed funding to Stables’ single-use deposit address, with any applicable fee transfer and settlement checks.",
  },
  {
    title: "Status & receipt",
    provider: "Stables · signed webhooks",
    status: "SANDBOX/SIMULATED",
    today:
      "Signed webhooks and reconciliation follow Stables’ sandbox transfer status. Processing is not completion; a receipt updates only when the reported status changes.",
    production:
      "The same provider-authoritative status model, with live bank settlement only after production approval.",
  },
];

const endpoints = [
  { step: "Sign in", method: "POST", path: "/api/wallet/sign-in" },
  { step: "Estimate", method: "POST", path: "/api/quote/estimate" },
  { step: "Create payment", method: "POST", path: "/api/payments" },
  { step: "Get quote", method: "POST", path: "/api/payments/:id/quote" },
  { step: "Check bank details", method: "POST", path: "/api/payments/:id/payout-details" },
  { step: "Verification status / link", method: "GET / POST", path: "/api/kyc" },
  { step: "Prepare transfer", method: "POST", path: "/api/payments/:id/transfer" },
  { step: "Verify test approval", method: "POST", path: "/api/payments/:id/test-payment" },
  { step: "Read status & receipt", method: "GET", path: "/api/payments/:id" },
];

function WorkflowPage() {
  return (
    <SiteLayout>
      <main className="mx-auto max-w-6xl px-5 pb-16 pt-12 md:pb-24 md:pt-20">
        <header>
          <p className="text-xs font-semibold uppercase text-primary">Integration workflow</p>
          <h1 className="mt-3 max-w-3xl text-4xl font-semibold leading-tight md:text-5xl">
            Inside a LamportPay payment.
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground">
            One journey, distinct responsibilities. LamportPay coordinates the payment, Jupiter
            discovers swap routes, and Stables handles verification and the bank payout path.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link to="/pay">
                Open sandbox <ArrowRight aria-hidden="true" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link to="/how-it-works">See the customer journey</Link>
            </Button>
          </div>
          <PaymentFlowStatus />
        </header>

        <section className="mt-12" aria-label="Integration layers">
          <div className="grid gap-4 md:grid-cols-3">
            {layers.map(({ icon: Icon, title, status, detail }) => (
              <article
                key={title}
                className="overflow-hidden rounded-xl border border-border bg-card"
              >
                <div
                  aria-hidden="true"
                  className="flex h-28 items-center justify-center border-b border-border bg-gradient-to-br from-primary/10 via-transparent to-violet-500/10"
                >
                  <Icon className="size-12 text-primary" strokeWidth={1.4} />
                </div>
                <div className="p-5">
                  <h2 className="text-lg font-semibold">{title}</h2>
                  <p className="mt-2 text-xs font-semibold text-primary">{status}</p>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{detail}</p>
                </div>
              </article>
            ))}
          </div>
          <ol
            aria-label="Payment journey"
            className="mt-8 flex flex-wrap items-center gap-x-3 gap-y-3 border-y border-border py-5"
          >
            {PAYMENT_JOURNEY.map((step, index) => (
              <li key={step.title} className="flex items-center gap-3 text-xs font-medium">
                <span className="text-muted-foreground">{String(index + 1).padStart(2, "0")}</span>
                {step.title}
                {index < PAYMENT_JOURNEY.length - 1 && (
                  <ArrowRight aria-hidden="true" className="size-3 text-muted-foreground" />
                )}
              </li>
            ))}
          </ol>
        </section>

        <VerificationJourney />

        <section className="mt-12" aria-labelledby="mapping-heading">
          <h2 id="mapping-heading" className="text-2xl font-semibold">
            From request to receipt
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Current sandbox behavior, alongside the production path that remains disabled.
          </p>
          <div className="mt-6">
            {stages.map((stage, index) => (
              <article
                key={stage.title}
                className="border-b border-border py-7 first:pt-0 last:border-0"
              >
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-sm font-mono text-muted-foreground">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <h3 className="text-lg font-semibold">{stage.title}</h3>
                  <span className="text-xs font-medium text-primary">{stage.status}</span>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">{stage.provider}</p>
                <div className="mt-4 grid gap-5 md:grid-cols-2 md:gap-8">
                  <div>
                    <h4 className="text-xs font-semibold uppercase">Today · sandbox</h4>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      {stage.today}
                    </p>
                  </div>
                  <div className="md:border-l md:border-border md:pl-8">
                    <h4 className="text-xs font-semibold uppercase">Production · disabled</h4>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      {stage.production}
                    </p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-12 border-t border-border pt-10" aria-labelledby="api-heading">
          <div className="flex items-center gap-3">
            <Code2 aria-hidden="true" className="size-5 text-primary" />
            <h2 id="api-heading" className="text-2xl font-semibold">
              Implemented request sequence
            </h2>
          </div>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted-foreground">
            These are existing app endpoints, not a public third-party API contract. Payment actions
            require a signed-in customer and server-side checks; an endpoint’s existence does not
            enable production payouts.
          </p>
          <div className="mt-6 overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-left text-sm">
              <caption className="sr-only">Sandbox payment API sequence</caption>
              <thead className="bg-secondary">
                <tr>
                  <th scope="col" className="px-4 py-3 font-semibold">
                    Step
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold">
                    Method
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold">
                    Endpoint
                  </th>
                </tr>
              </thead>
              <tbody>
                {endpoints.map((endpoint) => (
                  <tr key={endpoint.path} className="border-t border-border">
                    <th scope="row" className="px-4 py-3 font-medium whitespace-nowrap">
                      {endpoint.step}
                    </th>
                    <td className="px-4 py-3 text-xs font-mono whitespace-nowrap text-primary">
                      {endpoint.method}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs whitespace-nowrap text-muted-foreground">
                      {endpoint.path}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-5 grid gap-5 md:grid-cols-2">
            <div className="flex gap-3">
              <Radio aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-primary" />
              <p className="text-sm leading-relaxed text-muted-foreground">
                Stables events arrive at{" "}
                <code className="break-all text-xs">/api/public/stables-webhook</code>. Signed
                events and periodic reconciliation keep the stored status aligned with Stables.
              </p>
            </div>
            <div className="flex gap-3">
              <ShieldCheck aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-primary" />
              <p className="text-sm leading-relaxed text-muted-foreground">
                Admin refresh checks an existing transfer’s status. It does not send funds, create a
                transfer or simulate a deposit.
              </p>
            </div>
          </div>
        </section>

        <section className="mt-12 border-t border-border pt-10" aria-labelledby="preview-heading">
          <div className="flex flex-wrap items-center gap-3">
            <h2 id="preview-heading" className="text-2xl font-semibold">
              Jupiter route preview
            </h2>
            <span className="text-xs font-semibold text-primary">LIVE · READ-ONLY</span>
          </div>
          <p className="mb-6 mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            A signed-in preview of SOL → USDC market routing. Nothing is signed or sent here. Its
            preview range is not a bank-payment limit, and the sandbox build cannot execute a mainnet swap.
          </p>
          <SwapRoutePreviewCard />
        </section>
      </main>
      <FurtherReading
        slugs={[
          "web3-payment-rails-architecture",
          "solana-payments-for-developers",
          "crypto-to-fiat-payments-explained",
        ]}
      />
    </SiteLayout>
  );
}
