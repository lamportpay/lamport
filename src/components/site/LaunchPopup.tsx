import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Rocket, ShieldCheck, Sparkles, Gift, ArrowRight } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import markUrl from "@/assets/lamportpay-mark.png";

const KEY = "lp-launch-popup-seen-v1";

export function LaunchPopup() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      if (sessionStorage.getItem(KEY)) return;
    } catch {
      return;
    }
    const t = window.setTimeout(() => setOpen(true), 1800);
    return () => window.clearTimeout(t);
  }, []);

  const close = (v: boolean) => {
    setOpen(v);
    if (!v) {
      try {
        sessionStorage.setItem(KEY, "1");
      } catch {
        /* ignore */
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="launch-popup max-w-[460px] overflow-hidden border-0 p-0">
        <div className="launch-popup-hero">
          <div className="launch-popup-mark">
            <img src={markUrl} alt="" width={44} height={44} />
          </div>
          <span className="launch-popup-pill">
            <Rocket className="h-3.5 w-3.5" aria-hidden /> Launching soon
          </span>
        </div>
        <div className="space-y-4 px-6 pb-6 pt-5">
          <DialogTitle className="text-2xl font-semibold leading-tight">
            LamportPay is going live
          </DialogTitle>
          <DialogDescription className="text-sm leading-relaxed text-muted-foreground">
            The platform is built and security testing is almost complete. We are launching as soon
            as possible — be part of it from day one.
          </DialogDescription>
          <div className="launch-popup-offer">
            <Gift className="h-5 w-5 shrink-0 text-primary" aria-hidden />
            <p className="text-sm">
              <strong>Early access offer:</strong> the first 10 early-access users pay{" "}
              <strong>no LamportPay fee</strong> — our 2% fee is waived for them.
            </p>
          </div>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex gap-2">
              <ShieldCheck className="h-4 w-4 shrink-0 text-primary" aria-hidden /> Non-custodial — funds go from your wallet to your bank.
            </li>
            <li className="flex gap-2">
              <Sparkles className="h-4 w-4 shrink-0 text-primary" aria-hidden /> Crypto in. Local money out.
            </li>
          </ul>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Link
              to="/contact"
              onClick={() => close(false)}
              className="launch-popup-cta inline-flex flex-1 items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold"
            >
              Join early access <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
            <Link
              to="/roadmap"
              onClick={() => close(false)}
              className="inline-flex flex-1 items-center justify-center rounded-full border border-border px-5 py-3 text-sm font-medium hover:bg-muted"
            >
              See our roadmap
            </Link>
          </div>
          <p className="text-center text-[11px] text-muted-foreground">
            Offer covers LamportPay's own fee only; payout partner and network costs still apply.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
