/**
 * Maps LamportPay demo corridors and payout methods to Bridge payment rails.
 * These mappings are approximate and will need to be updated as Bridge
 * expands corridor coverage.
 */

export const BRIDGE_PAYMENT_RAILS: Record<string, string> = {
  USD: "ach",
  EUR: "iban",
  GBP: "iban",
  MXN: "clabe",
  BRL: "pix_key",
  COP: "co_bank_transfer",
  INR: "iban", // Bridge may support local rails; fallback to iban for demo.
  PHP: "iban", // Fallback for demo.
  NGN: "iban", // Fallback for demo.
  PKR: "iban", // Fallback for demo.
  BDT: "iban", // Fallback for demo.
  EGP: "iban", // Fallback for demo.
  PEN: "iban", // Fallback for demo.
  CAD: "ach",
  AUD: "ach",
  AED: "iban",
};

export const BRIDGE_PAYOUT_RAIL_BY_METHOD: Record<string, string> = {
  "Bank account": "ach",
  "Mobile wallet": "mobile_wallet",
  Card: "card",
  "Cash pickup": "cash_pickup",
};

export function getBridgePaymentRail(currency: string, method?: string): string {
  if (method && BRIDGE_PAYOUT_RAIL_BY_METHOD[method]) {
    return BRIDGE_PAYOUT_RAIL_BY_METHOD[method];
  }
  return BRIDGE_PAYMENT_RAILS[currency] || "ach";
}

export function bridgeCurrency(currency: string): string {
  return currency.toLowerCase();
}
