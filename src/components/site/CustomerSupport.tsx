import { useState } from "react";
import { Mail, Send, Sparkles } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { PAYMENT_COSTS, PAYMENT_SAFETY } from "@/content/payment-flow";
import logoUrl from "@/assets/lamportpay-logo.png";

const suggestions = [
  "How do payments work?",
  "What are the fees?",
  "Which banks and countries are supported?",
  "Is my wallet safe?",
  "Do I need verification (KYC)?",
  "Is LamportPay live?",
];

function answer(question: string) {
  const q = question.toLowerCase();
  if (/fee|cost|charge|price|expensive/.test(q))
    return (
      "LamportPay’s fee is 2% of the total you send, taken out of it. Send 150 USDC: 3 USDC fee, 147 USDC goes to the payout partner. " +
      PAYMENT_COSTS.slice(1)
        .map((c) => c.detail)
        .join(" ")
    );
  if (/bank|country|countries|destination|payout/.test(q))
    return "The sandbox destination picker offers the United States, United Kingdom, India and Philippines. Bank options depend on the destination and currency; our payout partner checks final availability and bank details. Real bank payouts remain disabled until production approval.";
  if (/safe|wallet|key|seed|custod|secure/.test(q))
    return (
      "LamportPay is non-custodial: you keep your funds and keys in your own wallet, and we never hold balances. Never share a seed phrase or private key. Sign-in uses a plain-text message signature, not a payment transaction. " +
      PAYMENT_SAFETY
    );
  if (/kyc|verif|identity|document/.test(q))
    return "Verification (KYC) runs on our payout partner’s hosted page. LamportPay stores only a link and a status — we never see or store your identity documents. In the sandbox, verification is simulated.";
  if (/live|launch|real|production|when/.test(q))
    return "LamportPay currently runs in Devnet / Sandbox: quotes are real, but no real funds move and bank payouts are simulated. Live bank payouts are a planned roadmap milestone and will launch only after production approval.";
  if (/sol|usdc|usdt|swap|jupiter|crypto|coin|token/.test(q))
    return "You can pay in USDC on Solana, or in SOL — Jupiter provides a live swap quote and your SOL is converted to USDC in the same flow. More assets and chains are planned on the roadmap.";
  if (/partner|backed|stables|jupiter|hyperliquid/.test(q))
    return "Jupiter provides Solana swap quotes. Stables provides sandbox verification and payout infrastructure. Hyperliquid integration is in progress. Our listed business partners are ready to adopt the service; onboarding is planned. This is not a claim of investment or bank endorsement.";
  if (/business|model|revenue|earn|b2b|api/.test(q))
    return "LamportPay earns a single 2% fee on each payment — no hidden charges. A B2B payout API for businesses and remittance partners is a planned roadmap milestone; we do not offer public APIs today.";
  if (/payment|work|send|how|step|sandbox|test/.test(q))
    return (
      "Connect your wallet, choose the amount and destination, view the quote, check bank details, complete any required verification, then review and approve. " +
      PAYMENT_SAFETY
    );
  return "I can help with payment steps, fees, banks, verification and wallet safety. For account-specific questions, contact our team below. Never send passwords, bank details, private keys or seed phrases here.";
}

export function CustomerSupport() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<{ question: string; reply: string }[]>([]);
  function ask(question: string) {
    if (!question.trim()) return;
    setMessages((previous) => [
      ...previous.slice(-4),
      { question: question.trim(), reply: answer(question) },
    ]);
    setInput("");
  }
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          type="button"
          className="group fixed bottom-5 right-5 z-40 flex items-center gap-2 rounded-full border border-border bg-background py-2 pl-2 pr-4 shadow-lg shadow-home-brand/20 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-home-brand/30"
          aria-label="Ask AI — open LamportPay assistant"
          title="Ask AI"
        >
          <span className="flex size-9 items-center justify-center overflow-hidden rounded-full bg-home-tint ring-1 ring-home-brand/30">
            <img src={logoUrl} alt="" className="size-7 object-contain" />
          </span>
          <span className="text-sm font-semibold text-foreground">Ask AI</span>
        </button>
      </DialogTrigger>
      <DialogContent className="home-support left-auto right-4 top-auto bottom-4 w-[calc(100%-2rem)] max-w-sm translate-x-0 translate-y-0 gap-0 overflow-hidden rounded-lg p-0">
        <div className="border-b border-border bg-home-tint p-5 pr-12">
          <DialogTitle className="flex items-center gap-2.5">
            <span className="flex size-8 items-center justify-center overflow-hidden rounded-full bg-background ring-1 ring-home-brand/30">
              <img src={logoUrl} alt="" className="size-6 object-contain" />
            </span>
            Ask AI
          </DialogTitle>
          <DialogDescription className="mt-2 flex items-center gap-1.5">
            <Sparkles className="size-3.5 text-home-brand" />
            Lammy · Automated guide, not a live agent
          </DialogDescription>
        </div>
        <div className="max-h-[45dvh] space-y-4 overflow-y-auto p-5" aria-live="polite">
          <div className="flex gap-3">
            <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center overflow-hidden rounded-full bg-home-tint ring-1 ring-home-brand/30">
              <img src={logoUrl} alt="" className="size-5 object-contain" />
            </span>
            <p className="text-sm text-muted-foreground">
              Hello. What would you like to know about LamportPay?
            </p>
          </div>
          {messages.length === 0 && (
            <div className="grid gap-2">
              {suggestions.map((q) => (
                <Button
                  key={q}
                  variant="outline"
                  className="h-auto justify-start whitespace-normal py-2.5 text-left"
                  onClick={() => ask(q)}
                >
                  {q}
                </Button>
              ))}
            </div>
          )}
          {messages.map((m, i) => (
            <div key={i} className="space-y-2">
              <p className="ml-6 rounded-md bg-home-tint p-3 text-sm font-medium">{m.question}</p>
              <p className="text-sm leading-relaxed text-muted-foreground">{m.reply}</p>
            </div>
          ))}
        </div>
        <form
          className="flex gap-2 border-t border-border px-5 pt-4"
          onSubmit={(event) => {
            event.preventDefault();
            ask(input);
          }}
        >
          <Input
            aria-label="Ask support a question"
            placeholder="Ask about LamportPay…"
            maxLength={300}
            value={input}
            onChange={(event) => setInput(event.target.value)}
          />
          <Button type="submit" size="icon" aria-label="Send question" disabled={!input.trim()}>
            <Send />
          </Button>
        </form>
        <p className="px-5 py-2 text-[10px] text-muted-foreground">
          Do not share personal, bank or wallet secrets.
        </p>
        <div className="flex gap-2 border-t border-border p-4">
          <Button asChild variant="outline" className="flex-1">
            <a href="mailto:hello@lamportpay.com">
              <Mail />
              Email team
            </a>
          </Button>
          <Button asChild variant="ghost" className="flex-1">
            <Link to="/contact">Contact us</Link>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
