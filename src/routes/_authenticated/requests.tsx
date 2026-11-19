import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ChevronRight, LifeBuoy } from "lucide-react";

import { AppLayout } from "@/components/app/AppLayout";
import { getMySupportRequests } from "@/lib/support-requests.functions";
import type { CustomerRequest, CustomerRequestStage } from "@/lib/support/customer-requests";

export const Route = createFileRoute("/_authenticated/requests")({
  head: () => ({
    meta: [
      { title: "My requests | LamportPay" },
      { name: "description", content: "Your support requests to LamportPay and our answers." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: RequestsPage,
});

const STAGE: Record<CustomerRequestStage, { label: string; tone: string }> = {
  received: { label: "Received", tone: "bg-secondary text-secondary-foreground" },
  with_partner: {
    label: "Checking with our payout partner",
    tone: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
  },
  answered: { label: "Answered", tone: "bg-success/10 text-success" },
};

function RequestCard({ request }: { request: CustomerRequest }) {
  const stage = STAGE[request.stage];
  return (
    <li className="space-y-3 rounded-2xl border border-border/60 bg-card p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="text-sm font-semibold">{request.reference}</div>
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${stage.tone}`}>{stage.label}</span>
      </div>
      <p className="text-xs text-muted-foreground">{new Date(request.createdAt).toLocaleString()}</p>
      {request.summary && <p className="whitespace-pre-wrap break-words text-sm">{request.summary}</p>}
      {request.answer ? (
        <div className="rounded-xl border border-primary/30 bg-primary/5 p-3">
          <p className="text-xs font-semibold text-primary">Our answer</p>
          <p className="mt-1 whitespace-pre-wrap break-words text-sm">{request.answer}</p>
          {request.answeredAt && (
            <p className="mt-1 text-[11px] text-muted-foreground">
              {new Date(request.answeredAt).toLocaleString()}
            </p>
          )}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          {request.stage === "with_partner"
            ? "We have passed this to our payout partner and will post their answer here."
            : "We have your request and will answer here."}
        </p>
      )}
      {request.paymentId && (
        <Link
          to="/payments/$id"
          params={{ id: request.paymentId }}
          className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
        >
          View the payment <ChevronRight className="h-4 w-4" />
        </Link>
      )}
    </li>
  );
}

function RequestsPage() {
  const fetchRequests = useServerFn(getMySupportRequests);
  const query = useQuery({
    queryKey: ["my-support-requests"],
    queryFn: () => fetchRequests(),
    refetchInterval: 60_000,
  });
  const requests = query.data ?? [];

  return (
    <AppLayout>
      <div className="mx-auto max-w-3xl space-y-4 px-4 py-6 sm:space-y-6 sm:py-10">
        <div className="flex items-center gap-3">
          <LifeBuoy className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">My requests</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Problems you reported to LamportPay while signed in, and our answers. To report a new
          one, use Ask Lammy on our website or the contact page.
        </p>
        {query.isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
        {query.isError && (
          <p className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            Could not load your requests. Please try again.
          </p>
        )}
        {query.data && requests.length === 0 && (
          <div className="rounded-2xl border border-border/60 bg-card p-5 text-sm text-muted-foreground">
            No requests yet.{" "}
            <Link to="/contact" className="font-medium text-primary hover:underline">
              Contact us
            </Link>{" "}
            if something is wrong with a payment.
          </div>
        )}
        {requests.length > 0 && (
          <ul className="space-y-3">
            {requests.map((r) => (
              <RequestCard key={r.reference} request={r} />
            ))}
          </ul>
        )}
      </div>
    </AppLayout>
  );
}
