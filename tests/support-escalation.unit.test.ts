import { describe, expect, it } from "vitest";

import { toCustomerRequest } from "../src/lib/support/customer-requests";
import {
  escalationStage,
  requestReference,
  STABLES_SUPPORT_EMAIL,
  stablesMailto,
  stablesMessage,
} from "../src/lib/support/escalation";

const ID = "1a2b3c4d-5e6f-4a1b-8c2d-3e4f5a6b7c8d";
const PAYMENT = {
  id: "6a6cd3eb-0ef5-46f1-84f2-08e0e8bb97bb",
  transfer_id: "tr_123",
  status: "IN_PROGRESS",
  created_at: "2026-10-07T02:30:20Z",
  destination_currency: "brl",
};

const row = (over: Record<string, unknown> = {}) => ({
  id: ID,
  created_at: "2026-11-19T00:00:00Z",
  complaint_summary: "My payout has not arrived",
  last_question: "where is my money",
  payment_id: null,
  stables_status: null,
  customer_answer: null,
  customer_answer_published_at: null,
  ...over,
});

describe("complaint escalation to Stables", () => {
  it("gives every request a short reference", () => {
    expect(requestReference(ID)).toBe("LP-1A2B3C4D");
  });

  it("follows the request from received to answered", () => {
    expect(escalationStage(row())).toBe("not_escalated");
    expect(escalationStage(row({ stables_status: "waiting_for_stables" }))).toBe("waiting_for_stables");
    expect(escalationStage(row({ stables_status: "stables_answered" }))).toBe("stables_answered");
    expect(
      escalationStage(row({ stables_status: "stables_answered", customer_answer_published_at: "2026-11-19T01:00:00Z" })),
    ).toBe("answer_published");
  });

  it("writes the message for Stables with the IDs they need and no contact details", () => {
    const text = stablesMessage({ reference: "LP-1A2B3C4D", summary: "My payout has not arrived", payment: PAYMENT });
    expect(text).toContain("LamportPay support request LP-1A2B3C4D");
    expect(text).toContain("Stables transfer ID: tr_123");
    expect(text).toContain(`LamportPay payment ID: ${PAYMENT.id}`);
    expect(text).toContain("Payout currency: BRL");
    expect(text).toContain("My payout has not arrived");
    expect(text).not.toMatch(/@/);
  });

  it("still writes a message when no payment is linked", () => {
    const text = stablesMessage({ reference: "LP-1A2B3C4D", summary: null, payment: null });
    expect(text).not.toContain("Stables transfer ID");
    expect(text).toContain("(no description)");
  });

  it("opens the admin's email app addressed to Stables support", () => {
    const href = stablesMailto("LP-1A2B3C4D", "Line one\nLine two");
    expect(href.startsWith(`mailto:${STABLES_SUPPORT_EMAIL}?`)).toBe(true);
    expect(href).not.toContain("+");
    const params = new URLSearchParams(href.split("?")[1]);
    expect(params.get("subject")).toBe("LamportPay support request LP-1A2B3C4D");
    expect(params.get("body")).toBe("Line one\nLine two");
  });
});

describe("what the customer sees", () => {
  it("shows a received request without any answer", () => {
    expect(toCustomerRequest(row())).toMatchObject({
      reference: "LP-1A2B3C4D",
      stage: "received",
      answer: null,
      answeredAt: null,
      summary: "My payout has not arrived",
    });
  });

  it("says the payout partner is checking, but never shows an unpublished answer", () => {
    const view = toCustomerRequest(
      row({ stables_status: "stables_answered", customer_answer: "Draft answer", payment_id: PAYMENT.id }),
    );
    expect(view.stage).toBe("with_partner");
    expect(view.answer).toBeNull();
    expect(view.paymentId).toBe(PAYMENT.id);
  });

  it("shows the published answer, and nothing from Stables' own reply", () => {
    const view = toCustomerRequest({
      ...row({
        stables_status: "stables_answered",
        customer_answer: "Your payout was sent today.",
        customer_answer_published_at: "2026-11-19T01:00:00Z",
      }),
      stables_reply: "internal partner text",
      stables_message: "internal message",
    } as ReturnType<typeof row>);
    expect(view).toMatchObject({ stage: "answered", answer: "Your payout was sent today." });
    expect(JSON.stringify(view)).not.toContain("internal");
  });
});
