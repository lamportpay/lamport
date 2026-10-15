import { ShieldCheck } from "lucide-react";
import { PAYMENT_SAFETY } from "@/content/payment-flow";

export function PaymentFlowStatus() {
  return (
    <div className="mt-8 flex items-start gap-3 border-y border-border bg-secondary/40 px-4 py-5">
      <ShieldCheck aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-primary" />
      <div>
        <p className="text-xs font-semibold">SANDBOX · SANDBOX</p>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{PAYMENT_SAFETY}</p>
      </div>
    </div>
  );
}