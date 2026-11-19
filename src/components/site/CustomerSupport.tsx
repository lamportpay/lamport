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
import { COMPLAINT_RE, FAQS, SUGGESTED, answerFaq } from "@/lib/ask-ai-faq";
import markUrl from "@/assets/lamportpay-mark.png";
import { supabase } from "@/integrations/supabase/client";
import { useLaunchStage } from "@/lib/launch-stage";

type Msg = { id: string; role: "user" | "assistant"; text: string };

const EMAIL_RE = /[^@\s]+@[^@\s]+\.[^@\s]+/;

/** Only complaints (or messages with a contact email) are sent to the team. */
function worthReporting(messages: Msg[]) {
  return messages.some((m) => m.role === "user" && (COMPLAINT_RE.test(m.text) || EMAIL_RE.test(m.text)));
}

/**
 * Complaints this browser sent (their random chat session IDs only), so the chat can show the
 * team's published answer on a later visit (/api/support/updates). Kept on this device.
 */
const SESSIONS_KEY = "lamportpay:support-sessions";
const MAX_SESSIONS = 10;

type SupportUpdate = { sessionId: string; reference: string; answer: string; answeredAt: string };

function rememberedSessions(): string[] {
  try {
    const parsed: unknown = JSON.parse(window.localStorage.getItem(SESSIONS_KEY) || "[]");
    return Array.isArray(parsed)
      ? parsed.filter((v): v is string => typeof v === "string").slice(-MAX_SESSIONS)
      : [];
  } catch {
    return [];
  }
}

function rememberSession(id: string) {
  try {
    const next = [...rememberedSessions().filter((s) => s !== id), id].slice(-MAX_SESSIONS);
    window.localStorage.setItem(SESSIONS_KEY, JSON.stringify(next));
  } catch {
    /* storage unavailable: the signed-in "My requests" page still shows the answer */
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
  const stage = useLaunchStage();
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Msg[]>([]);
  const [typing, setTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const timer = useRef<number | null>(null);
  const [busy, setBusy] = useState(false);
  // One id per conversation (memory only) so repeat saves update the same complaint row.
  const chatId = useRef<string>(crypto.randomUUID());
  const [updates, setUpdates] = useState<SupportUpdate[]>([]);

  useEffect(() => {
    const sessionIds = rememberedSessions();
    if (sessionIds.length === 0) return;
    let active = true;
    fetch("/api/support/updates", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ sessionIds }),
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((body: { updates?: SupportUpdate[] } | null) => {
        if (active && Array.isArray(body?.updates)) setUpdates(body.updates);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => () => {
    if (timer.current) window.clearInterval(timer.current);
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages, typing]);

  async function persist(next: Msg[]) {
    if (!worthReporting(next)) return;
    const sessionId = chatId.current;
    const headers: Record<string, string> = { "content-type": "application/json" };
    // Signed in: the complaint is linked to the account, so the answer shows on "My requests".
    try {
      const { data } = await supabase.auth.getSession();
      if (data.session?.access_token) headers.authorization = `Bearer ${data.session.access_token}`;
    } catch {
      /* not signed in */
    }
    const isComplaint = next.some((m) => m.role === "user" && COMPLAINT_RE.test(m.text));
    fetch("/api/ask-ai", {
      method: "POST",
      headers,
      body: JSON.stringify({ sessionId, messages: next.map(({ role, text }) => ({ role, text })) }),
    })
      .then((res) => {
        if (res.ok && isComplaint) rememberSession(sessionId);
      })
      .catch(() => {});
  }

  function ask(raw: string) {
    const q = raw.trim().slice(0, 1000);
    if (!q || typing || busy) return;
    if (timer.current) window.clearInterval(timer.current);
    setBusy(true);
    const user: Msg = { id: crypto.randomUUID(), role: "user", text: q };
    const base = [...messages, user];
    setMessages(base);
    setInput("");
    setTyping(true);
    inputRef.current?.focus();
    const { answer } = answerFaq(q, stage);
    const id = crypto.randomUUID();
    window.setTimeout(() => {
      setTyping(false);
      const words = answer.split(/(\s+)/);
      let i = 0;
      const handle = window.setInterval(() => {
        i += 3;
        const text = words.slice(0, i).join("");
        setMessages([...base, { id, role: "assistant", text }]);
        if (i >= words.length) {
          window.clearInterval(handle);
          if (timer.current === handle) timer.current = null;
          setBusy(false);
          const final = [...base, { id, role: "assistant" as const, text: answer }];
          setMessages(final);
          void persist(final);
          inputRef.current?.focus();
        }
      }, 30);
      timer.current = handle;
    }, 450);
  }

  function reset() {
    if (timer.current) window.clearInterval(timer.current);
    timer.current = null;
    setBusy(false);
    setTyping(false);
    setMessages([]);
    chatId.current = crypto.randomUUID();
    inputRef.current?.focus();
  }

  const asked = new Set(messages.filter((m) => m.role === "user").map((m) => m.text));
  const chips = (messages.length === 0 ? FAQS.filter((f) => SUGGESTED.includes(f.id)) : FAQS)
    .filter((f) => !asked.has(f.question))
    .slice(0, messages.length === 0 ? 6 : 4);

  return (
    <>
      <div ref={scrollRef} className="max-h-[50dvh] min-h-48 space-y-4 overflow-y-auto p-5" aria-live="polite">
        {updates.map((u) => (
          <div key={u.sessionId} role="status" className="rounded-lg border border-primary/30 bg-primary/5 p-3 text-sm">
            <p className="text-xs font-semibold text-primary">Update on your request {u.reference}</p>
            <p className="mt-1 whitespace-pre-wrap text-foreground">{u.answer}</p>
            <p className="mt-1 text-[11px] text-muted-foreground">From the LamportPay team · {new Date(u.answeredAt).toLocaleString()}</p>
          </div>
        ))}
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
        {!typing && !busy && chips.length > 0 && (
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
        <Button type="submit" size="icon" aria-label="Send question" disabled={!input.trim() || typing || busy}>
          <Send />
        </Button>
      </form>
      <div className="flex items-center justify-between px-5 py-2">
        <p className="text-[10px] text-muted-foreground">Chats stay on your device — only complaints reach our team. Never share bank or wallet secrets.</p>
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
  useEffect(() => {
    const onOpen = () => setOpen(true);
    window.addEventListener("lamportpay:open-ask-ai", onOpen);
    return () => window.removeEventListener("lamportpay:open-ask-ai", onOpen);
  }, []);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          className="group fixed bottom-5 right-5 z-40 flex items-center gap-3 rounded-full py-2.5 pl-3 pr-7 text-white shadow-xl shadow-[oklch(0.48_0.23_275/0.4)] ring-1 ring-white/25 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-[oklch(0.48_0.23_275/0.55)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
          style={{ backgroundImage: "var(--home-gradient)" }}
          aria-label="Ask Lammy — open LamportPay assistant"
          title="Ask Lammy"
        >
          <span className="relative">
            <Mark size="size-9" inner="size-5" />
            <span className="absolute -right-0.5 -top-0.5 size-2.5 rounded-full bg-emerald-400 ring-2 ring-white motion-safe:animate-pulse" />
          </span>
          <span className="text-[15px] font-semibold tracking-wide">Ask Lammy</span>

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
