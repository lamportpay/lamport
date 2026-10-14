import { useState } from "react";
import { Bot, Headphones, Mail, Send } from "lucide-react";
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

const suggestions = [
  "How do payments work?",
  "What are the fees?",
  "Which banks can I use?",
  "Is my wallet safe?",
];
function answer(question: string) {
  const q = question.toLowerCase();
  if (/fee|cost|charge/.test(q))
    return (
      "LamportPay’s fee is 2% of the total you send, taken out of it. Send 150 USDC: 3 USDC fee, 147 USDC to Stables. " +
      PAYMENT_COSTS.slice(1)
        .map((c) => c.detail)
        .join(" ")
    );
  if (/bank|country|countries/.test(q))
    return "The TEST MODE destination picker offers the United States, United Kingdom, India and Philippines. Bank options depend on the destination and currency; Stables checks final availability and bank details. Real bank payouts remain disabled.";
  if (/safe|wallet|key|seed/.test(q))
    return (
      "You keep your funds and keys in your own wallet. Never share a seed phrase or private key. Sign-in uses a plain-text message, not a payment transaction. " +
      PAYMENT_SAFETY
    );
  if (/partner|backed|stables|jupiter/.test(q))
    return "Jupiter provides Solana swap quotes. Stables provides sandbox verification and payout infrastructure. Our listed business partners are ready to adopt the service; onboarding is planned. This is not a claim of investment or bank endorsement.";
  if (/payment|work|send|kyc|demo|test/.test(q))
    return (
      "Connect your wallet, choose the amount and destination, view the quote, check bank details, complete any sandbox verification, then review and approve. " +
      PAYMENT_SAFETY
    );
  return "I can help with payment steps, fees, banks and wallet safety. For account-specific questions, contact our team below. Never send passwords, bank details, private keys or seed phrases here.";
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
        <Button
          className="fixed bottom-5 right-5 z-40 size-14 rounded-full bg-home-brand text-primary-foreground shadow-lg hover:bg-home-brand/90"
          size="icon"
          aria-label="Open customer support"
          title="Customer support"
        >
          <Headphones className="size-6" />
        </Button>
      </DialogTrigger>
      <DialogContent className="home-support left-auto right-4 top-auto bottom-4 w-[calc(100%-2rem)] max-w-sm translate-x-0 translate-y-0 gap-0 overflow-hidden rounded-lg p-0">
        <div className="border-b border-border bg-home-tint p-5 pr-12">
          <DialogTitle className="flex items-center gap-2">
            <Headphones className="size-5 text-home-brand" /> Customer support
          </DialogTitle>
          <DialogDescription className="mt-2">
            Lammy · Automated guide, not a live agent
          </DialogDescription>
        </div>
        <div className="max-h-[45dvh] space-y-4 overflow-y-auto p-5" aria-live="polite">
          <div className="flex gap-3">
            <Bot className="mt-1 size-5 shrink-0 text-home-brand" />
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
