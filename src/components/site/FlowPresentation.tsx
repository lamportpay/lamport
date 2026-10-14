import type { LucideIcon } from "lucide-react";
import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { useFlowPlayback } from "@/hooks/use-flow-playback";

type Playback = ReturnType<typeof useFlowPlayback>;
export function FlowControls({ flow, count, label }: { flow: Playback; count: number; label: string }) {
  return (
    <div className="mt-6 flex items-center gap-2">
      <Button size="icon" variant="outline" title={`Previous ${label}`} aria-label={`Previous ${label}`} onClick={() => flow.pick(flow.active - 1)}><ChevronLeft /></Button>
      <Button size="icon" variant="outline" title={flow.playing ? `Pause ${label}` : `Play ${label}`} aria-label={flow.playing ? `Pause ${label}` : `Play ${label}`} aria-pressed={flow.playing} disabled={flow.reduced} onClick={() => flow.setPlaying(!flow.playing)}>{flow.playing ? <Pause /> : <Play />}</Button>
      <Button size="icon" variant="outline" title={`Next ${label}`} aria-label={`Next ${label}`} onClick={() => flow.pick(flow.active + 1)}><ChevronRight /></Button>
      <span className="ml-2 font-mono text-xs text-muted-foreground">{String(flow.active + 1).padStart(2, "0")} / {String(count).padStart(2, "0")}</span>
    </div>
  );
}

export type SceneNode = { title: string; label: string; icon: LucideIcon; planned?: boolean };
export function FlowScene({ nodes, flow, label, branching = false }: { nodes: SceneNode[]; flow: Playback; label: string; branching?: boolean }) {
  const height = nodes.length * 78 + 48;
  return (
    <div className="flow-scene relative flex items-center p-4 sm:p-7">
      <ol className="grid w-full gap-2 md:hidden" aria-label={label}>
        {nodes.map(({ title, label: status, icon: Icon, planned }, index) => (
          <li key={title}>
            <Button variant="outline" aria-pressed={index === flow.active} onClick={() => flow.pick(index)} className={`h-auto min-h-14 w-full justify-start gap-3 whitespace-normal rounded-lg px-3 py-2 text-left ${index === flow.active ? "border-home-brand bg-card text-home-ink" : "border-border bg-card/80"} ${planned ? "border-dashed" : ""}`}>
              <span className="grid size-8 shrink-0 place-items-center rounded-md bg-home-tint text-home-brand"><Icon className="size-4" /></span>
              <span className="min-w-0"><span className="block text-sm font-semibold">{title}</span><span className="block text-[10px] font-medium text-muted-foreground">{status}</span></span>
            </Button>
          </li>
        ))}
      </ol>
      <svg viewBox={`0 0 480 ${height}`} className="hidden w-full md:block" role="img" aria-label={label}>
        <path d={`M36 36 V${height - 48}`} className="flow-wire" />
        {!branching && <path d={`M36 36 V${36 + flow.active * 78}`} className="flow-wire flow-wire-active" />}
        {nodes.map(({ title, label: status, icon: Icon, planned }, index) => {
          const y = 18 + index * 78;
          const on = index === flow.active;
          return (
            <g key={title} data-active={on} data-planned={planned} className="flow-scene-node">
              <path d={`M36 ${y + 30} H90`} className={`flow-wire ${on ? "flow-wire-active" : ""} ${planned ? "flow-wire-planned" : ""}`} />
              <circle cx="36" cy={y + 30} r="7" className="flow-junction" />
              <foreignObject x="90" y={y} width="375" height="64">
                <Button variant="outline" aria-pressed={on} onClick={() => flow.pick(index)} className={`flow-scene-button h-[60px] w-full justify-start gap-3 whitespace-normal px-4 text-left ${on ? "border-home-brand bg-card text-home-ink" : "border-border bg-card/80"}`}>
                  <span className="grid size-9 shrink-0 place-items-center rounded-md bg-home-tint text-home-brand"><Icon /></span>
                  <span className="min-w-0"><span className="block text-sm font-semibold">{title}</span><span className="block text-[10px] font-medium text-muted-foreground">{status}</span></span>
                </Button>
              </foreignObject>
            </g>
          );
        })}
        {!nodes[flow.active]?.planned && <circle cx="36" cy={48 + flow.active * 78} r="13" className="flow-traveler" />}
      </svg>
    </div>
  );
}