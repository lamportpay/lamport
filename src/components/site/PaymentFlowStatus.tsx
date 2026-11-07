import { ShieldCheck } from "lucide-react";
import { paymentFlowCopy } from "@/content/payment-flow";
import { useLaunchStage } from "@/lib/launch-stage";

export function PaymentFlowStatus() {
  const stage = useLaunchStage();
  return (
    <div className="mt-8 flex items-start gap-3 border-y border-border bg-secondary/40 px-4 py-5">
      <ShieldCheck aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-primary" />
      <div>
        <p className="text-xs font-semibold">{stage === "live" ? "LIVE" : "SANDBOX · SANDBOX"}</p>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
          {paymentFlowCopy(stage).safety}
        </p>
      </div>
    </div>
  );
}
