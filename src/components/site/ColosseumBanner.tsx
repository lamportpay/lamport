import { Trophy, ArrowUpRight } from "lucide-react";

const COLOSSEUM_URL = "https://colosseum.com/arena/projects/lamportpay";

/**
 * Slim news sticker below the marketing header: announces the Colosseum
 * Arena submission with a direct link to the project page.
 */
export function ColosseumBanner() {
  return (
    <a
      href={COLOSSEUM_URL}
      target="_blank"
      rel="noopener noreferrer"
      className="colosseum-banner group relative block overflow-hidden border-t border-border/60 print:hidden"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-5 py-2 flex items-center gap-3 text-[13px] leading-snug">
        <span className="colosseum-banner-badge inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide">
          <Trophy className="h-3 w-3" aria-hidden="true" />
          News
        </span>
        <p className="min-w-0 flex-1 text-foreground/90">
          <span className="font-semibold">LamportPay is submitted to Colosseum Arena.</span>{" "}
          <span className="text-muted-foreground hidden sm:inline">
            Our project page is live on the Colosseum Arena — decision pending.
          </span>
        </p>
        <span className="inline-flex shrink-0 items-center gap-1 font-semibold text-home-brand">
          <span className="hidden md:inline">View project</span>
          <span className="md:hidden">View</span>
          <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 motion-reduce:transition-none" aria-hidden="true" />
        </span>
      </div>
    </a>
  );
}
