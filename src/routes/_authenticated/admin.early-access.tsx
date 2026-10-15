import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";

import { AdminPage, EmptyState, ErrorState, LoadingState, Panel } from "@/components/admin/AdminShell";
import { listEarlyAccessAdmin } from "@/lib/early-access.functions";

export const Route = createFileRoute("/_authenticated/admin/early-access")({
  head: () => ({ meta: [{ title: "Early access | LamportPay Admin" }] }),
  component: EarlyAccessPage,
});

const FREE_SLOTS = 10;

function EarlyAccessPage() {
  const list = useServerFn(listEarlyAccessAdmin);
  const query = useQuery({ queryKey: ["admin-early-access"], queryFn: () => list(), refetchInterval: 15_000 });
  const rows = query.data ?? [];
  const first = rows.slice(0, FREE_SLOTS);
  const rest = rows.slice(FREE_SLOTS);

  return (
    <AdminPage
      title="Early access"
      crumbs={[{ label: "Early access" }]}
      description={`People who joined early access from the website. The first ${FREE_SLOTS} pay no LamportPay fee.`}
    >
      <Panel title={`First ${FREE_SLOTS} — fee waived (${first.length}/${FREE_SLOTS})`}>
        {query.isLoading && <LoadingState />}
        {query.isError && <ErrorState error={query.error} />}
        {query.data && rows.length === 0 && <EmptyState>No signups yet.</EmptyState>}
        {first.length > 0 && <SignupTable rows={first} offset={0} />}
      </Panel>
      {rest.length > 0 && (
        <Panel title={`Waiting list (${rest.length})`}>
          <SignupTable rows={rest} offset={FREE_SLOTS} />
        </Panel>
      )}
    </AdminPage>
  );
}

function SignupTable({ rows, offset }: { rows: { id: string; name: string; email: string; mobile: string; created_at: string }[]; offset: number }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="text-left text-xs text-muted-foreground">
          <tr>
            <th className="py-2 pr-3">#</th>
            <th className="py-2 pr-3">Name</th>
            <th className="py-2 pr-3">Email</th>
            <th className="py-2 pr-3">Mobile</th>
            <th className="py-2">Joined</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.map((r, i) => (
            <tr key={r.id}>
              <td className="py-2 pr-3 font-medium">{offset + i + 1}</td>
              <td className="py-2 pr-3">{r.name}</td>
              <td className="py-2 pr-3">{r.email}</td>
              <td className="py-2 pr-3">{r.mobile}</td>
              <td className="py-2 text-muted-foreground">{new Date(r.created_at).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
