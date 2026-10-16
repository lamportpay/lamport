import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/Layout";
import { useState } from "react";
import {
  Bot,
  Building2,
  CheckCircle2,
  Clock3,
  Globe2,
  Mail,
  MapPin,
  MessageSquareText,
  Send,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { pageSeo } from "@/lib/seo";
import { WORLD_MAP_PATHS, WORLD_MAP_VIEWBOX } from "@/lib/world-map";
import markUrl from "@/assets/lamportpay-mark.png";

export const Route = createFileRoute("/contact")({
  head: () =>
    pageSeo({
      path: "/contact",
      title: "Contact LamportPay | Ask AI, Email or Message the Team",
      description:
        "Get instant answers from Lammy, the LamportPay assistant, email hello@lamportpay.com, or send the team a message that lands directly in our dashboard.",
    }),
  component: Contact,
});

const CHANNELS = [
  {
    icon: Bot,
    title: "Ask AI — instant answers",
    text: "Lammy answers questions about fees, supported countries, verification, partners and the roadmap — right away, free of cost.",
    action: "open-ai" as const,
    cta: "Chat with Lammy",
    highlight: true,
  },
  {
    icon: Mail,
    title: "Email the team",
    text: "For partnerships, press or anything that needs a human reply, write to us directly.",
    action: "mailto:hello@lamportpay.com" as const,
    cta: "hello@lamportpay.com",
    highlight: false,
  },
  {
    icon: MessageSquareText,
    title: "Message the team",
    text: "Use the form below — your message lands directly in our team dashboard, so nothing gets lost.",
    action: "#contact-form" as const,
    cta: "Send a message",
    highlight: false,
  },
];

const FACTS = [
  { icon: Clock3, label: "Typical reply", value: "Within 1–2 business days" },
  { icon: ShieldCheck, label: "Your data", value: "Messages stay in our own system" },
  { icon: Globe2, label: "Coverage", value: "Global product, remote-first team" },
];

/**
 * Payout map markers on the real world map (src/lib/world-map.ts).
 * Positions are true equirectangular coordinates:
 * x% = (lon + 180) / 360, y% = (84 - lat) / 144.
 */
const MAP_MARKERS = [
  { code: "US", name: "United States", x: 77.2, y: 31.3, live: true },
  { code: "GB", name: "United Kingdom", x: 49.4, y: 20.8, live: true },
  { code: "IN", name: "India", x: 71.7, y: 43.1, live: true },
  { code: "PH", name: "Philippines", x: 83.9, y: 49.3, live: true },
  { code: "NG", name: "Nigeria", x: 52.2, y: 51.4, live: false },
  { code: "PK", name: "Pakistan", x: 69.2, y: 37.5, live: false },
];

function PayoutMap() {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-border/60 bg-[image:var(--gradient-hero)] p-6 md:p-8 text-white shadow-[var(--shadow-soft)]">
      <div className="relative">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-white/80">
          <MapPin className="size-4" /> Where payouts reach
        </div>
        <h2 className="mt-2 text-2xl md:text-3xl font-semibold tracking-tight">
          One product, many destinations.
        </h2>
        <p className="mt-2 max-w-xl text-sm text-white/80">
          Connecting digital assets to local currency payouts across growing
          global markets.
        </p>

        <div className="relative mt-6 aspect-[180/72] w-full overflow-hidden rounded-2xl bg-white/10 ring-1 ring-white/20 backdrop-blur-sm">
          <svg
            viewBox={WORLD_MAP_VIEWBOX}
            preserveAspectRatio="xMidYMid meet"
            className="absolute inset-0 h-full w-full"
            aria-hidden="true"
          >
            <g fill="rgba(255,255,255,0.28)" stroke="rgba(255,255,255,0.18)" strokeWidth={0.15}>
              {WORLD_MAP_PATHS.map((d, i) => (
                <path key={i} d={d} />
              ))}
            </g>
          </svg>
          {MAP_MARKERS.map((m) => (
            <div
              key={m.code}
              className="group absolute"
              style={{ left: `${m.x}%`, top: `${m.y}%` }}
            >
              <span
                className={`absolute -inset-2 rounded-full ${
                  m.live ? "bg-emerald-300/40" : "bg-amber-300/40"
                } animate-ping`}
                style={{ animationDuration: "2.4s" }}
              />
              <span
                className={`relative block size-3 rounded-full ring-2 ring-white ${
                  m.live ? "bg-emerald-300" : "bg-amber-300"
                }`}
              />
              <span className="pointer-events-none absolute left-1/2 top-full z-10 mt-1.5 -translate-x-1/2 whitespace-nowrap rounded-full bg-black/55 px-2 py-0.5 text-[10px] font-medium opacity-0 transition group-hover:opacity-100">
                {m.name} · {m.live ? "Supported" : "Planned"}
              </span>
            </div>
          ))}
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-white/85">
          <span className="inline-flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-emerald-300" /> Supported (sandbox)
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-amber-300" /> Planned
          </span>
        </div>
      </div>
    </div>
  );
}

function Contact() {
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    topic: "General question",
    message: "",
  });
  const set =
    (k: keyof typeof form) =>
    (
      e: React.ChangeEvent<
        HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
      >,
    ) =>
      setForm({ ...form, [k]: e.target.value });

  function openAskAi() {
    window.dispatchEvent(new Event("lamportpay:open-ask-ai"));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);
    try {
      const text = `Contact form — ${form.topic}\nName: ${form.name}\nEmail: ${form.email}\n\n${form.message}`;
      await fetch("/api/ask-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: crypto.randomUUID(),
          messages: [{ role: "user", text }],
        }),
      });
    } catch {
      /* still show thanks; team can be reached by email */
    }
    setSending(false);
    setSent(true);
  }

  return (
    <SiteLayout>
      <section className="mx-auto max-w-6xl px-5 py-14 md:py-20">
        <div className="mx-auto max-w-2xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-card px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
            <Sparkles className="size-3.5" /> Contact LamportPay
          </div>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight md:text-5xl">
            Talk to us — or let Lammy answer first.
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Most questions about fees, countries, verification and the roadmap
            are answered instantly by our assistant. For everything else, the
            team is one message away.
          </p>
        </div>

        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {CHANNELS.map((c) => (
            <div
              key={c.title}
              className={`flex flex-col rounded-3xl border p-6 shadow-[var(--shadow-soft)] transition hover:-translate-y-0.5 ${
                c.highlight
                  ? "border-primary/30 bg-[image:var(--gradient-hero)] text-white"
                  : "border-border/60 bg-card"
              }`}
            >
              <div
                className={`flex size-11 items-center justify-center rounded-2xl ${
                  c.highlight
                    ? "bg-white/15 text-white"
                    : "bg-primary/10 text-primary"
                }`}
              >
                <c.icon className="size-5" />
              </div>
              <h2 className="mt-4 text-lg font-semibold tracking-tight">
                {c.title}
              </h2>
              <p
                className={`mt-2 flex-1 text-sm ${
                  c.highlight ? "text-white/85" : "text-muted-foreground"
                }`}
              >
                {c.text}
              </p>
              {c.action === "open-ai" ? (
                <button
                  type="button"
                  onClick={openAskAi}
                  className="mt-5 inline-flex items-center justify-center gap-2 rounded-full bg-white px-4 py-2.5 text-sm font-semibold text-primary transition hover:opacity-90"
                >
                  <img src={markUrl} alt="" className="size-4 object-contain" />
                  {c.cta}
                </button>
              ) : (
                <a
                  href={c.action}
                  className={`mt-5 inline-flex items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold transition ${
                    c.highlight
                      ? "bg-white text-primary hover:opacity-90"
                      : "bg-primary text-primary-foreground hover:bg-primary/90"
                  }`}
                >
                  {c.cta}
                </a>
              )}
            </div>
          ))}
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {FACTS.map((f) => (
            <div
              key={f.label}
              className="flex items-center gap-3 rounded-2xl border border-border/60 bg-card px-4 py-3"
            >
              <f.icon className="size-5 shrink-0 text-primary" />
              <div>
                <div className="text-xs text-muted-foreground">{f.label}</div>
                <div className="text-sm font-medium">{f.value}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 grid items-start gap-6 lg:grid-cols-2">
          <PayoutMap />

          <div
            id="contact-form"
            className="rounded-3xl border border-border/60 bg-card p-6 shadow-[var(--shadow-soft)] md:p-8"
          >
            {sent ? (
              <div className="py-10 text-center">
                <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-[color:var(--success)]/15 text-[color:var(--success)]">
                  <CheckCircle2 className="size-7" />
                </div>
                <h2 className="mt-5 text-2xl font-semibold tracking-tight">
                  Message received.
                </h2>
                <p className="mt-2 text-muted-foreground">
                  It's in the team dashboard now — we'll reply to your email.
                </p>
                <button
                  onClick={() => {
                    setSent(false);
                    setForm({
                      name: "",
                      email: "",
                      topic: "General question",
                      message: "",
                    });
                  }}
                  className="mt-6 inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-2.5 font-semibold text-background transition hover:opacity-90"
                >
                  Send another
                </button>
              </div>
            ) : (
              <form onSubmit={submit} className="space-y-5">
                <div className="flex items-center gap-2.5">
                  <Building2 className="size-5 text-primary" />
                  <h2 className="text-xl font-semibold tracking-tight">
                    Message the team
                  </h2>
                </div>
                <div className="grid gap-5 sm:grid-cols-2">
                  <Field label="Name">
                    <input
                      required
                      value={form.name}
                      onChange={set("name")}
                      className="w-full rounded-xl border border-border bg-background px-3 py-2.5"
                    />
                  </Field>
                  <Field label="Email">
                    <input
                      required
                      type="email"
                      value={form.email}
                      onChange={set("email")}
                      className="w-full rounded-xl border border-border bg-background px-3 py-2.5"
                    />
                  </Field>
                </div>
                <Field label="Topic">
                  <select
                    value={form.topic}
                    onChange={set("topic")}
                    className="w-full rounded-xl border border-border bg-background px-3 py-2.5"
                  >
                    {[
                      "General question",
                      "Payment problem",
                      "Partnership",
                      "Press",
                      "Other",
                    ].map((r) => (
                      <option key={r}>{r}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Message">
                  <textarea
                    required
                    rows={5}
                    value={form.message}
                    onChange={set("message")}
                    className="w-full rounded-xl border border-border bg-background px-3 py-2.5"
                  />
                </Field>
                <button
                  type="submit"
                  disabled={sending}
                  className="inline-flex items-center gap-2 rounded-full bg-[image:var(--gradient-hero)] px-6 py-3 font-semibold text-white shadow-[var(--shadow-soft)] transition hover:opacity-95 disabled:opacity-60"
                >
                  <Send className="size-4" />
                  {sending ? "Sending…" : "Send message"}
                </button>
                <p className="text-xs text-muted-foreground">
                  Your message is saved in our own system so the team can reply.
                  Never share passwords, private keys or seed phrases.
                </p>
              </form>
            )}
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1.5">
      <div className="text-xs font-medium text-muted-foreground">{label}</div>
      {children}
    </label>
  );
}
