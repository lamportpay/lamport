export const TOKENS = ["USDC", "SOL", "USDT", "JUP", "RAY", "PYTH", "BONK"] as const;
export type Token = (typeof TOKENS)[number];

export const TOKEN_USD: Record<Token, number> = {
  USDC: 1,
  USDT: 1,
  SOL: 165,
  JUP: 0.85,
  RAY: 2.4,
  PYTH: 0.42,
  BONK: 0.000025,
};

// Stables-supported payout currencies, per its public developer documentation.
// Rates are indicative demo values only and are not supplied by Stables.
export const CORRIDORS = [
  { country: "United Arab Emirates", currency: "AED", rate: 3.67, flag: "🇦🇪" },
  { country: "Argentina", currency: "ARS", rate: 1450, flag: "🇦🇷" },
  { country: "Australia", currency: "AUD", rate: 1.52, flag: "🇦🇺" },
  { country: "Brazil", currency: "BRL", rate: 5.5, flag: "🇧🇷" },
  { country: "China", currency: "CNY", rate: 7.12, flag: "🇨🇳" },
  { country: "Colombia", currency: "COP", rate: 4000, flag: "🇨🇴" },
  { country: "Euro area", currency: "EUR", rate: 0.92, flag: "🇪🇺" },
  { country: "United Kingdom", currency: "GBP", rate: 0.78, flag: "🇬🇧" },
  { country: "Ghana", currency: "GHS", rate: 15.5, flag: "🇬🇭" },
  { country: "Hong Kong", currency: "HKD", rate: 7.8, flag: "🇭🇰" },
  { country: "Indonesia", currency: "IDR", rate: 16300, flag: "🇮🇩" },
  { country: "India", currency: "INR", rate: 83, flag: "🇮🇳" },
  { country: "Kenya", currency: "KES", rate: 129, flag: "🇰🇪" },
  { country: "Mexico", currency: "MXN", rate: 18, flag: "🇲🇽" },
  { country: "Nigeria", currency: "NGN", rate: 1500, flag: "🇳🇬" },
  { country: "Philippines", currency: "PHP", rate: 58, flag: "🇵🇭" },
  { country: "Rwanda", currency: "RWF", rate: 1370, flag: "🇷🇼" },
  { country: "Singapore", currency: "SGD", rate: 1.35, flag: "🇸🇬" },
  { country: "Thailand", currency: "THB", rate: 35.8, flag: "🇹🇭" },
  { country: "Tanzania", currency: "TZS", rate: 2650, flag: "🇹🇿" },
  { country: "Uganda", currency: "UGX", rate: 3700, flag: "🇺🇬" },
  { country: "United States", currency: "USD", rate: 1, flag: "🇺🇸" },
  { country: "Vietnam", currency: "VND", rate: 25400, flag: "🇻🇳" },
  { country: "Central Africa", currency: "XAF", rate: 605, flag: "🌍" },
  { country: "West Africa", currency: "XOF", rate: 605, flag: "🌍" },
  { country: "South Africa", currency: "ZAR", rate: 18.2, flag: "🇿🇦" },
  { country: "Zambia", currency: "ZMW", rate: 27.5, flag: "🇿🇲" },
] as const;

export const PAYOUT_METHODS = ["Bank account", "Mobile wallet", "Card", "Cash pickup"] as const;
export const SENDER_CURRENCIES = ["AUD", "AED"] as const;

export function calcQuote(amount: number, token: Token, currency: string) {
  const usdValue = amount * (TOKEN_USD[token] ?? 1);
  const corridor = CORRIDORS.find((c) => c.currency === currency) ?? CORRIDORS[0];
  const payoutFee = Math.max(1, usdValue * 0.01);
  const platformFee = usdValue * 0.005;
  const totalFee = payoutFee + platformFee;
  const netUsdc = Math.max(0, usdValue - totalFee);
  const recipientAmount = netUsdc * corridor.rate;
  return {
    usdValue,
    usdcSettlement: usdValue,
    fxRate: corridor.rate,
    payoutFee,
    platformFee,
    totalFee,
    recipientAmount,
    corridor,
  };
}

export function fmt(n: number, digits = 2) {
  return n.toLocaleString(undefined, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

export function mockSolanaHash() {
  const chars = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
  return Array.from({ length: 88 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

export function mockPayoutRef() {
  return "brg_" + Math.random().toString(36).slice(2, 12) + Math.random().toString(36).slice(2, 6);
}

export function mockPaymentId() {
  return "pay_" + Math.random().toString(36).slice(2, 14);
}
