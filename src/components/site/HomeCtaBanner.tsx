import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";

export function HomeCtaBanner() {
  return (
    <section className="home-section border-t border-border">
      <div className="home-container">
        <div className="home-cta-banner relative isolate overflow-hidden rounded-2xl px-6 py-12 text-center sm:px-12 sm:py-16">
          <span aria-hidden className="home-cta-ring home-cta-ring-a" />
          <span aria-hidden className="home-cta-ring home-cta-ring-b" />
          <span aria-hidden className="home-cta-ring home-cta-ring-c" />
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-home-brand">
            Crypto in. Local money out.
          </p>
          <h2 className="mx-auto mt-4 max-w-2xl text-3xl font-semibold leading-tight text-home-ink sm:text-5xl">
            Send stablecoins. Your bank gets local money.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-sm text-home-connector sm:text-base">
            Connect your Solana wallet, see the full cost before you sign, and follow every step to
            the bank. No custody, one clear fee.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              to="/pay"
              className="home-cta-primary inline-flex h-12 items-center gap-2 rounded-lg px-6 text-sm font-semibold shadow-lg transition hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2"
            >
              Open App <ArrowRight className="size-4" />
            </Link>
            <Link
              to="/how-it-works"
              className="inline-flex h-12 items-center rounded-lg border border-home-brand/30 px-6 text-sm font-semibold text-home-brand transition hover:bg-home-tint"
            >
              How it works
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
