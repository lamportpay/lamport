/**
 * Solana-inspired flowing ribbon for the homepage hero: layered glossy
 * gradient waves that drift slowly across the hero. Decorative only —
 * aria-hidden, sits behind the content, and freezes for reduced motion.
 */
import { useId } from "react";

export function HeroRibbon({ variant = "hero" }: { variant?: "hero" | "compact" }) {
  const uid = useId().replace(/:/g, "");
  return (
    <div className={variant === "compact" ? "hero-ribbon hero-ribbon-compact" : "hero-ribbon"} aria-hidden="true">
      <svg
        className="hero-ribbon-svg"
        viewBox="0 0 1440 560"
        preserveAspectRatio="xMidYMid slice"
        focusable="false"
      >
        <defs>
          <linearGradient id={`hrg1-${uid}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0" />
            <stop offset="25%" stopColor="#3b82f6" stopOpacity="0.55" />
            <stop offset="55%" stopColor="#8b5cf6" stopOpacity="0.7" />
            <stop offset="80%" stopColor="#6366f1" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
          </linearGradient>
          <linearGradient id={`hrg2-${uid}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0" />
            <stop offset="30%" stopColor="#a78bfa" stopOpacity="0.4" />
            <stop offset="60%" stopColor="#3b82f6" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
          </linearGradient>
          <linearGradient id={`hrg3-${uid}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#6366f1" stopOpacity="0" />
            <stop offset="40%" stopColor="#6366f1" stopOpacity="0.25" />
            <stop offset="70%" stopColor="#8b5cf6" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Back soft band */}
        <path
          className="hero-ribbon-path hero-ribbon-path-3"
          d="M-80 400 C 200 320, 380 470, 640 380 S 1080 240, 1520 340"
          fill="none"
          stroke={`url(#hrg3-${uid})`}
          strokeWidth="90"
          strokeLinecap="round"
        />
        {/* Middle band */}
        <path
          className="hero-ribbon-path hero-ribbon-path-2"
          d="M-80 380 C 220 300, 400 450, 660 360 S 1100 220, 1520 320"
          fill="none"
          stroke={`url(#hrg2-${uid})`}
          strokeWidth="46"
          strokeLinecap="round"
        />
        {/* Front glossy line */}
        <path
          className="hero-ribbon-path hero-ribbon-path-1"
          d="M-80 360 C 240 280, 420 430, 680 340 S 1120 200, 1520 300"
          fill="none"
          stroke={`url(#hrg1-${uid})`}
          strokeWidth="16"
          strokeLinecap="round"
        />
        {/* Thin highlight that travels along the front line */}
        <path
          className="hero-ribbon-path hero-ribbon-shine"
          d="M-80 360 C 240 280, 420 430, 680 340 S 1120 200, 1520 300"
          fill="none"
          stroke="#ffffff"
          strokeOpacity="0.7"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray="120 1600"
        />
      </svg>
    </div>
  );
}
