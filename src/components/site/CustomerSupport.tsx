import { useEffect, useRef, useState } from "react";
import { Loader2, Mail, RotateCcw, Send, Square } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
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
const logoUrl = "/apple-touch-icon.png";
const SESSION_KEY = "lamportpay-ask-ai-session";

function sessionId() {
  let id = window.localStorage.getItem(SESSION_KEY);
  if (!id) {
    id = crypto.randomUUID();
    window.localStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

const STORAGE_KEY = "lamportpay-ask-ai-v1";

const suggestions = [
  "How do payments work?",
  "What are the fees?",
  "Which banks and countries are supported?",
  "Is my wallet safe?",
  "Do I need verification (KYC)?",
  "Is LamportPay live?",
];

function loadHistory(): UIMessage[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function textOf(m: UIMessage) {
  return m.parts.map((p) => (p.type === "text" ? p.text : "")).join("");
}

function Avatar() {
  return (
    <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center overflow-hidden rounded-full bg-home-tint ring-1 ring-home-brand/30">
      <img src={logoUrl} alt="" className="size-5 object-contain" />
    </span>
  );
}

function ChatBody() {
  const [input, setInput] = useState("");
  const [initial] = useState<UIMessage[]>(() => loadHistory());
  const { messages, sendMessage, setMessages, status, stop, error } = useChat({
    id: "ask-ai",
    messages: initial,
    transport: new DefaultChatTransport({ api: "/api/ask-ai", body: () => ({ sessionId: sessionId() }) }),
  });
  const busy = status === "submitted" || status === "streaming";
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (status === "ready" || status === "error") {
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-40)));
      } catch {
        /* storage full or disabled */
      }
      inputRef.current?.focus();
    }
  }, [messages, status]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages, status]);

  function ask(text: string) {
    const q = text.trim();
    if (!q || busy) return;
    sendMessage({ text: q.slice(0, 1000) });
    setInput("");
    inputRef.current?.focus();
  }

  function reset() {
    stop();
    setMessages([]);
    window.localStorage.removeItem(STORAGE_KEY);
    window.localStorage.removeItem(SESSION_KEY);
    inputRef.current?.focus();
  }

  const last = messages[messages.length - 1];
  const waiting = status === "submitted" || (status === "streaming" && last?.role === "assistant" && !textOf(last));

  return (
    <>
      <div ref={scrollRef} className="max-h-[50dvh] min-h-48 space-y-4 overflow-y-auto p-5" aria-live="polite">
        <div className="flex gap-3">
          <Avatar />
          <p className="text-sm text-muted-foreground">Hello. What would you like to know about LamportPay?</p>
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
        {messages.map((m) =>
          m.role === "user" ? (
            <p key={m.id} className="ml-8 whitespace-pre-wrap rounded-2xl rounded-br-sm bg-primary px-3.5 py-2.5 text-sm text-primary-foreground">
              {textOf(m)}
            </p>
          ) : textOf(m) ? (
            <div key={m.id} className="space-y-2">
            {m.parts.some((p) => p.type === "tool-file_complaint") && (
              <p className="ml-10 rounded-md border border-home-brand/30 bg-home-tint px-3 py-1.5 text-xs font-medium text-foreground">
                ✓ Sent to the LamportPay team
              </p>
            )}
            <div className="flex gap-3">
              <Avatar />
              <div className="prose prose-sm min-w-0 max-w-none text-sm leading-relaxed text-foreground prose-p:my-1.5 prose-ul:my-1.5 prose-li:my-0.5">
                <ReactMarkdown>{textOf(m)}</ReactMarkdown>
              </div>
            </div>
            </div>
          ) : null,
        )}
        {waiting && (
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <Avatar />
            <Loader2 className="size-4 animate-spin" /> Lammy is typing…
          </div>
        )}
        {error && (
          <p className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
            {error.message || "Something went wrong. Please try again."}
          </p>
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
          aria-label="Ask AI a question"
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
        {busy ? (
          <Button type="button" size="icon" variant="outline" aria-label="Stop reply" onClick={() => stop()}>
            <Square />
          </Button>
        ) : (
          <Button type="submit" size="icon" aria-label="Send question" disabled={!input.trim()}>
            <Send />
          </Button>
        )}
      </form>
      <div className="flex items-center justify-between px-5 py-2">
        <p className="text-[10px] text-muted-foreground">Chats are saved to help our team. Never share bank or wallet secrets.</p>
        {messages.length > 0 && (
          <button type="button" onClick={reset} className="flex items-center gap-1 text-[11px] font-medium text-home-brand hover:underline">
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
          <DialogDescription className="mt-2">Lammy · AI assistant, not a live agent</DialogDescription>
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
