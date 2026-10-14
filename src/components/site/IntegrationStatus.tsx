import { ArrowUpRight, Clock3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { INTEGRATION_GROUPS } from "@/content/integration-status";

const PER_ROW = 3;
const initials = (n: string) => n.split(" ").map((w) => w[0]).join("").slice(0, 2);

function Logo({ entry }: { entry: { name: string; asset?: string } }) {
  return (
    <span className="relative z-10 flex size-12 items-center justify-center rounded-full border-2 border-home-brand bg-background shadow-sm">
      {entry.asset ? <img src={entry.asset} alt="" width="28" height="28" className="size-7 object-contain" /> : <span className="text-xs font-bold text-home-brand">{initials(entry.name)}</span>}
    </span>
  );
}

function Card({ entry, i }: { entry: Item; i: number }) {
  return (
    <div className="rounded-2xl border border-border bg-background p-4">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Step {i + 1} · {entry.group}</p>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <h3 className="text-sm font-semibold">{entry.name}</h3>
        <span className="ml-auto rounded-full border border-border px-2 py-0.5 text-[10px] font-semibold text-home-brand">{entry.status}</span>
      </div>
      <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{entry.detail}</p>
    </div>
  );
}

type Item = { name: string; status: string; detail: string; asset?: string; group: string; label: string };

export function IntegrationStatus() {
  const items: Item[] = INTEGRATION_GROUPS.flatMap((g) => g.entries.map((e) => ({ ...e, group: g.title, label: g.label })));
  const rows: Item[][] = [];
  for (let i = 0; i < items.length; i += PER_ROW) rows.push(items.slice(i, i + PER_ROW));

  return (
    <section id="integration-status" className="home-section border-t border-border bg-home-surface">
      <div className="home-container">
        <p className="home-eyebrow">Integration outlook</p>
        <h2 className="home-heading">Connected now. Building what’s next.</h2>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">Follow the road from today’s infrastructure to future connections—each stop carries its own status.</p>

        {/* Mobile: vertical tree */}
        <ol aria-label="Integration timeline" className="relative mt-8 space-y-6 border-l-2 border-home-brand/40 pl-8 md:hidden">
          {items.map((e, i) => (
            <li key={e.name} className="relative">
              <span className="absolute -left-[3.15rem] top-0"><Logo entry={e} /></span>
              <Card entry={e} i={i} />
            </li>
          ))}
        </ol>

        {/* Desktop: serpentine U-turn road */}
        <div className="relative mt-10 hidden px-14 md:block" aria-hidden="false">
          {rows.map((row, r) => {
            const reverse = r % 2 === 1;
            const last = r === rows.length - 1;
            return (
              <div key={r} className="relative pb-16">
                <span style={last ? { [reverse ? "left" : "right"]: `${((PER_ROW - row.length) / PER_ROW) * 100 + 16 / PER_ROW}%` } : undefined} className={`absolute top-6 ${last ? "" : "left-0 right-0"}`} data-road className2="h-1 rounded-full bg-gradient-to-r from-home-brand/50 via-home-brand to-home-brand/50" />
                {!last && (
                  <span className={`absolute top-6 h-full w-14 border-y-4 border-home-brand/70 ${reverse ? "-left-14 rounded-l-full border-l-4" : "-right-14 rounded-r-full border-r-4"}`} />
                )}
                <ol className={`relative grid grid-cols-3 gap-6 ${reverse ? "[direction:rtl]" : ""}`}>
                  {row.map((e, k) => {
                    const i = r * PER_ROW + k;
                    return (
                      <li key={e.name} className="flex flex-col items-center gap-3 [direction:ltr]">
                        <Logo entry={e} />
                        <span className="rounded-full bg-home-brand px-2 text-[10px] font-semibold text-primary-foreground">{i + 1}</span>
                        <Card entry={e} i={i} />
                      </li>
                    );
                  })}
                </ol>
              </div>
            );
          })}
        </div>
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
