import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const KYC_STATUSES = ["pending", "approved", "rejected"] as const;
const QUOTE_STATUSES = ["draft", "active", "expired", "cancelled"] as const;
const PAYMENT_STATUSES = [
  "awaiting_funds",
  "processing",
  "paid",
  "failed",
  "refunded",
] as const;

export type KycStatus = (typeof KYC_STATUSES)[number];
export type QuoteStatus = (typeof QUOTE_STATUSES)[number];
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export type AdminKycRow = {
  id: string;
  reference: string;
  full_name: string;
  email: string;
  country: string;
  document_type: string;
  status: KycStatus;
  review_note: string | null;
  reviewed_at: string | null;
  created_at: string;
};

export type AdminTransferRow = {
  id: string;
  reference: string;
  sender_name: string;
  recipient_name: string;
  send_amount: number;
  send_currency: string;
  payout_currency: string;
  payout_amount: number;
  fx_rate: number;
  total_fee: number;
  payment_rail: string;
  quote_status: QuoteStatus;
  payment_status: PaymentStatus;
  admin_note: string | null;
  updated_at: string;
};

const KYC_COLUMNS =
  "id, reference, full_name, email, country, document_type, status, review_note, reviewed_at, created_at";
const TRANSFER_COLUMNS =
  "id, reference, sender_name, recipient_name, send_amount, send_currency, payout_currency, payout_amount, fx_rate, total_fee, payment_rail, quote_status, payment_status, admin_note, updated_at";

export const getAdminOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;

    const { data: isAdmin, error: roleError } = await supabase.rpc("has_role", {
      _user_id: userId,
      _role: "admin",
    });
    if (roleError) throw new Error("Could not verify admin access.");
    if (!isAdmin) {
      return { isAdmin: false as const, kyc: [], transfers: [] };
    }

    const [kycResult, transferResult] = await Promise.all([
      supabase
        .from("mock_kyc_submissions")
        .select(KYC_COLUMNS)
        .order("created_at", { ascending: false }),
      supabase
        .from("mock_payout_transfers")
        .select(TRANSFER_COLUMNS)
        .order("created_at", { ascending: false }),
    ]);

    if (kycResult.error) throw new Error(kycResult.error.message);
    if (transferResult.error) throw new Error(transferResult.error.message);

    return {
      isAdmin: true as const,
      kyc: (kycResult.data ?? []) as AdminKycRow[],
      transfers: (transferResult.data ?? []) as AdminTransferRow[],
    };
  });

export const reviewKycSubmission = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        status: z.enum(KYC_STATUSES),
        reviewNote: z.string().max(500).optional(),
      })
      .strict()
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: updated, error } = await supabase
      .from("mock_kyc_submissions")
      .update({
        status: data.status,
        review_note: data.reviewNote?.trim() ? data.reviewNote.trim() : null,
        reviewed_by: userId,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", data.id)
      .select(KYC_COLUMNS)
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (!updated) throw new Error("Submission not found or access denied.");
    return updated as AdminKycRow;
  });

export const updateTransferStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        quoteStatus: z.enum(QUOTE_STATUSES).optional(),
        paymentStatus: z.enum(PAYMENT_STATUSES).optional(),
        adminNote: z.string().max(500).optional(),
      })
      .strict()
      .refine(
        (value) =>
          value.quoteStatus !== undefined ||
          value.paymentStatus !== undefined ||
          value.adminNote !== undefined,
        { message: "Nothing to update." },
      )
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const patch: Record<string, unknown> = { updated_by: userId };
    if (data.quoteStatus) patch["quote_status"] = data.quoteStatus;
    if (data.paymentStatus) patch["payment_status"] = data.paymentStatus;
    if (data.adminNote !== undefined) {
      patch["admin_note"] = data.adminNote.trim() ? data.adminNote.trim() : null;
    }

    const { data: updated, error } = await supabase
      .from("mock_payout_transfers")
      .update(patch)
      .eq("id", data.id)
      .select(TRANSFER_COLUMNS)
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (!updated) throw new Error("Transfer not found or access denied.");
    return updated as AdminTransferRow;
  });

export const ADMIN_KYC_STATUSES = KYC_STATUSES;
export const ADMIN_QUOTE_STATUSES = QUOTE_STATUSES;
export const ADMIN_PAYMENT_STATUSES = PAYMENT_STATUSES;
