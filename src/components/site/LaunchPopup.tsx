import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Rocket, ShieldCheck, Sparkles, Gift, ArrowRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import markUrl from "@/assets/lamportpay-mark.png";

const KEY = "lp-launch-popup-seen-v1";

export function LaunchPopup() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"intro" | "form" | "done">("intro");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [form, setForm] = useState({ name: "", email: "", mobile: "" });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");
    if (!form.name.trim() || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email.trim()) || !/^\+?[0-9 ()-]{6,25}$/.test(form.mobile.trim())) {
      setErr("Please enter your name, a valid email and mobile number.");
      return;
    }
    setBusy(true);
    try {
      const r = await fetch("/api/early-access", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) setErr(j.error || "Could not save. Please try again.");
      else setStep("done");
    } catch {
      setErr("Network error. Please try again.");
    } finally {
      setBusy(false);
    }
  };

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
          {step === "intro" && (
          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={() => setStep("form")}
              className="launch-popup-cta inline-flex flex-1 items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold"
            >
              Join early access <ArrowRight className="h-4 w-4" aria-hidden />
            </button>
            <Link
              to="/roadmap"
              onClick={() => close(false)}
              className="inline-flex flex-1 items-center justify-center rounded-full border border-border px-5 py-3 text-sm font-medium hover:bg-muted"
            >
              See our roadmap
            </Link>
          </div>
          )}
          {step === "form" && (
            <form onSubmit={submit} className="space-y-2.5" noValidate>
              <Input aria-label="Full name" placeholder="Full name" maxLength={100} autoComplete="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              <Input aria-label="Email" type="email" placeholder="Email address" maxLength={255} autoComplete="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              <Input aria-label="Mobile number" type="tel" placeholder="Mobile number (e.g. +92 300 1234567)" maxLength={25} autoComplete="tel" value={form.mobile} onChange={(e) => setForm({ ...form, mobile: e.target.value })} />
              {err && <p className="text-xs text-destructive" role="alert">{err}</p>}
              <button type="submit" disabled={busy} className="launch-popup-cta inline-flex w-full items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold disabled:opacity-60">
                {busy ? "Saving…" : "Reserve my spot"} <ArrowRight className="h-4 w-4" aria-hidden />
              </button>
            </form>
          )}
          {step === "done" && (
            <div className="launch-popup-offer" role="status">
              <ShieldCheck className="h-5 w-5 shrink-0 text-primary" aria-hidden />
              <p className="text-sm"><strong>You're on the list!</strong> We'll contact you before launch.</p>
            </div>
          )}
          <p className="text-center text-[11px] text-muted-foreground">
            Offer covers LamportPay's own fee only; payout partner and network costs still apply.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
