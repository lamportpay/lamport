import { ArrowUpRight, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BANK_RESTRICTIONS, BANK_RESTRICTION_SOURCE } from "@/content/integration-status";

export function BankRestrictions() {
  return (
    <div className="home-container mt-10 border-t border-border pt-8" id="bank-restrictions">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div><p className="home-eyebrow">Official bank guidance</p><h3 className="text-2xl font-semibold text-home-ink">Bank restrictions & availability.</h3></div>
        <Button asChild variant="link" className="px-0 text-home-brand"><a href={BANK_RESTRICTION_SOURCE} target="_blank" rel="noopener noreferrer">Stables documentation <ArrowUpRight /></a></Button>
      </div>
      <div className="mt-6 grid gap-6 md:grid-cols-3">
        {BANK_RESTRICTIONS.map((item) => <div key={item.title}><Info className="mb-3 size-5 text-home-brand" /><h4 className="text-sm font-semibold">{item.title}</h4><p className="mt-2 text-xs leading-relaxed text-muted-foreground">{item.detail}</p></div>)}
      </div>
      <p className="mt-5 text-[10px] text-muted-foreground">Official documentation reviewed 14 October 2026. This guidance does not expand LamportPay’s enabled destinations.</p>
    </div>
  );
}