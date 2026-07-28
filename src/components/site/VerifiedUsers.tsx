import { useMemo } from "react";
import { CheckCircle2, Globe2, ShieldCheck } from "lucide-react";
import face1 from "@/assets/face-1.jpg";
import face2 from "@/assets/face-2.jpg";
import face3 from "@/assets/face-3.jpg";
import face4 from "@/assets/face-4.jpg";
import face5 from "@/assets/face-5.jpg";
import face6 from "@/assets/face-6.jpg";
import face7 from "@/assets/face-7.jpg";
import face8 from "@/assets/face-8.jpg";

const FACES = [face1, face2, face3, face4, face5, face6, face7, face8];

const PEOPLE = [
  { name: "Ayesha K.", city: "Karachi", corridor: "USDC → PKR" },
  { name: "Rahul M.", city: "Mumbai", corridor: "SOL → INR" },
  { name: "Chidi O.", city: "Lagos", corridor: "USDC → NGN" },
  { name: "Marco B.", city: "Manila", corridor: "JUP → PHP" },
  { name: "Leila H.", city: "Casablanca", corridor: "USDC → MAD" },
  { name: "Daniel S.", city: "Nairobi", corridor: "USDT → KES" },
  { name: "Mei L.", city: "Jakarta", corridor: "SOL → IDR" },
  { name: "Omar A.", city: "Dubai", corridor: "USDC → AED" },
  { name: "Grace T.", city: "Accra", corridor: "USDC → GHS" },
  { name: "Yusuf R.", city: "Istanbul", corridor: "USDT → TRY" },
  { name: "Priya N.", city: "Chennai", corridor: "USDC → INR" },
  { name: "Ines F.", city: "Lisbon", corridor: "SOL → EUR" },
];

type Person = (typeof PEOPLE)[number] & { src: string };

function row(offset: number): Person[] {
  return PEOPLE.map((p, i) => ({
    ...p,
    src: FACES[(i + offset) % FACES.length],
  }));
}

function AvatarCard({ p }: { p: Person }) {
  return (
    <div className="group flex items-center gap-3 shrink-0 rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur px-3 py-2.5 pr-5 hover:border-[color:var(--neon-violet)]/50 hover:bg-white/[0.07] transition-colors">
      <div className="relative">
        <div className="absolute -inset-0.5 rounded-full bg-gradient-to-br from-[color:var(--neon-violet)] to-[color:var(--neon-magenta)] opacity-60 blur-[3px] group-hover:opacity-100 transition-opacity" />
        <img
          src={p.src}
          alt=""
          loading="lazy"
          className="relative w-11 h-11 rounded-full object-cover border border-white/20"
        />
        <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-[color:var(--success)] border-2 border-[oklch(0.09_0.04_275)] flex items-center justify-center">
          <CheckCircle2 className="w-2.5 h-2.5 text-black" strokeWidth={3.5} />
        </span>
      </div>
      <div className="leading-tight">
        <div className="text-sm text-white/90 font-medium whitespace-nowrap">{p.name}</div>
        <div className="text-[10px] font-mono uppercase tracking-widest text-white/45 whitespace-nowrap">
          {p.city} · {p.corridor}
        </div>
      </div>
    </div>
  );
}

function Rail({ people, dir }: { people: Person[]; dir: "left" | "right" }) {
  const doubled = [...people, ...people];
  return (
    <div className="overflow-hidden">
      <div
        className={`flex gap-3 w-max ${dir === "left" ? "animate-rail-left" : "animate-rail-right"}`}
      >
        {doubled.map((p, i) => (
          <AvatarCard key={i} p={p} />
        ))}
      </div>
    </div>
  );
}

export function VerifiedUsers() {
  const rows = useMemo(() => [row(0), row(3), row(6)], []);
  return (
    <section className="relative mt-24 md:mt-32 overflow-hidden">
      <div className="absolute inset-0 bg-[oklch(0.09_0.04_275)]" />
      <div className="absolute inset-0 bg-grid-uv opacity-40" />
      <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-background to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-background to-transparent" />
      <div className="absolute left-1/2 top-1/3 -translate-x-1/2 w-[720px] h-[720px] rounded-full bg-[oklch(0.62_0.28_295)] opacity-20 blur-3xl pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-5 py-24 md:py-32">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 text-[11px] font-mono uppercase tracking-widest text-white/70 border border-white/10 rounded-full px-3 py-1.5 bg-black/40 backdrop-blur">
            <span className="w-1.5 h-1.5 rounded-full bg-[color:var(--success)] animate-live-dot" />
            Trusted by senders across 40+ corridors
          </div>
          <h2 className="mt-6 text-6xl md:text-8xl font-semibold tracking-tight text-white tabular-nums">
            <span className="bg-gradient-to-b from-white to-white/70 bg-clip-text text-transparent">
              2,400,000<span className="text-uv">+</span>
            </span>
          </h2>
          <div className="mt-3 text-sm md:text-base text-white/60 flex items-center justify-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[color:var(--success)]" />
            Verified users · sending crypto home every day
          </div>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4 text-[11px] font-mono uppercase tracking-widest text-white/50">
            <span className="flex items-center gap-1.5"><Globe2 className="w-3.5 h-3.5" /> 180 countries</span>
            <span className="w-1 h-1 rounded-full bg-white/30" />
            <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-[color:var(--success)]" /> 99.98% success</span>
            <span className="w-1 h-1 rounded-full bg-white/30" />
            <span>24/7 · never sleeps</span>
          </div>
        </div>

        {/* Scrolling verified-sender rails */}
        <div className="rail-group relative mt-14 md:mt-20 space-y-3 [mask-image:linear-gradient(to_right,transparent,black_12%,black_88%,transparent)]">
          <Rail people={rows[0]} dir="left" />
          <Rail people={rows[1]} dir="right" />
          <Rail people={rows[2]} dir="left" />
        </div>
      </div>
    </section>
  );
}
