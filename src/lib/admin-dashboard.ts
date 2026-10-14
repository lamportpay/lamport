/** Presentation-only dashboard data; provider state remains authoritative. */
export type AdminDashboardData = {
  totals: { payments: number; partial: boolean; byStatus: Record<string, number> };
  revenue: { receivedMinor: string; received24hMinor: string; paymentsWithFee: number };
  attention: { openTravelRule: number; feeMismatches: number };
  recent: {
    id: string;
    status: string;
    created_at: string;
    source_currency: string;
    source_amount_minor: string | number;
    destination_currency: string;
    destination_amount_minor: string | number | null;
    destination_country: string;
  }[];
  lastWebhook: { event_type: string; received_at: string } | null;
};

export function statusLabel(status: string) {
  return status.replace(/_/g, " ").toLowerCase();
}

export function statusTone(status: string) {
  if (status === "COMPLETED") return "bg-success/10 text-success";
  if (["FAILED", "CANCELLED", "EXPIRED"].includes(status))
    return "bg-destructive/10 text-destructive";
  return "bg-muted text-muted-foreground";
}

export function filterRecentPayments(
  rows: AdminDashboardData["recent"],
  search: string,
  status: string,
) {
  const term = search.trim().toLowerCase();
  return rows.filter(
    (row) =>
      (status === "all" || row.status === status) &&
      `${row.id} ${row.destination_country} ${row.source_currency} ${row.destination_currency} ${statusLabel(row.status)}`
        .toLowerCase()
        .includes(term),
  );
}
