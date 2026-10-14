import { Link } from "@tanstack/react-router";
import { ArrowRight, Fingerprint, KeyRound, ShieldCheck, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { VERIFICATION_JOURNEY } from "@/content/payment-flow";

const icons = [KeyRound, Fingerprint, UserCheck, ShieldCheck];

export function VerificationJourney({ compact = false }: { compact?: boolean }) {
  return (
    <section
      id="verification"
      aria-labelledby="verification-heading"
      className="mt-10 border-t border-border pt-8"
    >
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase text-primary">
            Wallet identity & payment eligibility
          </p>
          <h2 id="verification-heading" className="mt-3 text-2xl font-semibold">
            Your wallet proves ownership. Verification opens the next step.
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            Two distinct checks: LamportPay verifies wallet control; Stables handles hosted identity
            verification.
          </p>
        </div>
        {compact && (
          <Button asChild variant="link" className="px-0">
            <Link to="/workflow" hash="verification">
              Explore verification <ArrowRight />
            </Link>
          </Button>
        )}
      </div>
      <ol
        aria-label="Customer verification journey"
        className="mt-7 grid gap-6 md:grid-cols-2 lg:grid-cols-4"
      >
        {VERIFICATION_JOURNEY.map((step, index) => {
          const Icon = icons[index] ?? ShieldCheck;
          return (
            <li key={step.title} className="relative border-t-2 border-primary/30 pt-5">
              <div className="flex items-center justify-between">
                <Icon className="size-6 text-primary" />
                <span className="text-xs font-mono text-muted-foreground">0{index + 1}</span>
              </div>
              <p className="mt-4 text-[10px] font-semibold text-primary">{step.label}</p>
              <h3 className="mt-2 text-sm font-semibold leading-snug">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {compact ? step.summary : step.detail}
              </p>
            </li>
          );
        })}
      </ol>
      {!compact && (
        <div className="mt-7 grid gap-6 border-y border-border py-6 md:grid-cols-2">
          <div>
            <h3 className="text-sm font-semibold">No custody. No identity-document collection.</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Your wallet keeps its keys. LamportPay coordinates quotes, recipient checks and
              status; Stables provides the single-use deposit address and payout infrastructure.
            </p>
          </div>
          <div>
            <h3 className="text-sm font-semibold">A sandbox completion is not production KYC.</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              The app can retain verification from a completed payment, avoiding repeat prompts.
              Current completions are sandbox records only; production identity verification and
              real fiat payouts remain DISABLED.
            </p>
          </div>
        </div>
      )}
    </section>
  );
}
