import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/Layout";
import {
  CORRIDORS,
  PAYOUT_METHODS,
  SENDER_CURRENCIES,
  TOKENS,
  type Token,
  calcQuote,
  fmt,
  mockBridgeRef,
  mockPaymentId,
  mockSolanaHash,
} from "@/components/site/demo-data";
import { useMemo, useState, useEffect } from "react";
import { ArrowLeft, ArrowRight, Check, Copy, ShieldCheck } from "lucide-react";
import { LammySays, LammyCheck, LAMMY_INTRO, LAMMY_SAFETY } from "@/components/site/Lammy";
import { WalletPanelIsland } from "@/components/site/wallet/WalletIsland";

export const Route = createFileRoute("/send")({
  head: () => ({
    meta: [
      { title: "Send demo transfer — LamportPay" },
      { name: "description", content: "Walk through a mock Bridge-only crypto-to-local-currency transfer flow." },
      { property: "og:title", content: "Send demo transfer — LamportPay" },
      { property: "og:description", content: "Mock quote, KYC, settlement, and receipt." },
    ],
  }),
  component: SendPage,
});

type Step = 1 | 2 | 3 | 4 | 5 | 6;

function SendPage() {
  const [step, setStep] = useState<Step>(1);
  const [amount, setAmount] = useState("500");
  const [token, setToken] = useState<Token>("USDC");
  const [senderCurrency, setSenderCurrency] = useState<string>("USD");
  const [corridorIdx, setCorridorIdx] = useState(0);
  const [recipientName, setRecipientName] = useState("Ayesha Khan");
  const [method, setMethod] = useState<(typeof PAYOUT_METHODS)[number]>("Bank account");
  const [recipientDetails, setRecipientDetails] = useState("Mock Bank • •••• 4821");
  const [kycApproved, setKycApproved] = useState(false);
  const [paymentId, setPaymentId] = useState("");
  const [bridgeRef, setBridgeRef] = useState("");
  const [txHash, setTxHash] = useState("");
  const [trackIdx, setTrackIdx] = useState(0);

  const corridor = CORRIDORS[corridorIdx];
  const quote = useMemo(() => calcQuote(parseFloat(amount) || 0, token, corridor.currency), [amount, token, corridor.currency]);

  const timeline = [
    "Payment created",
    "Bridge selected as settlement partner",
    "Mock Bridge KYC approved",
    "Crypto converted to USDC",
    "USDC settlement confirmed",
    "Payout request sent to Bridge",
    "Bridge processing payout",
    "Recipient paid",
  ];

  useEffect(() => {
    if (step !== 5) return;
    setTrackIdx(0);
    const id = setInterval(() => {
      setTrackIdx((i) => {
        if (i >= timeline.length - 1) { clearInterval(id); return i; }
        return i + 1;
      });
    }, 700);
    return () => clearInterval(id);
  }, [step]);

  return (
    <SiteLayout>
      <div className="max-w-5xl mx-auto px-5 py-14 md:py-20">
        <div className="mb-8">
          <div className="text-xs font-semibold uppercase tracking-wider text-primary">Demo send flow</div>
          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight mt-2">Send a demo transfer</h1>
          <p className="text-muted-foreground mt-2">Six steps. All mock data. No real crypto, KYC, or fiat moves.</p>
        </div>

        <Stepper current={step} labels={["Details", "Quote", "KYC", "Confirm", "Tracking", "Receipt"]} />

        <div className="mt-8">
          <LammySays size={72} wave={step === 1}>
            {step === 1 && LAMMY_INTRO}
            {step === 2 && "Here's your quote. Every fee is shown before you confirm — nothing is added later."}
            {step === 3 && "Identity checks are done by the licensed partner, never by LamportPay."}
            {step === 4 && `Please double-check the recipient details. ${LAMMY_SAFETY}`}
            {step === 5 && "I'm tracking your payout across the network. This usually settles in under 5 minutes."}
            {step === 6 && "All done — here's your receipt. You can copy it for your records."}
          </LammySays>
        </div>

        <div className="mt-10 rounded-3xl border border-border/60 bg-card shadow-[var(--shadow-soft)] p-6 md:p-10">
          {step === 1 && (
            <div className="space-y-6">
              <SectionTitle title="1. Enter transfer details" />
              <WalletPanelIsland />
              <div className="grid md:grid-cols-2 gap-5">
                <Field label="Token">
                  <select value={token} onChange={(e) => setToken(e.target.value as Token)} className="w-full rounded-xl border border-border bg-background px-3 py-2.5">
                    {TOKENS.map((t) => <option key={t}>{t}</option>)}
                  </select>
                </Field>
                <Field label="Amount">
                  <input value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ""))} className="w-full rounded-xl border border-border bg-background px-3 py-2.5" />
                </Field>
                <Field label="Sender currency (display)">
                  <select value={senderCurrency} onChange={(e) => setSenderCurrency(e.target.value)} className="w-full rounded-xl border border-border bg-background px-3 py-2.5">
                    {SENDER_CURRENCIES.map((c) => <option key={c}>{c}</option>)}
                  </select>
                </Field>
                <Field label="Receiver country">
                  <select value={corridorIdx} onChange={(e) => setCorridorIdx(parseInt(e.target.value))} className="w-full rounded-xl border border-border bg-background px-3 py-2.5">
                    {CORRIDORS.map((c, i) => <option key={c.currency} value={i}>{c.flag} {c.country}</option>)}
                  </select>
                </Field>
                <Field label="Receiver currency">
                  <div className="w-full rounded-xl border border-border bg-secondary px-3 py-2.5 font-semibold">{corridor.currency}</div>
                </Field>
                <Field label="Payout method">
                  <select value={method} onChange={(e) => setMethod(e.target.value as any)} className="w-full rounded-xl border border-border bg-background px-3 py-2.5">
                    {PAYOUT_METHODS.map((m) => <option key={m}>{m}</option>)}
                  </select>
                </Field>
                <Field label="Recipient name">
                  <input value={recipientName} onChange={(e) => setRecipientName(e.target.value)} className="w-full rounded-xl border border-border bg-background px-3 py-2.5" />
                </Field>
                <Field label="Mock recipient details">
                  <input value={recipientDetails} onChange={(e) => setRecipientDetails(e.target.value)} className="w-full rounded-xl border border-border bg-background px-3 py-2.5" />
                </Field>
              </div>
              <PrimaryButton onClick={() => { setPaymentId(mockPaymentId()); setStep(2); }}>
                Get Bridge Quote <ArrowRight className="w-4 h-4" />
              </PrimaryButton>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <SectionTitle title="2. Bridge quote" />
              <div className="grid md:grid-cols-2 gap-3">
                <KV k="Provider" v="Bridge" />
                <KV k="Provider type" v="Stablecoin orchestration / settlement partner" />
                <KV k="Input token" v={token} />
                <KV k="Input amount" v={amount} />
                <KV k="Estimated USDC settlement" v={`${fmt(quote.usdcSettlement)} USDC`} />
                <KV k="FX rate" v={`1 USD = ${fmt(quote.fxRate, quote.fxRate > 100 ? 0 : 2)} ${corridor.currency}`} />
                <KV k="Bridge fee" v={`$${fmt(quote.bridgeFee)}`} />
                <KV k="LamportPay platform fee" v={`$${fmt(quote.platformFee)}`} />
                <KV k="Total fee" v={`$${fmt(quote.totalFee)}`} />
                <KV k="Recipient receives" v={`${fmt(quote.recipientAmount)} ${corridor.currency}`} />
                <KV k="Estimated delivery" v="Under 5 minutes" />
                <KV k="KYC method" v="Bridge-hosted KYC" />
                <KV k="Payout method" v={method} />
                <KV k="Corridor support" v="Demo supported" />
              </div>
              <div className="text-xs text-muted-foreground">Status note: Mock quote for demo only.</div>
              <NavButtons onBack={() => setStep(1)} onNext={() => setStep(3)} nextLabel="Continue to Bridge KYC" />
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <SectionTitle title="3. Bridge KYC" />
              <div className="rounded-2xl bg-secondary/60 p-5 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <p className="text-sm leading-relaxed">
                  Identity verification is handled by <strong>Bridge</strong> or the selected licensed payout partner,
                  not by LamportPay.
                </p>
              </div>
              <div className="grid md:grid-cols-2 gap-3">
                <KV k="Selected partner" v="Bridge" />
                <KV k="KYC status" v={kycApproved ? "Approved" : "Not started"} />
              </div>
              {kycApproved && <LammyCheck label="Mock KYC approved by Bridge" />}
              {!kycApproved ? (
                <PrimaryButton onClick={() => setKycApproved(true)}>Complete Mock Bridge KYC</PrimaryButton>
              ) : (
                <NavButtons onBack={() => setStep(2)} onNext={() => setStep(4)} nextLabel="Confirm Demo Payment" />
              )}
            </div>
          )}

          {step === 4 && (
            <div className="space-y-6">
              <SectionTitle title="4. Payment confirmation" />
              <div className="grid md:grid-cols-2 gap-3">
                <KV k="Input token" v={token} />
                <KV k="Input amount" v={amount} />
                <KV k="Estimated USDC settlement" v={`${fmt(quote.usdcSettlement)} USDC`} />
                <KV k="Receiver country" v={corridor.country} />
                <KV k="Receiver currency" v={corridor.currency} />
                <KV k="Recipient name" v={recipientName} />
                <KV k="Selected partner" v="Bridge" />
                <KV k="Bridge fee" v={`$${fmt(quote.bridgeFee)}`} />
                <KV k="LamportPay fee" v={`$${fmt(quote.platformFee)}`} />
                <KV k="Recipient receives" v={`${fmt(quote.recipientAmount)} ${corridor.currency}`} />
                <KV k="Estimated delivery" v="Under 5 minutes" />
                <KV k="Payout method" v={method} />
              </div>
              <PrimaryButton onClick={() => {
                setTxHash(mockSolanaHash());
                setBridgeRef(mockBridgeRef());
                setStep(5);
              }}>Simulate Payment</PrimaryButton>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-6">
              <SectionTitle title="5. Tracking" />
              <ol className="relative border-l-2 border-border/70 ml-2">
                {timeline.map((t, i) => {
                  const done = i <= trackIdx;
                  return (
                    <li key={t} className="ml-6 pb-6 last:pb-0">
                      <span className={"absolute -left-[11px] w-5 h-5 rounded-full flex items-center justify-center border-2 " + (done ? "bg-primary border-primary text-white" : "bg-background border-border")}>
                        {done && <Check className="w-3 h-3" />}
                      </span>
                      <div className={done ? "font-medium" : "text-muted-foreground"}>{t}</div>
                    </li>
                  );
                })}
              </ol>
              {trackIdx >= timeline.length - 1 && (
                <PrimaryButton onClick={() => setStep(6)}>See receipt <ArrowRight className="w-4 h-4" /></PrimaryButton>
              )}
            </div>
          )}

          {step === 6 && (
            <Receipt
              paymentId={paymentId}
              token={token}
              amount={amount}
              quote={quote}
              corridor={corridor}
              recipientName={recipientName}
              method={method}
              bridgeRef={bridgeRef}
              txHash={txHash}
              onReset={() => {
                setStep(1);
                setKycApproved(false);
                setPaymentId("");
                setBridgeRef("");
                setTxHash("");
              }}
            />
          )}
        </div>

        <div className="mt-8 text-center text-sm text-muted-foreground">
          <Link to="/how-it-works" className="text-primary hover:underline">How the flow works →</Link>
        </div>
      </div>
    </SiteLayout>
  );
}

function Receipt(props: any) {
  const { paymentId, token, amount, quote, corridor, recipientName, method, bridgeRef, txHash, onReset } = props;
  const [copied, setCopied] = useState(false);
  const receiptText = [
    `Payment ID: ${paymentId}`,
    `Input: ${amount} ${token}`,
    `USDC settlement: ${fmt(quote.usdcSettlement)} USDC`,
    `Recipient: ${recipientName}`,
    `Country: ${corridor.country} (${corridor.currency})`,
    `Recipient receives: ${fmt(quote.recipientAmount)} ${corridor.currency}`,
    `Partner: Bridge`,
    `Bridge reference: ${bridgeRef}`,
    `Bridge fee: $${fmt(quote.bridgeFee)}`,
    `LamportPay fee: $${fmt(quote.platformFee)}`,
    `FX rate: 1 USD = ${fmt(quote.fxRate, quote.fxRate > 100 ? 0 : 2)} ${corridor.currency}`,
    `Payout method: ${method}`,
    `Solana tx (mock): ${txHash}`,
    `Status: Paid`,
  ].join("\n");
  return (
    <div className="space-y-6">
      <SectionTitle title="6. Receipt" />
      <div className="rounded-2xl bg-[image:var(--gradient-card)] border border-border/60 p-6">
        <div className="mb-5">
          <LammyCheck label="Payout complete — recipient has been paid" />
        </div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Payment ID</div>
            <div className="font-mono text-sm">{paymentId}</div>
          </div>
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-[color:var(--success)]/15 text-[color:var(--success)]">PAID</span>
        </div>
        <div className="grid md:grid-cols-2 gap-3">
          <KV k="Input token" v={token} />
          <KV k="Input amount" v={amount} />
          <KV k="USDC settlement" v={`${fmt(quote.usdcSettlement)} USDC`} />
          <KV k="Receiver country" v={corridor.country} />
          <KV k="Receiver currency" v={corridor.currency} />
          <KV k="Recipient name" v={recipientName} />
          <KV k="Recipient receives" v={`${fmt(quote.recipientAmount)} ${corridor.currency}`} />
          <KV k="Selected partner" v="Bridge" />
          <KV k="Bridge reference" v={<span className="font-mono text-xs">{bridgeRef}</span>} />
          <KV k="Bridge fee" v={`$${fmt(quote.bridgeFee)}`} />
          <KV k="LamportPay platform fee" v={`$${fmt(quote.platformFee)}`} />
          <KV k="FX rate used" v={`1 USD = ${fmt(quote.fxRate, quote.fxRate > 100 ? 0 : 2)} ${corridor.currency}`} />
          <KV k="Payout method" v={method} />
          <KV k="Mock Solana tx" v={<span className="font-mono text-[10px] break-all">{txHash}</span>} />
        </div>
      </div>
      <div className="flex flex-wrap gap-3">
        <button onClick={onReset} className="inline-flex items-center gap-2 rounded-full bg-foreground text-background px-5 py-2.5 font-semibold hover:opacity-90 transition">
          Start new payment
        </button>
        <button
          onClick={() => { navigator.clipboard.writeText(receiptText); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
          className="inline-flex items-center gap-2 rounded-full bg-card border border-border px-5 py-2.5 font-semibold hover:bg-secondary transition"
        >
          {copied ? <><Check className="w-4 h-4" /> Copied</> : <><Copy className="w-4 h-4" /> Copy receipt details</>}
        </button>
      </div>
    </div>
  );
}

function Stepper({ current, labels }: { current: number; labels: string[] }) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto">
      {labels.map((l, i) => {
        const n = i + 1;
        const active = n === current;
        const done = n < current;
        return (
          <div key={l} className="flex items-center gap-2 shrink-0">
            <div className={"w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold " + (done ? "bg-primary text-white" : active ? "bg-foreground text-background" : "bg-secondary text-muted-foreground")}>
              {done ? <Check className="w-3.5 h-3.5" /> : n}
            </div>
            <div className={"text-sm " + (active ? "font-semibold" : "text-muted-foreground")}>{l}</div>
            {i < labels.length - 1 && <div className="w-6 h-px bg-border mx-1" />}
          </div>
        );
      })}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <div className="text-xs font-medium text-muted-foreground">{label}</div>
      {children}
    </label>
  );
}

function KV({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="rounded-xl bg-secondary/60 px-4 py-3">
      <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{k}</div>
      <div className="font-semibold mt-0.5 break-words">{v}</div>
    </div>
  );
}

function SectionTitle({ title }: { title: string }) {
  return <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>;
}

function PrimaryButton({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} className="inline-flex items-center gap-2 rounded-full bg-[image:var(--gradient-hero)] text-white px-6 py-3 font-semibold shadow-[var(--shadow-soft)] hover:opacity-95 transition">
      {children}
    </button>
  );
}

function NavButtons({ onBack, onNext, nextLabel }: { onBack: () => void; onNext: () => void; nextLabel: string }) {
  return (
    <div className="flex flex-wrap gap-3">
      <button onClick={onBack} className="inline-flex items-center gap-2 rounded-full bg-card border border-border px-5 py-2.5 font-semibold hover:bg-secondary transition">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>
      <PrimaryButton onClick={onNext}>{nextLabel} <ArrowRight className="w-4 h-4" /></PrimaryButton>
    </div>
  );
}