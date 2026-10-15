import {
  BookOpen, Building2, Cookie, Cpu, FileText, GitBranch, Handshake, Map,
  Mail, Newspaper, ShieldCheck, Sparkles, Workflow, type LucideIcon, Users } from "lucide-react";
import { HeroRibbon } from "@/components/site/HeroRibbon";

/** Brand wave lines running down both page edges (desktop only, decorative). */
export function BrandFrame() {
  const wave = (side: "left" | "right") => (
    <svg className={`brand-frame brand-frame-${side}`} viewBox="0 0 40 800" preserveAspectRatio="none" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id={`bf-${side}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3b82f6" stopOpacity="0" />
          <stop offset="30%" stopColor="#3b82f6" stopOpacity="0.55" />
          <stop offset="65%" stopColor="#8b5cf6" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path className="brand-frame-line" d="M20 0 C 36 100, 4 200, 20 300 S 36 500, 20 600 S 4 750, 20 800" fill="none" stroke={`url(#bf-${side})`} strokeWidth="2.5" />
      <path className="brand-frame-line brand-frame-line-2" d="M14 0 C 30 120, 0 220, 14 330 S 32 520, 14 620 S 2 760, 14 800" fill="none" stroke={`url(#bf-${side})`} strokeWidth="1.2" strokeOpacity="0.6" />
    </svg>
  );
  return (
    <div className="print:hidden" aria-hidden="true">
      {wave("left")}
      {wave("right")}
    </div>
  );
}

const ICONS: Array<[string, LucideIcon]> = [
  ["/how-it-works", Sparkles], ["/workflow", Workflow], ["/docs", BookOpen],
  ["/whitepaper", FileText], ["/roadmap", Map], ["/about", Building2], ["/people", Users],
  ["/partners", Handshake], ["/technology", Cpu], ["/blog", Newspaper],
  ["/compliance", ShieldCheck], ["/cookies", Cookie], ["/contact", Mail],
];

/** Compact sub-hero backdrop for inner pages: soft wash, brand wave, page icon. */
export function PageHeroDecor({ pathname }: { pathname: string }) {
  const Icon = ICONS.find(([p]) => pathname.startsWith(p))?.[1] ?? GitBranch;
  return (
    <div className="page-hero-decor" aria-hidden="true">
      <HeroRibbon variant="compact" />
      <div className={`page-hero-icon${pathname.startsWith("/people") ? " page-hero-icon-low" : ""}`}>
        <span className="page-hero-icon-ring" />
        <span className="page-hero-icon-ring page-hero-icon-ring-2" />
        <Icon className="page-hero-icon-glyph h-10 w-10" strokeWidth={1.6} />
      </div>
    </div>
  );
}
