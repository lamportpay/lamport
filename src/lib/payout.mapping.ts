/** Maps Stables-supported payout currencies to the demo rail labels. */
export const PAYOUT_PAYMENT_RAILS: Record<string, string> = {
  AED: "local", ARS: "local", AUD: "local", BRL: "local", CNY: "local",
  COP: "local", EUR: "local", GBP: "local", GHS: "local", HKD: "swift",
  IDR: "local", INR: "local", KES: "local", MXN: "local", NGN: "local",
  PHP: "local", RWF: "local", SGD: "swift", THB: "local", TZS: "local",
  UGX: "local", USD: "local", VND: "local", XAF: "local", XOF: "local",
  ZAR: "local", ZMW: "local",
};

export const PAYOUT_RAIL_BY_METHOD: Record<string, string> = {
  "Bank account": "local",
  "Mobile wallet": "mobile_wallet",
  Card: "card",
  "Cash pickup": "cash_pickup",
};

export function getPayoutPaymentRail(currency: string, method?: string): string {
  if (method && PAYOUT_RAIL_BY_METHOD[method]) return PAYOUT_RAIL_BY_METHOD[method];
  return PAYOUT_PAYMENT_RAILS[currency] || "local";
}

export function payoutCurrency(currency: string): string {
  return currency.toLowerCase();
}
