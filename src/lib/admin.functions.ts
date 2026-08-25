import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  ADMIN_KYC_STATUSES,
  ADMIN_PAYMENT_STATUSES,
  ADMIN_QUOTE_STATUSES,
  KYC_COLUMNS,
  TRANSFER_COLUMNS,
  type AdminKycRow,
  type AdminTransferRow,
} from "./admin.constants";

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
      return {
        isAdmin: false,
        kyc: [] as AdminKycRow[],
        transfers: [] as AdminTransferRow[],
      };
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
      isAdmin: true,
      kyc: (kycResult.data ?? []) as unknown as AdminKycRow[],
      transfers: (transferResult.data ?? []) as unknown as AdminTransferRow[],
    };
  });

export const reviewKycSubmission = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        status: z.enum(ADMIN_KYC_STATUSES),
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
    return updated as unknown as AdminKycRow;
  });

export const updateTransferStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        quoteStatus: z.enum(ADMIN_QUOTE_STATUSES).optional(),
        paymentStatus: z.enum(ADMIN_PAYMENT_STATUSES).optional(),
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

    const patch: {
      updated_by: string;
      quote_status?: QuoteStatus;
      payment_status?: PaymentStatus;
      admin_note?: string | null;
    } = { updated_by: userId };
    if (data.quoteStatus) patch.quote_status = data.quoteStatus;
    if (data.paymentStatus) patch.payment_status = data.paymentStatus;
    if (data.adminNote !== undefined) {
      patch.admin_note = data.adminNote.trim() ? data.adminNote.trim() : null;
    }

    const { data: updated, error } = await supabase
      .from("mock_payout_transfers")
      .update(patch)
      .eq("id", data.id)
      .select(TRANSFER_COLUMNS)
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (!updated) throw new Error("Transfer not found or access denied.");
    return updated as unknown as AdminTransferRow;
  });
