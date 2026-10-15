import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";

import {
  AdminPage,
  EmptyState,
  ErrorState,
  LoadingState,
  Panel,
} from "@/components/admin/AdminShell";
import { Button } from "@/components/ui/button";
import {
  listSupportChatsAdmin,
  updateSupportChatAdmin,
  type SupportChatRow,
} from "@/lib/support-chats.functions";

export const Route = createFileRoute("/_authenticated/admin/complaints")({
  head: () => ({ meta: [{ title: "Complaints & chats | LamportPay Admin" }] }),
  component: ComplaintsPage,
});

const STATUS_LABEL: Record<string, string> = {
  open: "Open",
  in_progress: "In progress",
  resolved: "Resolved",
};

function ComplaintsPage() {
  const [complaintsOnly, setComplaintsOnly] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);
  const list = useServerFn(listSupportChatsAdmin);
  const query = useQuery({
    queryKey: ["admin-support-chats", complaintsOnly],
    queryFn: () => list({ data: { complaintsOnly } }),
    refetchInterval: 10_000,
  });
  const rows = query.data ?? [];
  const current = rows.find((r) => r.id === selected) ?? null;
  const openCount = rows.filter((r) => r.is_complaint && r.status !== "resolved").length;

  return (
    <AdminPage
      title="Complaints & chats"
      crumbs={[{ label: "Complaints & chats" }]}
      description="Questions from the website's Ask AI assistant. When a visitor reports a problem, the assistant files it as a complaint here. Updates every 10 seconds."
    >
      <div className="flex flex-wrap items-center gap-2">
        <Button size="sm" variant={complaintsOnly ? "default" : "outline"} onClick={() => setComplaintsOnly(true)}>
          Complaints{complaintsOnly && openCount > 0 ? ` · ${openCount} open` : ""}
        </Button>
        <Button size="sm" variant={!complaintsOnly ? "default" : "outline"} onClick={() => setComplaintsOnly(false)}>
          All chats
        </Button>
      </div>
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        <Panel>
          {query.isLoading && <LoadingState />}
          {query.isError && <ErrorState error={query.error} />}
          {query.data && rows.length === 0 && (
            <EmptyState>{complaintsOnly ? "No complaints yet." : "No chats yet."}</EmptyState>
          )}
          <ul className="divide-y divide-border">
            {rows.map((r) => (
              <li key={r.id}>
                <button
                  type="button"
                  onClick={() => setSelected(r.id)}
                  className={`w-full rounded-md px-2 py-3 text-left hover:bg-muted ${selected === r.id ? "bg-muted" : ""}`}
                >
                  <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                    <span>{new Date(r.updated_at).toLocaleString()}</span>
                    {r.is_complaint && <StatusBadge status={r.status} />}
                  </div>
                  <p className="mt-1 line-clamp-2 text-sm font-medium">
                    {r.complaint_summary || r.last_question || "(no question)"}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {r.message_count} messages{r.complaint_category ? ` · ${r.complaint_category}` : ""}
                    {r.contact_email ? ` · ${r.contact_email}` : ""}
                  </p>
                </button>
              </li>
            ))}
          </ul>
        </Panel>
        <Panel title={current ? "Conversation" : undefined}>
          {current ? <ChatDetail key={current.id} row={current} /> : <EmptyState>Select a chat to read it.</EmptyState>}
        </Panel>
      </div>
    </AdminPage>
  );
}

function StatusBadge({ status }: { status: string }) {
  const tone =
    status === "resolved"
      ? "bg-muted text-muted-foreground"
      : status === "in_progress"
        ? "bg-secondary text-secondary-foreground"
        : "bg-destructive/10 text-destructive";
  return <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${tone}`}>{STATUS_LABEL[status] ?? status}</span>;
}

function ChatDetail({ row }: { row: SupportChatRow }) {
  const [note, setNote] = useState(row.admin_note ?? "");
  const update = useServerFn(updateSupportChatAdmin);
  const qc = useQueryClient();
  const mutation = useMutation({
    mutationFn: (status: "open" | "in_progress" | "resolved") =>
      update({ data: { id: row.id, status, adminNote: note } }),
    onSuccess: () => {
      toast.success("Complaint updated");
      qc.invalidateQueries({ queryKey: ["admin-support-chats"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Update failed"),
  });

  return (
    <div className="space-y-4">
      {row.is_complaint && (
        <div className="space-y-3 rounded-md border border-border bg-muted/40 p-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-semibold">Complaint</p>
            <StatusBadge status={row.status} />
          </div>
          <p className="text-sm">{row.complaint_summary}</p>
          {row.contact_email && (
            <a href={`mailto:${row.contact_email}`} className="text-sm text-primary underline">
              {row.contact_email}
            </a>
          )}
          <textarea
            aria-label="Admin note"
            placeholder="Internal note (not shown to the customer)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="min-h-16 w-full rounded-md border border-border bg-background p-2 text-sm"
          />
          <div className="flex flex-wrap gap-2">
            {(["open", "in_progress", "resolved"] as const).map((s) => (
              <Button
                key={s}
                size="sm"
                variant={row.status === s ? "default" : "outline"}
                disabled={mutation.isPending}
                onClick={() => mutation.mutate(s)}
              >
                {STATUS_LABEL[s]}
              </Button>
            ))}
          </div>
        </div>
      )}
      <div className="max-h-[60vh] space-y-3 overflow-y-auto">
        {row.messages.map((m, i) => (
          <div
            key={i}
            className={`whitespace-pre-wrap rounded-lg px-3 py-2 text-sm ${m.role === "user" ? "ml-8 bg-primary text-primary-foreground" : "mr-8 bg-muted"}`}
          >
            {m.text}
          </div>
        ))}
      </div>
    </div>
  );
}
