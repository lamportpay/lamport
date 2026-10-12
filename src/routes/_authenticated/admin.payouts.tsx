import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { BadgeCheck, RefreshCw } from "lucide-react";
import { toast } from "sonner";

import { AdminPage } from "@/components/admin/AdminShell";
import { Button } from "@/components/ui/button";
import { getPayoutQueue, refreshPaymentFromStables } from "@/lib/admin-ops.functions";
import { formatMinor } from "@/lib/money";

export const Route = createFileRoute("/_authenticated/admin/payouts")({
  head: () => ({
    meta: [
      { title: "Payouts | LamportPay Admin" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: PayoutsPage,
});

const fmt = (m: string | null, c: string) => (m == null ? "—" : `${formatMinor(BigInt(m), c.toUpperCase())} ${c.toUpperCase()}`);

function PayoutsPage() {
  const fetchQueue = useServerFn(getPayoutQueue);
  const refresh = useServerFn(refreshPaymentFromStables);
  const qc = useQueryClient();
  const query = useQuery({ queryKey: ["admin-payout-queue"], queryFn: () => fetchQueue() });
  const send = useMutation({
    mutationFn: (paymentId: string) => refresh({ data: { paymentId } }),
    onSuccess: (r) => {
      toast.success(`Stables status: ${r.status ?? "unknown"}`);
      qc.invalidateQueries({ queryKey: ["admin-payout-queue"] });
    },
    onError: (e) => toast.error((e as Error).message),
  });
  const customers = query.data?.customers ?? [];
  return (
    <AdminPage title="Payouts">
      <section className="rounded-2xl border border-border/60 bg-card p-5 space-y-4">
        <div>
          <h2 className="font-semibold text-sm">Verified customers waiting for funds</h2>
          <p className="text-xs text-muted-foreground mt-1">
            Payments whose Stables transfer exists and is waiting for the customer's coins, oldest first.
            "Check next with Stables" asks Stables for the latest status of the oldest one. No money moves.
          </p>
        </div>
        {query.isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
        {query.isError && <p className="text-sm text-destructive">{(query.error as Error).message}</p>}
        {query.data && customers.length === 0 && (
          <p className="text-sm text-muted-foreground">No verified customer has a payment waiting for funds.</p>
        )}
        {customers.map((c) => {
          const next = c.payments[0];
          return (
            <div key={c.userId} className="rounded-xl border border-border/50 p-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <BadgeCheck className="w-4 h-4 text-primary" /> {c.name}
                  <span className="text-xs font-normal text-muted-foreground">
                    {c.verifiedByPayment ? "Verified (paid)" : "Verified"} · {c.payments.length} pending
                  </span>
                </div>
                <Button size="sm" onClick={() => next && send.mutate(next.id)} disabled={!next || send.isPending}>
                  <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${send.isPending && send.variables === next?.id ? "animate-spin" : ""}`} />
                  Check next with Stables
                </Button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="text-left text-muted-foreground">
                    <tr className="border-b border-border/50">
                      <th className="py-2 pr-3 font-medium">Created</th>
                      <th className="py-2 pr-3 font-medium">Sends</th>
                      <th className="py-2 pr-3 font-medium">Payout</th>
                      <th className="py-2 pr-3 font-medium">Country</th>
                      <th className="py-2 pr-3 font-medium">Last checked</th>
                      <th className="py-2 font-medium"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {c.payments.map((p, i) => (
                      <tr key={p.id} className={i === 0 ? "font-medium" : ""}>
                        <td className="py-2 pr-3">{new Date(p.createdAt).toLocaleString()}{i === 0 && <span className="ml-1 text-primary">· next</span>}</td>
                        <td className="py-2 pr-3 tabular-nums">{fmt(p.sourceAmountMinor, p.sourceCurrency)}</td>
                        <td className="py-2 pr-3 tabular-nums">{fmt(p.destinationAmountMinor, p.destinationCurrency)}</td>
                        <td className="py-2 pr-3">{p.destinationCountry}</td>
                        <td className="py-2 pr-3">{p.lastChecked ? new Date(p.lastChecked).toLocaleString() : "—"}</td>
                        <td className="py-2">
                          <Link to="/admin/payments/$id" params={{ id: p.id }} className="text-primary hover:underline">Open</Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}
      </section>
    </AdminPage>
  );
}
