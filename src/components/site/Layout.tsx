import { Link } from "@tanstack/react-router";
import { Menu, X } from "lucide-react";
import { useState, type ReactNode } from "react";

const nav = [
  { to: "/send", label: "Send" },
  { to: "/how-it-works", label: "How it works" },
  { to: "/whitepaper", label: "White paper" },
  { to: "/compliance", label: "Compliance" },
  { to: "/docs", label: "Docs" },
  { to: "/contact", label: "Contact" },
] as const;

export function SiteLayout({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <header className="sticky top-0 z-40 backdrop-blur-lg bg-background/75 border-b border-border/60">
        <div className="max-w-7xl mx-auto px-5 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-[image:var(--gradient-hero)] shadow-[var(--shadow-soft)] flex items-center justify-center text-white font-bold">
              L
            </div>
            <span className="font-semibold tracking-tight text-lg">LamportPay</span>
          </Link>
          <nav className="hidden lg:flex items-center gap-1">
            {nav.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                className="px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors rounded-md"
                activeProps={{ className: "px-3 py-2 text-sm text-foreground font-medium rounded-md" }}
              >
                {n.label}
              </Link>
            ))}
          </nav>
          <div className="hidden lg:flex items-center gap-2">
            <Link
              to="/send"
              className="px-4 py-2 text-sm font-medium rounded-full bg-foreground text-background hover:opacity-90 transition"
            >
              Start demo
            </Link>
          </div>
          <button
            className="lg:hidden p-2 rounded-md hover:bg-muted"
            onClick={() => setOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
        {open && (
          <div className="lg:hidden border-t border-border bg-background">
            <div className="max-w-7xl mx-auto px-5 py-3 flex flex-col gap-1">
              {nav.map((n) => (
                <Link
                  key={n.to}
                  to={n.to}
                  onClick={() => setOpen(false)}
                  className="px-3 py-2 text-sm rounded-md hover:bg-muted"
                >
                  {n.label}
                </Link>
              ))}
              <Link
                to="/send"
                onClick={() => setOpen(false)}
                className="mt-2 px-4 py-2 text-center text-sm font-medium rounded-full bg-foreground text-background"
              >
                Start demo
              </Link>
            </div>
          </div>
        )}
      </header>
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  );
}

function SiteFooter() {
  return (
    <footer className="border-t border-border/60 mt-24 bg-secondary/40">
      <div className="max-w-7xl mx-auto px-5 py-12 grid gap-10 md:grid-cols-4">
        <div className="md:col-span-2">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-[image:var(--gradient-hero)] flex items-center justify-center text-white font-bold">L</div>
            <span className="font-semibold text-lg">LamportPay</span>
          </div>
          <p className="text-sm text-muted-foreground max-w-sm">
            Crypto in. Local money out. A Solana-first crypto-to-local-currency payment routing demo.
          </p>
        </div>
        <div>
          <div className="text-sm font-semibold mb-3">Product</div>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link to="/send" className="hover:text-foreground">Send demo</Link></li>
            <li><Link to="/how-it-works" className="hover:text-foreground">How it works</Link></li>
            <li><Link to="/docs" className="hover:text-foreground">Developer docs</Link></li>
          </ul>
        </div>
        <div>
          <div className="text-sm font-semibold mb-3">Company</div>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link to="/whitepaper" className="hover:text-foreground">White paper</Link></li>
            <li><Link to="/compliance" className="hover:text-foreground">Compliance</Link></li>
            <li><Link to="/contact" className="hover:text-foreground">Contact</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border/60">
        <div className="max-w-7xl mx-auto px-5 py-5 text-xs text-muted-foreground">
          Demo only. LamportPay does not currently process real crypto, fiat, KYC, FX conversion, or bank payouts.
        </div>
      </div>
    </footer>
  );
}