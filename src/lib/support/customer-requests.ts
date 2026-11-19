/**
 * What a customer may see of their own support request (19 Nov 2026): the reference, what they
 * wrote, where it stands and the answer the team published. Never the internal note, the message
 * sent to the payout partner or the partner's own reply. Pure: used by the server and the page.
 */
import { escalationStage, requestReference } from "./escalation";

export type CustomerRequestStage = "received" | "with_partner" | "answered";

export type CustomerRequest = {
  reference: string;
  createdAt: string;
  summary: string;
  stage: CustomerRequestStage;
  answer: string | null;
  answeredAt: string | null;
  paymentId: string | null;
};

type Row = {
  id: string;
  created_at: string;
  complaint_summary: string | null;
  last_question: string | null;
  payment_id: string | null;
  stables_status: string | null;
  customer_answer: string | null;
  customer_answer_published_at: string | null;
};

export const CUSTOMER_COLUMNS =
  "id, created_at, complaint_summary, last_question, payment_id, stables_status, customer_answer, customer_answer_published_at" as const;

export function toCustomerRequest(row: Row): CustomerRequest {
  const stage = escalationStage(row);
  const published = stage === "answer_published";
  return {
    reference: requestReference(row.id),
    createdAt: row.created_at,
    summary: (row.complaint_summary || row.last_question || "").slice(0, 500),
    stage: published ? "answered" : stage === "not_escalated" ? "received" : "with_partner",
    answer: published ? row.customer_answer : null,
    answeredAt: published ? row.customer_answer_published_at : null,
    paymentId: row.payment_id,
  };
}
