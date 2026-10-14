import type { LucideIcon } from "lucide-react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { useFlowPlayback } from "@/hooks/use-flow-playback";

type Playback = ReturnType<typeof useFlowPlayback>;
export function FlowControls({ flow, count, label }: { flow: Playback; count: number; label: string }) {
  return (
    <div className="mb-5 grid grid-cols-[auto_1fr_auto] items-center gap-3">
      <Button size="icon" variant="outline" title={`Previous ${label}`} aria-label={`Previous ${label}`} onClick={() => flow.pick(flow.active - 1)}><ChevronLeft /></Button>
      <span className="text-center font-mono text-xs text-muted-foreground">{String(flow.active + 1).padStart(2, "0")} / {String(count).padStart(2, "0")}</span>
      <Button size="icon" variant="outline" title={`Next ${label}`} aria-label={`Next ${label}`} onClick={() => flow.pick(flow.active + 1)}><ChevronRight /></Button>
    </div>
  );
}

export type SceneNode = { title: string; label: string; icon: LucideIcon; planned?: boolean };
export function FlowScene({ nodes, flow, label, branching = false }: { nodes: SceneNode[]; flow: Playback; label: string; branching?: boolean }) {
  return (
    <div className="flow-scene relative border-t border-border p-4 sm:p-6">
      <ol className="grid w-full grid-cols-1 gap-2 sm:grid-cols-3" aria-label={label}>
        {nodes.map(({ title, label: status, icon: Icon, planned }, index) => (
          <li key={title} className="min-w-0">
            <Button variant="outline" aria-pressed={index === flow.active} onClick={() => flow.pick(index)} className={`h-full min-h-16 w-full justify-start gap-3 whitespace-normal rounded-lg px-3 py-3 text-left ${index === flow.active ? "border-home-brand bg-card text-home-ink" : "border-border bg-card/80"} ${planned ? "border-dashed" : ""}`}>
              <span className="grid size-8 shrink-0 place-items-center rounded-md bg-home-tint text-home-brand"><Icon className="size-4" /></span>
              <span className="min-w-0"><span className="block text-sm font-semibold">{title}</span><span className="block text-[10px] font-medium text-muted-foreground">{status}</span></span>
            </Button>
          </li>
        ))}
      </ol>
      <svg viewBox="0 0 480 12" className="mt-3 h-3 w-full" aria-hidden="true">
        <path d="M8 6 H472" className={`flow-wire ${branching ? "flow-wire-planned" : "flow-wire-active"}`} />
        <circle cx={8 + flow.active * (464 / Math.max(nodes.length - 1, 1))} cy="6" r="4" className="flow-junction" />
      </svg>
    </div>
  );
}
