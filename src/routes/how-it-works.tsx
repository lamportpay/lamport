import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/Layout";
import { ArrowRight } from "lucide-react";

export const Route = createFileRoute("/how-it-works")({
  head: () => ({
    meta: [
      { title: "How it works — LamportPay" },
      {
        name: "description",
        content:
          "The full crypto-to-local-currency flow, from user input to receipt, plus the developer API sequence.",
      },
      { property: "og:title", content: "How it works — LamportPay" },
      {
        property: "og:description",
        content: "User flow and API sequence for LamportPay demo transfers.",
      },
    ],
  }),
  component: HowItWorks,
});

const userFlow = [
  "User enters transfer details",
  "LamportPay creates payment record",
  "Bridge quote generated",
  "Partner KYC",
  "Jupiter swap to USDC planned",
  "USDC settlement verified",
  "Bridge payout processing",
  "Receipt shown",
];

const apiFlow = [
  "Frontend form",
  "POST /api/payments",
  "POST /api/bridge-quote",
  "POST /api/bridge-kyc/start",
  "POST /api/bridge-kyc/complete",
  "POST /api/payments/confirm",
  "POST /api/jupiter/quote",
  "POST /api/solana/verify-transaction",
  "POST /api/bridge-transfer",
  "GET /api/payments/[paymentId]",
  "GET /api/receipt/[paymentId]",
];

function HowItWorks() {
  return (
    <SiteLayout>
      <section className="max-w-5xl mx-auto px-5 py-16 md:py-24">
        <div className="text-xs font-semibold uppercase tracking-wider text-primary">
          How it works
        </div>
        <h1 className="mt-2 text-4xl md:text-5xl font-semibold tracking-tight">
          From crypto tap to local payout.
        </h1>
        <p className="mt-4 text-lg text-muted-foreground max-w-2xl">
          Every LamportPay transfer follows a predictable, partner-led flow — from the moment a user
          enters details to when the recipient sees local currency.
        </p>

        <div className="mt-14">
          <h2 className="text-2xl font-semibold tracking-tight">The user flow</h2>
          <div className="mt-8 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            {userFlow.map((s, i) => (
              <div key={s} className="rounded-2xl bg-card border border-border/60 p-5 relative">
                <div className="text-xs font-semibold mb-2 text-primary">Step {i + 1}</div>
                <div className="font-medium leading-snug">{s}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-20">
          <h2 className="text-2xl font-semibold tracking-tight">Developer sequence</h2>
          <p className="text-muted-foreground mt-2">
            The endpoints are conceptual for now — implementations will land in the backend MVP
            phase.
          </p>
          <div className="mt-8 rounded-3xl border border-border/60 bg-card p-6 md:p-8">
            <ol className="space-y-1 font-mono text-sm">
              {apiFlow.map((line, i) => (
                <li
                  key={line}
                  className="flex items-center gap-3 py-1.5 border-b last:border-b-0 border-border/50"
                >
                  <span className="text-muted-foreground w-6 shrink-0">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-primary shrink-0" />
                  <span>{line}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}
