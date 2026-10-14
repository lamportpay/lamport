import { ArrowUpRight, Clock3, Link2, LockKeyhole, Network } from "lucide-react";
import { Button } from "@/components/ui/button";
import { INTEGRATION_GROUPS } from "@/content/integration-status";

export function IntegrationStatus() {
  return (
    <section id="integration-status" className="home-section border-b border-border bg-home-surface">
      <div className="home-container">
        <p className="home-eyebrow">Integration outlook</p>
        <h2 className="home-heading">Connected now. Building what’s next.</h2>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">Payment infrastructure, future connections and prospective relationships—each with its own status.</p>
        <div className="mt-8 grid gap-8 lg:grid-cols-3">
          {INTEGRATION_GROUPS.map((group, index) => {
            const Icon = [Link2, LockKeyhole, Network][index] ?? Network;
            return (
              <div key={group.title} className="min-w-0">
                <div className="flex items-center gap-3 border-b border-border pb-5">
                  <Icon className="size-6 shrink-0 text-home-brand" />
                  <div><h3 className="text-lg font-semibold text-home-ink">{group.title}</h3><p className="mt-1 text-xs text-muted-foreground">{group.label}</p></div>
                </div>
                <div className="divide-y divide-border">
                  {group.entries.map((entry) => (
                    <div key={entry.name} className="py-5">
                      <div className="flex flex-wrap items-center gap-2">
                        {"asset" in entry ? <img src={entry.asset} alt="" width="24" height="24" className="size-6 object-contain" /> : <Network className="size-5 text-home-brand" />}
                        <h4 className="text-sm font-semibold">{entry.name}</h4>
                        <span className="ml-auto text-[10px] font-semibold text-home-brand">{entry.status}</span>
                      </div>
                      <p className="mt-3 text-xs leading-relaxed text-muted-foreground">{entry.detail}</p>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-8 flex flex-wrap items-center justify-between gap-5 border-y border-border py-6" id="colosseum-status">
          <div className="flex items-start gap-3">
            <Clock3 className="mt-1 size-6 shrink-0 text-home-brand" />
            <div><p className="home-eyebrow">Colosseum · Decision pending</p><h3 className="text-lg font-semibold">Project submitted for consideration.</h3><p className="mt-2 max-w-xl text-xs leading-relaxed text-muted-foreground">Submission reported by the LamportPay team. No selection, investment, backing or endorsement is confirmed.</p></div>
          </div>
          <Button asChild variant="link" className="px-0 text-home-brand"><a href="https://www.colosseum.org/" target="_blank" rel="noopener noreferrer">Colosseum <ArrowUpRight /></a></Button>
        </div>
        <p className="mt-4 text-xs text-muted-foreground">Token symbols identify assets, not issuer partnerships. Technology connections are not financial backing.</p>
      </div>
    </section>
  );
}