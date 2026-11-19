/**
 * Admin → Complaints & chats → a complaint's way to Stables and back (owner request 19 Nov 2026).
 * Stables has no support-ticket API, so the admin sends the prepared message themselves (email or
 * the team's Stables WhatsApp group), records Stables' reply here, then publishes an answer the
 * customer sees in the app. Every step is audit logged by the server.
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Copy, Mail, Send } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  escalateSupportChatAdmin,
  getSupportPaymentContextAdmin,
  type EscalationInput,
  type SupportChatRow,
} from "@/lib/support-chats.functions";
import {
  escalationStage,
  MAX_CUSTOMER_ANSWER,
  MAX_STABLES_MESSAGE,
  MAX_STABLES_REPLY,
  requestReference,
  STABLES_COMPLAINTS_EMAIL,
  STABLES_SUPPORT_EMAIL,
  stablesMailto,
  stablesMessage,
  STAGE_LABEL,
} from "@/lib/support/escalation";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const area =
  "w-full rounded-md border border-border bg-background p-2 text-sm disabled:opacity-60";

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2 border-t border-border pt-3 first:border-t-0 first:pt-0">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {n}. {title}
      </p>
      {children}
    </div>
  );
}

function when(iso: string | null) {
  return iso ? new Date(iso).toLocaleString() : "";
}

export function StablesEscalationPanel({ row }: { row: SupportChatRow }) {
  const reference = requestReference(row.id);
  const stage = escalationStage(row);
  const qc = useQueryClient();
  const escalate = useServerFn(escalateSupportChatAdmin);
  const fetchPayment = useServerFn(getSupportPaymentContextAdmin);

  const payment = useQuery({
    queryKey: ["admin-support-payment", row.payment_id],
    queryFn: () => fetchPayment({ data: { paymentId: row.payment_id as string } }),
    enabled: Boolean(row.payment_id),
  });

  const [paymentId, setPaymentId] = useState(row.payment_id ?? "");
  const built = stablesMessage({
    reference,
    summary: row.complaint_summary ?? row.last_question,
    payment: payment.data ?? null,
  });
  const [message, setMessage] = useState(row.stables_message ?? "");
  const [stablesRef, setStablesRef] = useState(row.stables_reference ?? "");
  const [reply, setReply] = useState(row.stables_reply ?? "");
  const [answer, setAnswer] = useState(row.customer_answer ?? "");
  const shownMessage = message || built;

  const step = useMutation({
    mutationFn: (input: EscalationInput) => escalate({ data: input }),
    onSuccess: (_result, input) => {
      const done: Record<string, string> = {
        link_payment: "Payment linked",
        mark_sent: "Marked as sent to Stables",
        record_reply: "Stables' reply saved",
        publish_answer: "Answer published to the customer",
        unpublish_answer: "Answer withdrawn",
      };
      toast.success(done[input.action] ?? "Saved");
      qc.invalidateQueries({ queryKey: ["admin-support-chats"] });
      qc.invalidateQueries({ queryKey: ["admin-support-payment"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not save."),
  });

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(shownMessage);
      toast.success("Message copied");
    } catch {
      toast.error("Could not copy. Select the text and copy it.");
    }
  };

  return (
    <div className="space-y-3 rounded-md border border-border bg-muted/40 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-semibold">Stables · {reference}</p>
        <span className="rounded-full bg-secondary px-2 py-0.5 text-[11px] font-medium text-secondary-foreground">
          {STAGE_LABEL[stage]}
        </span>
      </div>

      <Step n={1} title="Payment (optional)">
        <div className="flex gap-2">
          <input
            aria-label="Payment ID"
            placeholder="Payment ID from Admin → Payments"
            value={paymentId}
            onChange={(e) => setPaymentId(e.target.value.trim())}
            className="min-w-0 flex-1 rounded-md border border-border bg-background px-2 py-1.5 text-sm"
          />
          <Button
            size="sm"
            variant="outline"
            disabled={step.isPending || (paymentId !== "" && !UUID.test(paymentId)) || paymentId === (row.payment_id ?? "")}
            onClick={() => step.mutate({ action: "link_payment", id: row.id, paymentId: paymentId || null })}
          >
            {paymentId ? "Link" : "Unlink"}
          </Button>
        </div>
        {payment.data && (
          <p className="text-xs text-muted-foreground">
            Linked: {payment.data.status}, Stables transfer {payment.data.transfer_id ?? "not created"}
          </p>
        )}
      </Step>

      <Step n={2} title="Send to Stables">
        <p className="text-xs text-muted-foreground">
          Stables has no ticket system we can connect to. Send this by email to {STABLES_SUPPORT_EMAIL}{" "}
          or in your Stables WhatsApp group, then mark it as sent. Formal complaints go to{" "}
          {STABLES_COMPLAINTS_EMAIL}.
        </p>
        <textarea
          aria-label="Message for Stables"
          value={shownMessage}
          maxLength={MAX_STABLES_MESSAGE}
          onChange={(e) => setMessage(e.target.value)}
          className={`${area} min-h-40 font-mono text-xs`}
        />
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={() => void copy()}>
            <Copy /> Copy message
          </Button>
          <Button asChild size="sm" variant="outline">
            <a href={stablesMailto(reference, shownMessage)}>
              <Mail /> Open email to Stables
            </a>
          </Button>
          {message && message !== built && (
            <Button size="sm" variant="ghost" onClick={() => setMessage("")}>
              Rebuild message
            </Button>
          )}
        </div>
        <input
          aria-label="Stables reference"
          placeholder="Stables' ticket or thread reference (optional)"
          value={stablesRef}
          maxLength={200}
          onChange={(e) => setStablesRef(e.target.value)}
          className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm"
        />
        <Button
          size="sm"
          disabled={step.isPending}
          onClick={() =>
            step.mutate({
              action: "mark_sent",
              id: row.id,
              message: shownMessage,
              reference: stablesRef.trim() || undefined,
            })
          }
        >
          <Send /> {row.stables_sent_at ? "Update: sent again" : "Mark as sent to Stables"}
        </Button>
        {row.stables_sent_at && (
          <p className="text-xs text-muted-foreground">
            Sent {when(row.stables_sent_at)}
            {row.stables_reference ? ` · Stables reference ${row.stables_reference}` : ""}
          </p>
        )}
      </Step>

      <Step n={3} title="Stables' reply">
        <textarea
          aria-label="Stables' reply"
          placeholder="Paste Stables' answer here. Customers never see this text."
          value={reply}
          maxLength={MAX_STABLES_REPLY}
          disabled={!row.stables_status}
          onChange={(e) => setReply(e.target.value)}
          className={`${area} min-h-24`}
        />
        <Button
          size="sm"
          variant="outline"
          disabled={step.isPending || !row.stables_status || !reply.trim()}
          onClick={() => step.mutate({ action: "record_reply", id: row.id, reply })}
        >
          Save Stables' reply
        </Button>
        {row.stables_replied_at && (
          <p className="text-xs text-muted-foreground">Saved {when(row.stables_replied_at)}</p>
        )}
      </Step>

      <Step n={4} title="Answer for the customer">
        <textarea
          aria-label="Answer for the customer"
          placeholder="What the customer will read. Write it for them; don't paste internal details."
          value={answer}
          maxLength={MAX_CUSTOMER_ANSWER}
          onChange={(e) => setAnswer(e.target.value)}
          className={`${area} min-h-24`}
        />
        <div className="flex flex-wrap gap-2">
          {row.stables_reply && !answer && (
            <Button size="sm" variant="ghost" onClick={() => setAnswer(row.stables_reply ?? "")}>
              Start from Stables' reply
            </Button>
          )}
          <Button
            size="sm"
            disabled={step.isPending || !answer.trim()}
            onClick={() => step.mutate({ action: "publish_answer", id: row.id, answer })}
          >
            {row.customer_answer_published_at ? "Update the published answer" : "Publish to the customer"}
          </Button>
          {row.customer_answer_published_at && (
            <Button
              size="sm"
              variant="outline"
              disabled={step.isPending}
              onClick={() => step.mutate({ action: "unpublish_answer", id: row.id })}
            >
              Withdraw
            </Button>
          )}
          {row.contact_email && answer.trim() && (
            <Button asChild size="sm" variant="ghost">
              <a
                href={`mailto:${row.contact_email}?subject=${encodeURIComponent(`Your LamportPay request ${reference}`)}&body=${encodeURIComponent(answer)}`}
              >
                <Mail /> Email it to the customer
              </a>
            </Button>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          {row.customer_answer_published_at
            ? `Shown to the customer since ${when(row.customer_answer_published_at)}.`
            : "Once published, the customer sees it in the support chat on their next visit from the same browser"}
          {row.customer_answer_published_at
            ? ""
            : row.user_id
              ? " and on their My requests page."
              : ". They were not signed in, so there is no My requests page for this one; email them if they left an address."}
        </p>
      </Step>
    </div>
  );
}
