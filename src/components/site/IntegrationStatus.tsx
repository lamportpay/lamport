import { useRef } from "react";
import { ArrowUpRight, ChevronLeft, ChevronRight, Clock3, Network } from "lucide-react";
import { Button } from "@/components/ui/button";
import { INTEGRATION_GROUPS } from "@/content/integration-status";

export function IntegrationStatus() {
  const rail = useRef<HTMLOListElement>(null);
  const items = INTEGRATION_GROUPS.flatMap((g) => g.entries.map((e) => ({ ...e, group: g.title, label: g.label })));
  const scroll = (dir: number) => {
    const el = rail.current;
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollBy({ left: dir * el.clientWidth * 0.8, behavior: reduce ? "auto" : "smooth" });
  };

  return (
    <section id="integration-status" className="home-section border-t border-border bg-home-surface">
      <div className="home-container">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="home-eyebrow">Integration outlook</p>
            <h2 className="home-heading">Connected now. Building what’s next.</h2>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">Payment infrastructure, future connections and prospective relationships—each with its own status.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="icon" aria-label="Previous integrations" onClick={() => scroll(-1)}><ChevronLeft /></Button>
            <Button variant="outline" size="icon" aria-label="Next integrations" onClick={() => scroll(1)}><ChevronRight /></Button>
          </div>
        </div>
        <ol ref={rail} aria-label="Integration timeline" className="relative mt-8 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4 [scrollbar-width:thin]">
          {items.map((entry, i) => (
            <li key={entry.name} className="relative w-[78%] shrink-0 snap-start sm:w-[45%] lg:w-[30%]">
              <div className="flex items-center gap-2 pb-4">
                <span className="flex size-7 items-center justify-center rounded-full bg-home-brand text-xs font-semibold text-primary-foreground">{i + 1}</span>
                <span className="h-px flex-1 bg-border" />
              </div>
              <div className="h-full rounded-2xl border border-border bg-background p-5">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{entry.group} · {entry.label}</p>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {"asset" in entry ? <img src={entry.asset} alt="" width="24" height="24" className="size-6 object-contain" /> : <Network className="size-5 text-home-brand" />}
                  <h3 className="text-sm font-semibold">{entry.name}</h3>
                  <span className="ml-auto rounded-full border border-border px-2 py-0.5 text-[10px] font-semibold text-home-brand">{entry.status}</span>
                </div>
                <p className="mt-3 text-xs leading-relaxed text-muted-foreground">{entry.detail}</p>
              </div>
            </li>
          ))}
        </ol>
        <div className="mt-8 flex flex-wrap items-center justify-between gap-5 border-y border-border py-6" id="colosseum-status">
          <div className="flex items-start gap-3">
            <Clock3 className="mt-1 size-6 shrink-0 text-home-brand" />
            <div><p className="home-eyebrow">Colosseum · Decision pending</p><h3 className="text-lg font-semibold">Project submitted for consideration.</h3><p className="mt-2 max-w-xl text-xs leading-relaxed text-muted-foreground">Submission reported by the LamportPay team. No selection, investment, backing or endorsement is confirmed.</p></div>
          </div>
          <Button asChild variant="link" className="px-0 text-home-brand"><a href="https://colosseum.com/arena/projects/lamportpay" target="_blank" rel="noopener noreferrer">View project on Colosseum <ArrowUpRight /></a></Button>
        </div>
        <p className="mt-4 text-xs text-muted-foreground">Token symbols identify assets, not issuer partnerships. Technology connections are not financial backing.</p>
      </div>
    </section>
  );
}
