import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/Layout";
import { ShieldCheck, XCircle, CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/compliance")({
  head: () => ({
    meta: [
      { title: "Compliance — LamportPay" },
      { name: "description", content: "LamportPay is a technology platform. Licensed partners handle regulated payout activity." },
      { property: "og:title", content: "Compliance — LamportPay" },
      { property: "og:description", content: "Partner-led KYC, no custody, no direct money transmission." },
    ],
  }),
  component: Compliance,
});

function Compliance() {
  const negatives = [
    "LamportPay does not custody funds.",
    "LamportPay does not perform real KYC.",
    "LamportPay does not independently transmit money.",
  ];
  const positives = [
    "LamportPay is a technology platform.",
    "Licensed partners handle regulated payout activity.",
    "Bridge is the first planned/demo settlement partner.",
    "Real launch requires partner approval, KYB, legal review, and corridor approval.",
  ];
  return (
    <SiteLayout>
      <section className="max-w-4xl mx-auto px-5 py-16 md:py-24">
        <div className="text-xs font-semibold uppercase tracking-wider text-primary">Compliance</div>
        <h1 className="mt-2 text-4xl md:text-5xl font-semibold tracking-tight">A technology platform. Not a money transmitter.</h1>
        <p className="mt-4 text-lg text-muted-foreground">
          This page is maintained by the LamportPay team to answer common security and compliance questions about the demo. It is not a certification.
        </p>

        <div className="mt-12 grid md:grid-cols-2 gap-4">
          <div className="rounded-2xl border border-border/60 bg-card p-6">
            <div className="flex items-center gap-2 font-semibold mb-4"><XCircle className="w-5 h-5 text-destructive" /> What LamportPay does not do</div>
            <ul className="space-y-3 text-sm">
              {negatives.map((n) => <li key={n} className="text-muted-foreground">{n}</li>)}
            </ul>
          </div>
          <div className="rounded-2xl border border-border/60 bg-card p-6">
            <div className="flex items-center gap-2 font-semibold mb-4"><CheckCircle2 className="w-5 h-5 text-[color:var(--success)]" /> What LamportPay does</div>
            <ul className="space-y-3 text-sm">
              {positives.map((n) => <li key={n} className="text-muted-foreground">{n}</li>)}
            </ul>
          </div>
        </div>

        <div className="mt-10 rounded-2xl bg-[image:var(--gradient-card)] border border-border/60 p-6 flex items-start gap-4">
          <ShieldCheck className="w-6 h-6 text-primary shrink-0 mt-1" />
          <div>
            <div className="font-semibold">Partner-led compliance</div>
            <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
              KYC, KYB, AML, sanctions screening, Travel Rule, FX/off-ramp, payout processing, and settlement are performed by licensed partners such as Bridge — not by LamportPay. This posture is intentional: it keeps the surface area of the platform narrow and defensible.
            </p>
          </div>
        </div>

        <div className="mt-10 text-xs text-muted-foreground">
          Demo only. LamportPay does not currently process real crypto, fiat, KYC, FX conversion, or bank payouts.
        </div>
      </section>
    </SiteLayout>
  );
}