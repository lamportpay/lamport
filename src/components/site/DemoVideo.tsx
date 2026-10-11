import { useRef, useState } from "react";
import { Play, RotateCcw, Clock3, Volume2 } from "lucide-react";
import demoVideo from "@/assets/LamportPay-Demo-60s.mp4.asset.json";
import demoCover from "@/assets/lamportpay-demo-cover.jpg.asset.json";

// 60-second product walkthrough, recorded in test mode (devnet + partner sandbox).
const BEATS = [
  { t: "0:00", k: "The problem", d: "Cashing out a Solana asset today is a maze." },
  { t: "0:12", k: "Swap layer", d: "Any supported Solana asset → USDC, you sign the swap." },
  { t: "0:24", k: "Payout flow", d: "Quote first, then bank details, verification, one signature." },
];

export function DemoVideo() {
  const ref = useRef<HTMLVideoElement | null>(null);
  const [started, setStarted] = useState(false);
  const [ended, setEnded] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [coverOk, setCoverOk] = useState(true);

  function play() {
    const v = ref.current;
    if (!v) return;
    setStarted(true);
    setEnded(false);
    v.play().catch(() => {});
  }

  function replay() {
    const v = ref.current;
    if (!v) return;
    v.currentTime = 0;
    setEnded(false);
    v.play().catch(() => {});
  }

  return (
    <section className="relative mt-28 md:mt-36 overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[420px] rounded-full bg-[image:var(--gradient-hero)] opacity-[0.07] blur-3xl" />
      </div>

      <div className="max-w-5xl mx-auto px-5">
        <div className="text-center max-w-2xl mx-auto">
          <div className="text-xs font-semibold uppercase tracking-wider text-primary">
            Watch the walkthrough
          </div>
          <h2 className="mt-2 text-3xl md:text-4xl font-semibold tracking-tight">
            LamportPay in 60 seconds.
          </h2>
          <p className="mt-3 text-muted-foreground leading-relaxed">
            From a Solana asset in your wallet to a bank payout request — the whole flow, start to
            finish.
          </p>
        </div>

        <div className="mt-10 rounded-3xl border border-border/60 bg-card/80 backdrop-blur p-2 md:p-3 shadow-[var(--shadow-elegant)] hover:shadow-[var(--shadow-neon)] transition">
          <div className="relative aspect-video rounded-2xl overflow-hidden bg-secondary">
            <div className="absolute inset-0 bg-[image:var(--gradient-uv)] opacity-15" />
            {!playing && coverOk && (
              <img
                src={demoCover.url}
                alt="LamportPay payout quote screen"
                onError={() => setCoverOk(false)}
                className="absolute inset-0 w-full h-full object-cover"
              />
            )}
            <video
              ref={ref}
              src={demoVideo.url}
              poster={demoCover.url}
              preload="none"
              playsInline
              controls={started}
              onPlaying={() => setPlaying(true)}
              onEnded={() => setEnded(true)}
              className="absolute inset-0 w-full h-full object-cover"
            />

            {!started && (
              <button
                type="button"
                onClick={play}
                aria-label="Play the 60-second LamportPay walkthrough"
                className="absolute inset-0 group flex items-center justify-center bg-foreground/10 hover:bg-foreground/5 transition"
              >
                <span className="relative flex items-center justify-center w-20 h-20 md:w-24 md:h-24 rounded-full bg-[image:var(--gradient-uv)] text-white shadow-[var(--shadow-neon)] transition group-hover:scale-105">
                  <Play className="w-8 h-8 md:w-9 md:h-9 translate-x-0.5 fill-current" />
                </span>
              </button>
            )}

            {ended && (
              <button
                type="button"
                onClick={replay}
                aria-label="Replay the walkthrough"
                className="absolute inset-0 flex items-center justify-center bg-foreground/30 transition"
              >
                <span className="flex items-center gap-2 rounded-full bg-card/90 backdrop-blur px-5 py-3 font-semibold text-sm shadow-[var(--shadow-elegant)]">
                  <RotateCcw className="w-4 h-4" /> Watch again
                </span>
              </button>
            )}
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Clock3 className="w-3.5 h-3.5" /> 0:58
          </span>
          <span className="flex items-center gap-1.5">
            <Volume2 className="w-3.5 h-3.5" /> With sound
          </span>
          <span className="rounded-full border border-[color:var(--warning)]/40 bg-card/70 px-3 py-1 font-medium">
            DEMO · TEST MODE
          </span>
        </div>

        <div className="mt-8 grid gap-3 md:grid-cols-3">
          {BEATS.map((b) => (
            <div
              key={b.k}
              className="rounded-2xl p-5 bg-card/80 backdrop-blur border border-border/60 hover:border-primary/40 transition"
            >
              <div className="font-mono text-xs text-primary">{b.t}</div>
              <div className="mt-1.5 font-semibold leading-snug">{b.k}</div>
              <div className="mt-1 text-sm text-muted-foreground leading-relaxed">{b.d}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
