import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { BadgeCheck, RefreshCw } from "lucide-react";

import { AdminPage } from "@/components/admin/AdminShell";
import { Button } from "@/components/ui/button";
import { getVerifiedCustomers } from "@/lib/admin-ops.functions";

export const Route = createFileRoute("/_authenticated/admin/verified-customers")({
  head: () => ({
    meta: [
      { title: "Verified customers | LamportPay Admin" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: VerifiedCustomersPage,
});

const short = (v: string) => (v.length > 12 ? `${v.slice(0, 4)}…${v.slice(-4)}` : v);

function VerifiedCustomersPage() {
  const fetchCustomers = useServerFn(getVerifiedCustomers);
  const qc = useQueryClient();
  const query = useQuery({
    queryKey: ["admin-verified-customers"],
    queryFn: () => fetchCustomers({ data: {} }),
  });
  const sync = useMutation({
    mutationFn: () => fetchCustomers({ data: { sync: true } }),
    onSuccess: (d) => qc.setQueryData(["admin-verified-customers"], d),
  });
  const data = sync.data ?? query.data;
  return (
    <AdminPage title="Verified customers">
      <section className="rounded-2xl border border-border/60 bg-card p-5 space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="font-semibold text-sm">Customers verified by Stables</h2>
            <p className="text-xs text-muted-foreground mt-1">
              Matched by wallet: each wallet is one LamportPay account, linked to its Stables
              customer. Customers are detected automatically when they connect their wallet.
              A wallet stays verified for good after its first completed payment; its email is saved on the next sync.
            </p>
          </div>
          <Button size="sm" variant="outline" onClick={() => sync.mutate()} disabled={sync.isPending}>
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${sync.isPending ? "animate-spin" : ""}`} />
            Sync from Stables
          </Button>
        </div>
        {data?.syncError && <p className="text-sm text-destructive">{data.syncError}</p>}
        {query.isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
        {query.isError && <p className="text-sm text-destructive">{(query.error as Error).message}</p>}
        {data && data.customers.length === 0 && (
          <p className="text-sm text-muted-foreground">No Stables customers yet.</p>
        )}
        {data && data.customers.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="text-left text-muted-foreground">
                <tr className="border-b border-border/50">
                  <th className="py-2 pr-3 font-medium">Wallet</th>
                  <th className="py-2 pr-3 font-medium">First name</th>
                  <th className="py-2 pr-3 font-medium">Last name</th>
                  <th className="py-2 pr-3 font-medium">Email</th>
                  <th className="py-2 pr-3 font-medium">Status</th>
                  <th className="py-2 pr-3 font-medium">Completed payments</th>
                  <th className="py-2 font-medium">Stables customer</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {data.customers.map((c) => (
                  <tr key={c.userId}>
                    <td className="py-2 pr-3 font-mono">
                      {c.wallets.length ? c.wallets.map((w) => <div key={w} title={w}>{short(w)}</div>) : "—"}
                    </td>
                    <td className="py-2 pr-3">{c.firstName ?? "—"}</td>
                    <td className="py-2 pr-3">{c.lastName ?? "—"}</td>
                    <td className="py-2 pr-3">{c.email ?? <span className="text-muted-foreground">sync to show</span>}</td>
                    <td className="py-2 pr-3">
                      {c.verified ? (
                        <span className="inline-flex items-center gap-1 font-semibold text-primary">
                          <BadgeCheck className="w-3.5 h-3.5" /> {c.verifiedByPayment ? "Verified (paid)" : "Verified"}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">{c.verificationStatus ?? "Not started"}</span>
                      )}
                    </td>
                    <td className="py-2 pr-3 tabular-nums">{c.completedPayments}</td>
                    <td className="py-2 font-mono" title={c.stablesCustomerId}>{short(c.stablesCustomerId)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </AdminPage>
  );
}
