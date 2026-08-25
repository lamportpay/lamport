export const ADMIN_KYC_STATUSES = ["pending", "approved", "rejected"] as const;
export const ADMIN_QUOTE_STATUSES = ["draft", "active", "expired", "cancelled"] as const;
export const ADMIN_PAYMENT_STATUSES = [
  "awaiting_funds",
  "processing",
  "paid",
  "failed",
  "refunded",
] as const;

export type KycStatus = (typeof ADMIN_KYC_STATUSES)[number];
export type QuoteStatus = (typeof ADMIN_QUOTE_STATUSES)[number];
export type PaymentStatus = (typeof ADMIN_PAYMENT_STATUSES)[number];

export const KYC_COLUMNS =
  "id, reference, full_name, email, country, document_type, status, review_note, reviewed_at, created_at";
export const TRANSFER_COLUMNS =
  "id, reference, sender_name, recipient_name, send_amount, send_currency, payout_currency, payout_amount, fx_rate, total_fee, payment_rail, quote_status, payment_status, admin_note, updated_at";

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

export const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
  draft: "Draft",
  active: "Active",
  expired: "Expired",
  cancelled: "Cancelled",
  awaiting_funds: "Awaiting funds",
  processing: "Processing",
  paid: "Paid",
  failed: "Failed",
  refunded: "Refunded",
};
