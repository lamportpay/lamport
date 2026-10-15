import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Wallet,
  SlidersHorizontal,
  FileText,
  ClipboardCheck,
  PenLine,
  Activity,
  CheckCircle2,
  LockKeyhole,
  Landmark,
  ShieldCheck,
} from "lucide-react";
import { SiteLayout } from "@/components/site/Layout";
import { Button } from "@/components/ui/button";
import { PAYMENT_JOURNEY, PAYMENT_COSTS } from "@/content/payment-flow";
import { pageSeo } from "@/lib/seo";
import { ScrollJourney } from "@/components/site/ScrollJourney";

export const Route = createFileRoute("/how-it-works")({
  head: () =>
    pageSeo({
      path: "/how-it-works",
      title: "How LamportPay Works — Wallet to Bank, Step by Step",
      description:
        "Follow LamportPay’s quote-first payment journey: wallet sign-in, bank details, Stables hosted verification, wallet approval and a simulated payout receipt.",
    }),
  component: HowItWorks,
});

const stepIcons = [
  Wallet,
  SlidersHorizontal,
  FileText,
  ClipboardCheck,
  PenLine,
  Activity,
  CheckCircle2,
];
const protections = [
  {
    icon: LockKeyhole,
    title: "Your wallet stays yours",
    detail:
      "LamportPay never holds your funds, private keys or seed phrase. Wallet sign-in asks for a message signature only.",
  },
  {
    icon: ShieldCheck,
    title: "Verification stays with Stables",
    detail:
      "Identity documents belong on Stables’ hosted page, not in LamportPay. We keep a verification link and status.",
  },
  {
    icon: Landmark,
    title: "Bank accounts only",
    detail:
      "The payout flow supports your own account or a beneficiary’s, subject to Stables checks. No card, cash or mobile-wallet payouts.",
  },
];

function HowItWorks() {
  return (
    <SiteLayout>
      <main className="mx-auto max-w-6xl px-5 pb-16 pt-12 md:pb-24 md:pt-20">
        <header>
          <p className="text-xs font-semibold uppercase text-primary">How it works</p>
          <h1 className="mt-3 max-w-3xl text-4xl font-semibold leading-tight md:text-5xl">
            LamportPay, step by step.
          </h1>
          <p className="mt-4 text-xl font-medium">Crypto in. Local money out.</p>
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-muted-foreground">
            A wallet-first payment journey: get a quote, check the destination, review the costs and
            approve in your wallet. Explore the full experience today in demo mode.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link to="/pay">
                Open demo <ArrowRight aria-hidden="true" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link to="/workflow" hash="verification">
                Explore wallet verification
              </Link>
            </Button>
          </div>
        </header>

        <section className="mt-14" aria-labelledby="journey-heading">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <h2 id="journey-heading" className="text-2xl font-semibold">
              The payment journey
            </h2>
            <span className="text-xs font-medium text-muted-foreground">
              Quote first. Verify before approval.
            </span>
          </div>
          <ScrollJourney steps={PAYMENT_JOURNEY} icons={stepIcons} />
        </section>

        <section className="mt-14 border-t border-border pt-10" aria-labelledby="costs-heading">
          <h2 id="costs-heading" className="text-2xl font-semibold">
            Know the costs before you approve
          </h2>
          <div className="mt-6 grid gap-6 md:grid-cols-3">
            {PAYMENT_COSTS.map((cost) => (
              <div key={cost.title}>
                <h3 className="font-semibold">{cost.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{cost.detail}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-14 border-t border-border pt-10" aria-labelledby="safety-heading">
          <h2 id="safety-heading" className="text-2xl font-semibold">
            Clear boundaries. No custody.
          </h2>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {protections.map(({ icon: Icon, title, detail }) => (
              <article key={title} className="rounded-lg border border-border bg-card p-5">
                <Icon aria-hidden="true" className="size-5 text-primary" />
                <h3 className="mt-4 font-semibold">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{detail}</p>
              </article>
            ))}
          </div>
          <p className="mt-6 text-sm leading-relaxed text-muted-foreground">
            In an approved production flow, your wallet would send supported stablecoins directly to
            a single-use deposit address supplied by Stables. That real-funds path is currently
            DISABLED.
          </p>
        </section>
      </main>
    </SiteLayout>
  );
}
