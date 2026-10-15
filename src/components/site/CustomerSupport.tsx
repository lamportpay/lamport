import { useEffect, useRef, useState } from "react";
import { Loader2, Mail, RotateCcw, Send } from "lucide-react";
import { Link } from "@tanstack/react-router";
import ReactMarkdown from "react-markdown";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { FAQS, SUGGESTED, answerFaq } from "@/lib/ask-ai-faq";
import markUrl from "@/assets/lamportpay-mark.png";

const STORAGE_KEY = "lamportpay-ask-ai-v2";
const SESSION_KEY = "lamportpay-ask-ai-session";

type Msg = { id: string; role: "user" | "assistant"; text: string };

function sessionId() {
  let id = window.localStorage.getItem(SESSION_KEY);
  if (!id) {
    id = crypto.randomUUID();
    window.localStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

function loadHistory(): Msg[] {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function Mark({ size = "size-7", inner = "size-5" }: { size?: string; inner?: string }) {
  return (
    <span className={`flex ${size} shrink-0 items-center justify-center rounded-full bg-background ring-1 ring-home-brand/30`}>
      <img src={markUrl} alt="" className={`${inner} object-contain`} />
    </span>
  );
}

function ChatBody() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Msg[]>(() => loadHistory());
  const [typing, setTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const timer = useRef<number | null>(null);

  useEffect(() => () => {
    if (timer.current) window.clearInterval(timer.current);
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages, typing]);

  function persist(next: Msg[]) {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next.slice(-60)));
    } catch {
      /* storage disabled */
    }
    fetch("/api/ask-ai", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ sessionId: sessionId(), messages: next.map(({ role, text }) => ({ role, text })) }),
    }).catch(() => {});
  }

  function ask(raw: string) {
    const q = raw.trim().slice(0, 1000);
    if (!q || typing) return;
    const user: Msg = { id: crypto.randomUUID(), role: "user", text: q };
    const base = [...messages, user];
    setMessages(base);
    setInput("");
    setTyping(true);
    inputRef.current?.focus();
    const { answer } = answerFaq(q);
    const id = crypto.randomUUID();
    window.setTimeout(() => {
      setTyping(false);
      const words = answer.split(/(\s+)/);
      let i = 0;
      timer.current = window.setInterval(() => {
        i += 3;
        const text = words.slice(0, i).join("");
        setMessages([...base, { id, role: "assistant", text }]);
        if (i >= words.length) {
          if (timer.current) window.clearInterval(timer.current);
          const final = [...base, { id, role: "assistant" as const, text: answer }];
          setMessages(final);
          persist(final);
          inputRef.current?.focus();
        }
      }, 30);
    }, 450);
  }

  function reset() {
    if (timer.current) window.clearInterval(timer.current);
    setTyping(false);
    setMessages([]);
    window.localStorage.removeItem(STORAGE_KEY);
    window.localStorage.removeItem(SESSION_KEY);
    inputRef.current?.focus();
  }

  const asked = new Set(messages.filter((m) => m.role === "user").map((m) => m.text));
  const chips = (messages.length === 0 ? FAQS.filter((f) => SUGGESTED.includes(f.id)) : FAQS)
    .filter((f) => !asked.has(f.question))
    .slice(0, messages.length === 0 ? 6 : 4);

  return (
    <>
      <div ref={scrollRef} className="max-h-[50dvh] min-h-48 space-y-4 overflow-y-auto p-5" aria-live="polite">
        <div className="flex gap-3">
          <Mark />
          <p className="text-sm text-muted-foreground">Hello! Ask me anything about LamportPay — fees, countries, safety or how payments work.</p>
        </div>
        {messages.map((m) =>
          m.role === "user" ? (
            <p key={m.id} className="ml-8 whitespace-pre-wrap rounded-2xl rounded-br-sm bg-primary px-3.5 py-2.5 text-sm text-primary-foreground">
              {m.text}
            </p>
          ) : (
            <div key={m.id} className="flex gap-3">
              <Mark />
              <div className="prose prose-sm min-w-0 max-w-none text-sm leading-relaxed text-foreground prose-p:my-1.5 prose-ol:my-1.5 prose-ul:my-1.5 prose-li:my-0.5">
                <ReactMarkdown>{m.text}</ReactMarkdown>
              </div>
            </div>
          ),
        )}
        {typing && (
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <Mark />
            <Loader2 className="size-4 animate-spin" /> Lammy is typing…
          </div>
        )}
        {!typing && chips.length > 0 && (
          <div className={messages.length === 0 ? "grid gap-2" : "flex flex-wrap gap-1.5 pt-1"}>
            {chips.map((f) =>
              messages.length === 0 ? (
                <Button key={f.id} variant="outline" className="h-auto justify-start whitespace-normal py-2.5 text-left" onClick={() => ask(f.question)}>
                  {f.question}
                </Button>
              ) : (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => ask(f.question)}
                  className="rounded-full border border-border bg-background px-3 py-1 text-xs font-medium text-foreground hover:border-primary hover:text-primary"
                >
                  {f.question}
                </button>
              ),
            )}
          </div>
        )}
      </div>
      <form
        className="flex items-end gap-2 border-t border-border px-5 pt-4"
        onSubmit={(event) => {
          event.preventDefault();
          ask(input);
        }}
      >
        <Textarea
          ref={inputRef}
          autoFocus
          rows={1}
          aria-label="Ask a question"
          placeholder="Ask about LamportPay…"
          maxLength={1000}
          value={input}
          className="max-h-28 min-h-10 resize-none"
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              ask(input);
            }
          }}
        />
        <Button type="submit" size="icon" aria-label="Send question" disabled={!input.trim() || typing}>
          <Send />
        </Button>
      </form>
      <div className="flex items-center justify-between px-5 py-2">
        <p className="text-[10px] text-muted-foreground">Chats are saved to help our team. Never share bank or wallet secrets.</p>
        {messages.length > 0 && (
          <button type="button" onClick={reset} className="flex shrink-0 items-center gap-1 text-[11px] font-medium text-home-brand hover:underline">
            <RotateCcw className="size-3" /> New chat
          </button>
        )}
      </div>
    </>
  );
}

export function CustomerSupport() {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          className="group fixed bottom-5 right-5 z-40 flex items-center gap-2 rounded-full bg-primary py-1.5 pl-1.5 pr-4 text-primary-foreground shadow-lg shadow-primary/30 transition-all hover:-translate-y-0.5 hover:bg-primary/90 hover:shadow-xl hover:shadow-primary/40"
          aria-label="Ask AI — open LamportPay assistant"
          title="Ask AI"
        >
          <Mark size="size-9" inner="size-6" />
          <span className="text-sm font-semibold">Ask AI</span>
        </button>
      </DialogTrigger>
      <DialogContent className="home-support left-auto right-4 top-auto bottom-4 w-[calc(100%-2rem)] max-w-sm translate-x-0 translate-y-0 gap-0 overflow-hidden rounded-lg p-0">
        <div className="border-b border-border bg-primary p-5 pr-12 text-primary-foreground">
          <DialogTitle className="flex items-center gap-2.5 text-primary-foreground">
            <Mark size="size-8" inner="size-6" />
            Ask AI
          </DialogTitle>
          <DialogDescription className="mt-2 text-primary-foreground/80">Lammy · LamportPay assistant, not a live agent</DialogDescription>
        </div>
        {open && <ChatBody />}
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
