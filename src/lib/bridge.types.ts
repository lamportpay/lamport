/**
 * Shared Payout partner API types for customer, external account, and transfer flows.
 * These are intentionally lightweight and match the Bridge v0 API surface used
 * by LamportPay.
 */

export type BridgeCustomerType = "individual" | "business";

export interface BridgeCustomerRequest {
  type: BridgeCustomerType;
  first_name?: string;
  last_name?: string;
  email?: string;
  // Additional fields are omitted in the first demo integration.
}

export interface BridgeCustomerResponse {
  id: string;
  type: BridgeCustomerType;
  first_name?: string;
  last_name?: string;
  email?: string;
  status?: string;
}

export interface BridgeExternalAccountRequest {
  currency: string;
  // Supported rails: ach, iban, clabe, pix_key, pix_br_code, etc.
  // This is a simplified wrapper; real payloads differ per rail.
  account_number: string;
  routing_number?: string;
  bank_name?: string;
  account_holder_name?: string;
  account_holder_type?: "individual" | "business";
}

export interface BridgeExternalAccountResponse {
  id: string;
  currency: string;
  status?: string;
}

export interface BridgeTransferRequest {
  amount: string;
  on_behalf_of: string;
  source: {
    payment_rail: string;
    currency: string;
  };
  destination: {
    payment_rail: string;
    currency: string;
    external_account_id?: string;
    to_address?: string;
  };
  developer_fee?: string;
}

export interface BridgeTransferResponse {
  id: string;
  state: string;
  amount: string;
  source: Record<string, unknown>;
  destination: Record<string, unknown>;
  receipt?: {
    initial_amount: string;
    developer_fee: string;
    exchange_fee: string;
    final_amount: string;
    destination_tx_hash?: string | null;
  };
  source_deposit_instructions?: {
    amount: string;
    currency: string;
    deposit_address?: string;
  };
  created_at: string;
  updated_at: string;
}
