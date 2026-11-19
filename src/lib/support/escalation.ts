/**
 * Complaints to Stables and back (owner request 19 Nov 2026). Stables has no support-ticket API,
 * so the admin sends the prepared message to Stables (email, or the team's WhatsApp group),
 * records Stables' reply in the admin, and publishes an answer the customer then sees in the app.
 * Pure (no I/O): used by the admin page, the server functions and the customer views.
 *
 * Contacts are Stables' own published ones (docs.stables.money "Getting help"; Complaints Policy
 * on stables.money): operational support at team@stables.money, formal complaints to
 * compliance@stables.money.
 */

export const STABLES_SUPPORT_EMAIL = "team@stables.money";
export const STABLES_COMPLAINTS_EMAIL = "compliance@stables.money";

export const MAX_STABLES_MESSAGE = 5000;
export const MAX_STABLES_REPLY = 10_000;
export const MAX_CUSTOMER_ANSWER = 5000;

/** Where a complaint stands, from the admin's records only. */
export type EscalationStage =
  | "not_escalated"
  | "waiting_for_stables"
  | "stables_answered"
  | "answer_published";

export const STAGE_LABEL: Record<EscalationStage, string> = {
  not_escalated: "Not sent to Stables",
  waiting_for_stables: "Waiting for Stables",
  stables_answered: "Stables answered",
  answer_published: "Answer shown to the customer",
};

export type EscalationFields = {
  stables_status: string | null;
  customer_answer_published_at: string | null;
};

export function escalationStage(row: EscalationFields): EscalationStage {
  if (row.customer_answer_published_at) return "answer_published";
  if (row.stables_status === "stables_answered") return "stables_answered";
  if (row.stables_status === "waiting_for_stables") return "waiting_for_stables";
  return "not_escalated";
}

/** Short, stable reference quoted to Stables and shown to the customer: "LP-1A2B3C4D". */
export function requestReference(id: string): string {
  return `LP-${id.replace(/-/g, "").slice(0, 8).toUpperCase()}`;
}

export type PaymentContext = {
  id: string;
  transfer_id: string | null;
  status: string;
  created_at: string;
  destination_currency: string | null;
};

/**
 * The message for Stables: our reference, the payment and its Stables transfer, and the
 * customer's complaint. No contact details: Stables answers us, and we answer the customer.
 */
export function stablesMessage(input: {
  reference: string;
  summary: string | null;
  payment: PaymentContext | null;
}): string {
  const lines = [
    `LamportPay support request ${input.reference}`,
    "",
    "A customer has raised the issue below. Please check it on your side and reply to this message with what happened and what you will do.",
    "",
  ];
  if (input.payment) {
    const p = input.payment;
    lines.push(
      `Stables transfer ID: ${p.transfer_id ?? "(no transfer created)"}`,
      `LamportPay payment ID: ${p.id}`,
      `Payment status at LamportPay: ${p.status}`,
      `Payment created: ${new Date(p.created_at).toISOString()}`,
    );
    if (p.destination_currency) lines.push(`Payout currency: ${p.destination_currency.toUpperCase()}`);
    lines.push("");
  }
  lines.push("Customer's description:", (input.summary ?? "").trim() || "(no description)", "");
  lines.push("Thank you,", "LamportPay operations");
  return lines.join("\n").slice(0, MAX_STABLES_MESSAGE);
}

/** A mailto link that opens the admin's own email app with the message filled in. */
export function stablesMailto(reference: string, message: string): string {
  const params = new URLSearchParams({
    subject: `LamportPay support request ${reference}`,
    body: message,
  });
  // URLSearchParams encodes spaces as "+", which mail apps show literally.
  return `mailto:${STABLES_SUPPORT_EMAIL}?${params.toString().replace(/\+/g, "%20")}`;
}
