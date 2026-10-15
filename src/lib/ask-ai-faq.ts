/**
 * Free, built-in Ask AI answers (no AI model, no credits). Answers come from
 * LamportPay's business model and the site's shared content.
 */
import { PAYMENT_SAFETY } from "@/content/payment-flow";

export type Faq = { id: string; question: string; keywords: RegExp; answer: string };

export const COMPLAINT_RE =
  /complain|complaint|stuck|not (received|arrived|working)|didn'?t (get|receive|arrive)|problem|issue|error|fail|failed|refund|lost|missing|scam|wrong|help me|contact (me|team)|shikayat|masla|pareshan/i;

export const FAQS: Faq[] = [
  {
    id: "how",
    question: "How do payments work?",
    keywords: /how|work|step|process|send|start|use/i,
    answer:
      "**8 simple steps:**\n1. Connect your Solana wallet\n2. Choose amount and destination country\n3. See a live quote\n4. Enter and check bank details\n5. Verify identity (only first time, on our partner's secure page)\n6. Review everything\n7. Approve in your wallet\n8. Track processing until complete\n\n" +
      PAYMENT_SAFETY,
  },
  {
    id: "fees",
    question: "What are the fees?",
    keywords: /fee|cost|charge|price|expensive|cheap|commission|percent|%/i,
    answer:
      "LamportPay charges **one fee: 2% of the total you send**, taken out of it — no hidden charges.\n\nExample: send **150 USDC** → 3 USDC LamportPay fee → 147 USDC goes to the payout partner.\n\nSeparately shown in your quote: the payout partner's fee (Stables), any Jupiter swap cost if paying in SOL, and a tiny Solana network fee.",
  },
  {
    id: "countries",
    question: "Which banks and countries are supported?",
    keywords: /bank|country|countries|destination|where|india|pakistan|nigeria|uk|usa|philippines|currency|inr|gbp|usd|php/i,
    answer:
      "**Available in sandbox:** United States, United Kingdom, India and Philippines.\n**Planned:** Nigeria and Pakistan.\n\nBank options depend on the country and currency, and our payout partner confirms final availability. Real bank payouts start only after production approval.",
  },
  {
    id: "safe",
    question: "Is my wallet safe?",
    keywords: /safe|secure|security|wallet|key|seed|custod|trust|hack/i,
    answer:
      "Yes. LamportPay is **non-custodial** — your funds and keys stay in your own wallet and we never hold balances.\n\nSign-in is a plain-text message signature, never a payment. **Never share your seed phrase or private key** with anyone, including us.",
  },
  {
    id: "kyc",
    question: "Do I need verification (KYC)?",
    keywords: /kyc|verif|identity|document|passport|id card/i,
    answer:
      "Yes, once. Verification runs on our licensed partner **Stables'** secure hosted page. LamportPay only stores a link and a status — never your documents. After your first completed payment your wallet stays verified. In the sandbox, verification is simulated.",
  },
  {
    id: "live",
    question: "Is LamportPay live?",
    keywords: /live|launch|real|production|when|available|ready|mainnet/i,
    answer:
      "Not yet. LamportPay currently runs in **sandbox on Solana devnet**: quotes are real, but no real money moves and bank payouts are simulated. Live bank payouts launch after production approval — see our Roadmap page.",
  },
  {
    id: "coins",
    question: "Which coins can I pay with?",
    keywords: /sol\b|solana|usdc|usdt|swap|jupiter|crypto|coin|token|bitcoin|eth/i,
    answer:
      "Pay with **USDC on Solana**, or with **SOL** — Jupiter gives a live quote and converts SOL to USDC in the same flow. More cryptocurrencies and chains are planned on the roadmap.",
  },
  {
    id: "partners",
    question: "Who are your partners?",
    keywords: /partner|stables|hyperliquid|circle|tether|yellow card|backed|invest/i,
    answer:
      "- **Stables** — licensed payout & verification partner (sandbox)\n- **Jupiter** — Solana swap quotes\n- **Hyperliquid** — integration in progress\n- **Circle, Tether, Yellow Card** — planned / in discussion, not confirmed\n\nSee the Partners page for details.",
  },
  {
    id: "time",
    question: "How long does a payout take?",
    keywords: /long|time|fast|minute|hour|day|speed|delay|quick/i,
    answer:
      "The crypto side settles in seconds on Solana. Bank delivery depends on the country and bank — the quote shows an estimate. In the sandbox, payouts are simulated.",
  },
  {
    id: "limits",
    question: "What are the limits?",
    keywords: /limit|minimum|maximum|min|max|how much/i,
    answer:
      "The minimum is **15 USDC** per payment. In the sandbox the maximum is 5,000 USDC; in production the payout partner's limits apply.",
  },
  {
    id: "business",
    question: "How does LamportPay make money?",
    keywords: /business|model|revenue|earn|money make|b2b|api|company/i,
    answer:
      "LamportPay earns a **single 2% fee** on each payment. A B2B payout API for businesses and remittance partners is planned; we don't offer public APIs today.",
  },
  {
    id: "team",
    question: "Who is behind LamportPay?",
    keywords: /team|founder|ceo|cto|who (are|is|made|built)|owner|people/i,
    answer:
      "LamportPay (Lamport Pay Ltd) is led by **Zoaib Ali** (Founder & CEO) and **Ghazanfar Abbas** (CTO & Lead Developer), with advisors and community team. Meet everyone on the Our people page.",
  },
];

export const SUGGESTED = ["how", "fees", "countries", "safe", "kyc", "live"];

const COMPLAINT_REPLY =
  "Sorry to hear that. I've **sent this to the LamportPay team** — they'll review it in their dashboard.\n\nIf you'd like a reply, type your **email address** here. Please don't share bank passwords, private keys or seed phrases.";

const EMAIL_REPLY = "Thanks — the team has your email and will get back to you.";

const FALLBACK =
  "I can help with **payment steps, fees, countries, verification, wallet safety, partners and the roadmap** — try one of the questions below. For anything account-specific, email hello@lamportpay.com or use the Contact page.";

export function answerFaq(text: string): { answer: string; complaint: boolean } {
  if (/[^@\s]+@[^@\s]+\.[^@\s]+/.test(text) && text.length < 120)
    return { answer: EMAIL_REPLY, complaint: false };
  if (COMPLAINT_RE.test(text)) return { answer: COMPLAINT_REPLY, complaint: true };
  let best: Faq | null = null;
  let score = 0;
  for (const f of FAQS) {
    const s = (text.match(new RegExp(f.keywords.source, "gi")) ?? []).length;
    if (s > score) {
      score = s;
      best = f;
    }
  }
  return { answer: best ? best.answer : FALLBACK, complaint: false };
}
