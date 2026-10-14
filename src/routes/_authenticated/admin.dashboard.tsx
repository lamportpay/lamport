import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { RefreshCw } from "lucide-react";

import { AdminPage, ErrorState, LoadingState } from "@/components/admin/AdminShell";
import { DashboardContent } from "@/components/admin/DashboardContent";
import { Button } from "@/components/ui/button";
import { getAdminDashboard } from "@/lib/admin-ops.functions";
import { pageSeo } from "@/lib/seo";

export const Route = createFileRoute("/_authenticated/admin/dashboard")({
  head: () =>
    pageSeo({
      path: "/admin/dashboard",
      title: "Operations Dashboard | LamportPay Admin",
      description:
        "LamportPay admin overview of recorded payments, revenue, verification holds, payout activity and system events.",
    }),
  component: DashboardPage,
});

function DashboardPage() {
  const fetchDashboard = useServerFn(getAdminDashboard);
  const query = useQuery({
    queryKey: ["admin-dashboard"],
    queryFn: () => fetchDashboard(),
    refetchInterval: 30_000,
  });

  return (
    <AdminPage
      title="Dashboard"
      crumbs={[{ label: "Dashboard" }]}
      description="Payments, revenue and operational follow-up. Figures reflect stored records, including sandbox activity."
      actions={
        <>
          {query.dataUpdatedAt > 0 && (
            <span className="text-xs text-muted-foreground">
              Updated {new Date(query.dataUpdatedAt).toLocaleTimeString()}
            </span>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => void query.refetch()}
            disabled={query.isFetching}
          >
            <RefreshCw className={query.isFetching ? "motion-safe:animate-spin" : ""} />
            Refresh
          </Button>
        </>
      }
    >
      {query.isLoading && <LoadingState label="Loading dashboard records…" />}
      {query.isError && <ErrorState error={query.error} />}
      {query.data && <DashboardContent data={query.data} />}
    </AdminPage>
  );
}
