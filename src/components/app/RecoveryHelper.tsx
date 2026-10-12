import { useState } from "react";
import { Loader2, Sparkles, X } from "lucide-react";

import { getRecoverySteps } from "@/lib/ai/recovery.functions";
import type { LocalHistoryItem } from "@/lib/payments/local-history";

export function RecoveryHelper({ p, onClose }: { p: LocalHistoryItem; onClose: () => void }) {
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<string>(p.status);
  const [error, setError] = useState(p.failureReason ?? "");
  const [loading, setLoading] = useState(false);
  const [steps, setSteps] = useState<string | null>(null);
  const [problem, setProblem] = useState<string | null>(null);

  async function ask() {
    setLoading(true);
    setProblem(null);
    setSteps(null);
    try {
      const r = await getRecoverySteps({
        data: { description, status, error, lastStep: p.lastStep ?? undefined },
      });
      if (r.ok) setSteps(r.steps);
      else setProblem(r.message);
    } catch {
      setProblem("Could not reach the assistant. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  const field =
    "w-full rounded-xl border border-border/60 bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40";

  return (
    <div className="border-t border-border/50 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="flex items-center gap-1.5 text-sm font-semibold">
          <Sparkles className="w-4 h-4 text-primary" /> AI recovery help
        </p>
        <button type="button" onClick={onClose} aria-label="Close recovery help" className="text-muted-foreground hover:text-foreground">
          <X className="w-4 h-4" />
        </button>
      </div>
      <label className="block text-xs text-muted-foreground">
        What happened?
        <textarea
          className={`${field} mt-1 min-h-20`}
          maxLength={1500}
          placeholder="e.g. The wallet popup closed and the page froze"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </label>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-xs text-muted-foreground">
          Saved status
          <input className={`${field} mt-1`} maxLength={60} value={status} onChange={(e) => setStatus(e.target.value)} />
        </label>
        <label className="block text-xs text-muted-foreground">
          Saved error
          <input className={`${field} mt-1`} maxLength={600} value={error} onChange={(e) => setError(e.target.value)} placeholder="none" />
        </label>
      </div>
      <p className="text-[11px] text-muted-foreground">Never share your seed phrase or private key. Demo payment — no real money moves.</p>
      <button
        type="button"
        onClick={ask}
        disabled={loading}
        className="inline-flex items-center gap-1.5 rounded-full bg-[image:var(--gradient-hero)] px-4 py-2 text-xs font-semibold text-primary-foreground disabled:opacity-60"
      >
        {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
        {loading ? "Thinking…" : "Get recovery steps"}
      </button>
      {problem && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm">{problem}</div>
      )}
      {steps && (
        <div className="whitespace-pre-wrap rounded-xl bg-secondary/60 px-3 py-3 text-sm leading-relaxed">{steps}</div>
      )}
    </div>
  );
}
