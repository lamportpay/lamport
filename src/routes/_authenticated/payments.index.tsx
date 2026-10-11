import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { ArrowRight, ChevronRight, CloudOff, Plus, RotateCcw } from "lucide-react";

import { AppLayout } from "@/components/app/AppLayout";
import { Flag } from "@/components/app/Flag";
import { TokenIcon } from "@/components/app/TokenIcon";
import { paymentApi } from "@/lib/payments/api-client";
import {
  loadLocalHistory,
  mergeServerHistory,
  type LocalHistoryItem,
} from "@/lib/payments/local-history";
import type { PaymentListItem } from "@/lib/payments/view";

export const Route = createFileRoute("/_authenticated/payments/")({
  head: () => ({
    meta: [
      { title: "Payment history | LamportPay" },
      { name: "description", content: "Your LamportPay conversions, with status and where to continue." },
      { property: "og:title", content: "Payment history | LamportPay" },
      { property: "og:description", content: "Your LamportPay conversions and their status." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: PaymentHistoryPage,
});

const STATUS_TEXT: Record<string, string> = {
  COMPLETED: "Completed",
  FAILED: "Failed",
  CANCELLED: "Cancelled",
  EXPIRED: "Expired",
  KYC_REJECTED: "Verification rejected",
};

/** Where an unfinished payment stopped, in plain words. */
const STEP_TEXT: Record<string, string> = {
  PAYMENT_CREATED: "Stopped at quote",
  KYC_PENDING: "Stopped at verification",
  KYC_APPROVED: "Stopped at quote",
  QUOTED: "Stopped at bank details / review",
  CREATED: "Stopped at wallet approval",
  AWAITING_FUNDS_COLLECTION: "Stopped at wallet approval",
};

function PaymentHistoryPage() {
  const [local, setLocal] = useState<LocalHistoryItem[]>([]);
  useEffect(() => setLocal(loadLocalHistory()), []);

  const payments = useQuery({
    queryKey: ["payments"],
    queryFn: async () => (await paymentApi<PaymentListItem[]>("/api/payments")).data,
    retry: 1,
  });

  useEffect(() => {
    if (payments.data) setLocal(mergeServerHistory(payments.data));
  }, [payments.data]);

  const offline = !!payments.error && local.length > 0;
  const list: LocalHistoryItem[] = payments.data
    ? local.filter((l) => payments.data.some((p) => p.id === l.id))
    : local;

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto px-4 py-6 sm:py-10 space-y-4 sm:space-y-6">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">History</h1>
          <Link
            to="/pay"
            search={{}}
            className="inline-flex items-center gap-1.5 rounded-full bg-[image:var(--gradient-hero)] text-primary-foreground px-4 py-2 text-sm font-semibold shadow-[var(--shadow-soft)] hover:opacity-95"
          >
            <Plus className="w-4 h-4" /> New
          </Link>
        </div>

        {offline && (
          <div className="flex items-center gap-2 rounded-xl border border-border/60 bg-secondary/60 px-4 py-3 text-sm">
            <CloudOff className="w-4 h-4 shrink-0" />
            Showing the copy saved in this browser. Status updates when you are back online.
          </div>
        )}

        {payments.isLoading && list.length === 0 && (
          <div className="rounded-3xl border border-border/60 bg-card divide-y divide-border/50">
            {[0, 1, 2].map((i) => (
              <div key={i} className="flex items-center gap-3 p-4">
                <span className="h-10 w-10 rounded-full bg-muted animate-pulse" />
                <span className="h-4 flex-1 rounded bg-muted animate-pulse" />
              </div>
            ))}
          </div>
        )}
        {payments.error && list.length === 0 && (
          <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm">
            {(payments.error as Error).message}
          </div>
        )}
        {!payments.isLoading && !payments.error && list.length === 0 && (
          <div className="rounded-3xl border border-dashed border-border/70 bg-card/70 px-6 py-12 text-center">
            <p className="font-semibold">No payments yet</p>
            <p className="mt-1 text-sm text-muted-foreground">Your conversions will appear here.</p>
          </div>
        )}

        {list.length > 0 && (
          <ul className="space-y-3">
            {list.map((p) => (
              <HistoryRow key={p.id} p={p} />
            ))}
          </ul>
        )}
      </div>
    </AppLayout>
  );
}

function HistoryRow({ p }: { p: LocalHistoryItem }) {
  const completed = p.status === "COMPLETED";
  const failed = p.terminal && !completed;
  const canContinue = !p.terminal;
  const payout = p.actualPayout
    ? `${p.actualPayout.amount} ${p.actualPayout.currency.toUpperCase()}`
    : `${p.destination.amount ?? "—"} ${p.destination.currency.toUpperCase()}`;
  const statusText = STATUS_TEXT[p.status] ?? STEP_TEXT[p.status] ?? "In progress";
  const badge = completed
    ? "bg-[color:var(--success)]/15 text-[color:var(--success)]"
    : failed
      ? "bg-destructive/10 text-destructive"
      : "bg-primary/10 text-primary";

  const body = (
    <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <div className="flex items-center gap-1.5 rounded-full bg-secondary/70 px-2 py-1.5">
          <TokenIcon symbol={p.source.currency} size={26} />
          <ArrowRight className="w-3.5 h-3.5 text-muted-foreground" />
          <Flag code={p.destination.country} size={22} />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">
            {p.source.amount} {p.source.currency.toUpperCase()}
            <span className="text-muted-foreground"> → </span>
            {payout}
          </p>
          <p className="truncate text-xs text-muted-foreground">
            {regionName(p.destination.country)} ·{" "}
            {new Date(p.createdAt).toLocaleString([], {
              day: "numeric",
              month: "short",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
          {failed && p.failureReason && (
            <p className="mt-1 line-clamp-2 text-xs text-destructive">{p.failureReason}</p>
          )}
        </div>
      </div>
      <div className="flex items-center justify-between gap-3 sm:justify-end">
        <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${badge}`}>
          {statusText}
        </span>
        {canContinue ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-[image:var(--gradient-hero)] px-3 py-1.5 text-xs font-semibold text-primary-foreground">
            <RotateCcw className="w-3.5 h-3.5" /> Continue
          </span>
        ) : (
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        )}
      </div>
    </div>
  );

  const cls =
    "block rounded-2xl border border-border/60 bg-card/90 backdrop-blur-xl shadow-[var(--shadow-soft)] hover:bg-secondary/40 transition-colors";
  return (
    <li>
      {completed ? (
        <Link to="/payments/$id" params={{ id: p.id }} className={cls}>
          {body}
        </Link>
      ) : (
        <Link to="/pay" search={{ payment: p.id }} className={cls}>
          {body}
        </Link>
      )}
    </li>
  );
}

function regionName(code: string): string {
  try {
    return new Intl.DisplayNames(["en"], { type: "region" }).of(code.toUpperCase()) ?? code;
  } catch {
    return code;
  }
}
