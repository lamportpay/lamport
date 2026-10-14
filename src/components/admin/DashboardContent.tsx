import { Link } from "@tanstack/react-router";
import { ArrowUpRight, BadgeCheck, CheckCircle2, Coins, ReceiptText, Search, ShieldAlert, Webhook } from "lucide-react";
import { useState } from "react";

import { EmptyState, Panel, StatCard } from "@/components/admin/AdminShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { type AdminDashboardData, filterRecentPayments, statusLabel, statusTone } from "@/lib/admin-dashboard";
import { formatMinor } from "@/lib/money";

function SectionHeading({ title, label }: { title: string; label: string }) {
  return <div className="flex items-center gap-3"><h2 className="text-base font-semibold">{title}</h2><span className="text-xs text-muted-foreground">{label}</span></div>;
}

export function DashboardContent({ data: d }: { data: AdminDashboardData }) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const rows = filterRecentPayments(d.recent, search, status);
  const statuses = Object.entries(d.totals.byStatus).sort(([, a], [, b]) => b - a);
  const attention = d.attention.openTravelRule + d.attention.feeMismatches;
  const completed = d.totals.byStatus.COMPLETED ?? 0;

  return <div className="space-y-7">
    <section aria-label="Payment overview" className="space-y-3">
      <SectionHeading title="At a glance" label={d.totals.partial ? "First 5,000 records" : "All-time records"} />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total payments" value={d.totals.payments.toLocaleString()} icon={ReceiptText} hint="Stored payment records" />
        <StatCard label="Completed payments" value={completed.toLocaleString()} icon={CheckCircle2} hint={d.totals.payments ? `${Math.round(completed / d.totals.payments * 100)}% of counted payments` : "No completed payments yet"} />
        <StatCard label="Revenue received · USDC" value={formatMinor(BigInt(d.revenue.receivedMinor), "usdc")} icon={Coins} hint={`${formatMinor(BigInt(d.revenue.received24hMinor), "usdc")} USDC · last 24 hours`} />
        <StatCard label="Attention indicators" value={attention.toLocaleString()} icon={ShieldAlert} hint="Travel Rule holds + fee mismatch events" />
      </div>
    </section>

    <section aria-label="Operations" className="space-y-3">
      <SectionHeading title="Operations" label="Review & follow up" />
      <div className="grid items-start gap-4 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <Panel title="Needs attention" actions={<span className={`rounded-md px-2 py-1 text-xs font-medium ${attention ? "bg-destructive/10 text-destructive" : "bg-success/10 text-success"}`}>{attention ? `${attention} indicators` : "No open indicators"}</span>}>
            <div className="divide-y divide-border">
              <Link to="/admin/payments" className="flex items-center gap-3 py-3 transition hover:text-primary"><ShieldAlert className="h-5 w-5 shrink-0 text-muted-foreground" /><div className="min-w-0 flex-1"><div className="text-sm font-medium">Travel Rule holds</div><div className="mt-1 text-xs text-muted-foreground">Unresolved wallet-verification requests</div></div><span className="font-semibold tabular-nums">{d.attention.openTravelRule}</span><ArrowUpRight className="h-4 w-4 shrink-0" /></Link>
              <Link to="/admin/fees-revenue" className="flex items-center gap-3 py-3 transition hover:text-primary"><Coins className="h-5 w-5 shrink-0 text-muted-foreground" /><div className="min-w-0 flex-1"><div className="text-sm font-medium">Fee mismatch events</div><div className="mt-1 text-xs text-muted-foreground">Compare expected and received revenue</div></div><span className="font-semibold tabular-nums">{d.attention.feeMismatches}</span><ArrowUpRight className="h-4 w-4 shrink-0" /></Link>
            </div>
            <div className="flex flex-wrap gap-2 border-t border-border pt-4">
              <Button asChild variant="outline" size="sm"><Link to="/admin/payouts"><ArrowUpRight />Payout queue</Link></Button>
              <Button asChild variant="ghost" size="sm"><Link to="/admin/verified-customers"><BadgeCheck />Verified customers</Link></Button>
            </div>
          </Panel>
        </div>
        <Panel title="Payments by status">
          {statuses.length === 0 ? <EmptyState>No payments yet.</EmptyState> : <ul className="space-y-3">{statuses.map(([name, count]) => <li key={name} className="space-y-1.5"><div className="flex items-center justify-between gap-3 text-xs"><span className="capitalize">{statusLabel(name)}</span><span className="font-semibold tabular-nums">{count.toLocaleString()}</span></div><div className="flex h-1.5 overflow-hidden rounded-full bg-muted" aria-hidden="true"><div className="bg-primary/70" style={{ flex: count }} /><div style={{ flex: Math.max(0, d.totals.payments - count) }} /></div></li>)}</ul>}
        </Panel>
      </div>
    </section>

    <section aria-label="Recent payment activity" className="space-y-3">
      <SectionHeading title="Payment activity" label="Latest 8 records" />
      <Panel title="Recent payments" actions={<Button asChild variant="ghost" size="sm"><Link to="/admin/payments">All payments<ArrowUpRight /></Link></Button>}>
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative min-w-0 flex-1"><Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" /><Input aria-label="Search recent payments" placeholder="Payment ID, country or currency" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" /></div>
          <select aria-label="Filter recent payments by status" value={status} onChange={(e) => setStatus(e.target.value)} className="h-9 rounded-md border border-input bg-background px-3 text-sm sm:w-48"><option value="all">All statuses</option>{[...new Set(d.recent.map((row) => row.status))].sort().map((name) => <option key={name} value={name}>{statusLabel(name)}</option>)}</select>
        </div>
        {rows.length === 0 ? <EmptyState>{d.recent.length ? "No payments match these filters." : "No payments yet."}</EmptyState> : <div className="overflow-x-auto"><table className="w-full min-w-[640px] text-left text-sm"><thead className="border-y border-border bg-muted/40 text-xs text-muted-foreground"><tr><th className="px-3 py-3 font-medium">Payment / created</th><th className="px-3 py-3 font-medium">Source amount</th><th className="px-3 py-3 font-medium">Destination payout</th><th className="px-3 py-3 font-medium">Status</th><th className="px-3 py-3"><span className="sr-only">Open payment</span></th></tr></thead><tbody className="divide-y divide-border">{rows.map((row) => <tr key={row.id} className="hover:bg-muted/30"><td className="px-3 py-4"><Link to="/admin/payments/$id" params={{ id: row.id }} className="font-mono text-xs font-medium text-primary hover:underline">{row.id.slice(0, 8)}</Link><div className="mt-1 text-xs text-muted-foreground">{new Date(row.created_at).toLocaleString()}</div></td><td className="px-3 py-4 tabular-nums">{formatMinor(BigInt(row.source_amount_minor), row.source_currency)} <span className="text-xs text-muted-foreground">{row.source_currency.toUpperCase()}</span></td><td className="px-3 py-4 tabular-nums">{row.destination_amount_minor === null ? "—" : `${formatMinor(BigInt(row.destination_amount_minor), row.destination_currency)} ${row.destination_currency.toUpperCase()}`}<div className="mt-1 text-xs text-muted-foreground">{row.destination_country}</div></td><td className="px-3 py-4"><span className={`inline-block whitespace-nowrap rounded-md px-2 py-1 text-[11px] font-medium capitalize ${statusTone(row.status)}`}>{statusLabel(row.status)}</span></td><td className="px-3 py-4"><Button asChild variant="ghost" size="icon"><Link to="/admin/payments/$id" params={{ id: row.id }} aria-label={`Open payment ${row.id.slice(0, 8)}`}><ArrowUpRight /></Link></Button></td></tr>)}</tbody></table></div>}
        <p className="text-xs text-muted-foreground">{rows.length} of {d.recent.length} recent payments</p>
      </Panel>
    </section>

    <section aria-label="System and reporting" className="space-y-3">
      <SectionHeading title="System & reporting" label="Recorded activity" />
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Last Stables webhook" actions={<Webhook className="h-4 w-4 text-muted-foreground" />}>
          {d.lastWebhook ? <div><p className="break-all text-sm font-medium">{d.lastWebhook.event_type}</p><p className="mt-1 text-xs text-muted-foreground">{new Date(d.lastWebhook.received_at).toLocaleString()}</p></div> : <EmptyState>No webhook stored yet.</EmptyState>}
          <Button asChild variant="outline" size="sm"><Link to="/admin/system-status">System status<ArrowUpRight /></Link></Button>
        </Panel>
        <Panel title="Revenue & accountability">
          <dl className="flex items-center justify-between gap-3 text-sm"><dt className="text-muted-foreground">Payment records with a fee</dt><dd className="font-semibold tabular-nums">{d.revenue.paymentsWithFee.toLocaleString()}</dd></dl>
          <div className="flex flex-wrap gap-2"><Button asChild variant="outline" size="sm"><Link to="/admin/reports">Revenue reports<ArrowUpRight /></Link></Button><Button asChild variant="ghost" size="sm"><Link to="/admin/audit-logs">Audit logs<ArrowUpRight /></Link></Button></div>
        </Panel>
      </div>
    </section>
  </div>;
}