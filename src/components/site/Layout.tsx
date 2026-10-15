import { Link, useRouterState } from "@tanstack/react-router";
import { BrandFrame, PageHeroDecor } from "@/components/site/BrandFrame";
import { Menu, ArrowRight, Twitter, Linkedin, Github, Mail } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import logoUrl from "@/assets/lamportpay-logo.png";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetTrigger, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { CookieConsent, openCookieSettings } from "@/components/site/CookieConsent";
import { ColosseumBanner } from "@/components/site/ColosseumBanner";
import { CryptoPriceTicker } from "@/components/site/CryptoPriceTicker";
import { ScrollReveal } from "@/components/site/ScrollReveal";

export function BrandLogo({ className = "" }: { className?: string }) {
  return (
    <img
      src={logoUrl}
      alt="LamportPay"
      width={154}
      height={32}
      className={cn("block h-8 w-auto", className)}
    />
  );
}

const nav = [
  { to: "/how-it-works", label: "How it works" },
  { to: "/docs", label: "Docs" },
  { to: "/roadmap", label: "Roadmap" },
  { to: "/about", label: "About us" },
  { to: "/people", label: "Our people" },
  { to: "/contact", label: "Contact" },
] as const;

const primaryNav = [
  { to: "/how-it-works", label: "How it works" },
  { to: "/docs", label: "Docs" },
  { to: "/roadmap", label: "Roadmap" },
  { to: "/about", label: "About us" },
  { to: "/people", label: "Our people" },
  { to: "/contact", label: "Contact" },
] as const;

export function SiteLayout({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const pathname = useRouterState({ select: (st) => st.location.pathname });
  const isHome = pathname === "/";
  const [scrolled, setScrolled] = useState(false);
  const headerRef = useRef<HTMLElement>(null);
  const [headerH, setHeaderH] = useState(0);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  useEffect(() => {
    const el = headerRef.current;
    if (!el) return;
    // Only the header's resting height (without the news banner that appears on scroll).
    const measure = () => {
      const banner = el.querySelector<HTMLElement>("[data-header-banner]");
      setHeaderH(el.offsetHeight - (banner?.offsetHeight ?? 0));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return (
    <div
      className="min-h-screen flex flex-col bg-background text-foreground"
      style={{ ["--site-header-h" as string]: `${headerH}px` }}
    >
      <BrandFrame />
      <header
        ref={headerRef}
        style={{ marginBottom: `-${headerH}px` }}
        className={cn(
          "sticky top-0 z-40 border-b transition-colors duration-300 print:hidden",
          scrolled
            ? "border-border/60 bg-background shadow-sm"
            : "border-transparent bg-transparent",
        )}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-5 h-16 flex items-center justify-between gap-3">
          <Link to="/" className="flex items-center group" aria-label="LamportPay home">
            <BrandLogo />
          </Link>
          <nav aria-label="Primary navigation" className="hidden md:flex items-center gap-1">
            {primaryNav.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                className="px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground focus-visible:outline-2 focus-visible:outline-ring transition-colors rounded-md"
                activeProps={{
                  className: "px-3 py-2 text-sm text-foreground font-medium rounded-md",
                }}
              >
                {n.label}
              </Link>
            ))}
          </nav>
          <div className="ml-auto flex shrink-0 items-center gap-1 md:ml-0">
          <Button asChild className="h-10 rounded-lg px-4">
            <Link to="/pay">Open App</Link>
          </Button>
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden shrink-0" aria-label="Open menu">
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" aria-describedby={undefined} className="flex h-dvh w-[min(88vw,360px)] flex-col gap-0 p-0 motion-reduce:animate-none motion-reduce:transition-none [&>button]:top-5 [&>button]:right-5 [&>button]:p-2">
              <div className="flex h-20 shrink-0 items-center border-b border-border/60 px-6 pr-16">
                <SheetTitle><BrandLogo className="h-7" /></SheetTitle>
              </div>
              <nav aria-label="Mobile navigation" className="min-h-0 flex-1 overflow-y-auto px-4 py-5">
              {nav.map((n) => (
                <Link
                  key={n.to}
                  to={n.to}
                  onClick={() => setOpen(false)}
                  className="group flex min-h-12 items-center justify-between gap-3 rounded-lg px-3 py-3 text-base text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                  activeProps={{ className: "bg-accent text-accent-foreground font-semibold" }}
                >
                  {n.label}
                  <ArrowRight className="h-4 w-4 shrink-0 opacity-40 group-hover:opacity-100" />
                </Link>
              ))}
              </nav>
              <div className="shrink-0 border-t border-border/60 px-6 pt-5 pb-[max(24px,env(safe-area-inset-bottom))]">
              <Button asChild className="h-12 w-full rounded-lg">
              <Link
                to="/pay"
                onClick={() => setOpen(false)}
              >
                Swap <ArrowRight className="h-4 w-4" />
              </Link>
              </Button>
              <div className="mt-5 flex items-center gap-3">
                {socialLinks.map(({ label, href, icon: Icon }) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    className="inline-flex items-center justify-center w-9 h-9 rounded-full border border-border/60 text-muted-foreground hover:text-foreground transition"
                  >
                    <Icon className="w-4 h-4" />
                  </a>
                ))}
              </div>
              </div>
            </SheetContent>
          </Sheet>
          </div>
        </div>
        <div
          className={cn(
            "transition-colors duration-300",
            scrolled ? "bg-background" : "bg-transparent",
          )}
        >
          <CryptoPriceTicker inline />
        </div>
        <div
          className={cn(
            "grid transition-all duration-300",
            scrolled
              ? "grid-rows-[1fr] opacity-100"
              : "grid-rows-[0fr] opacity-0",
          )}
          aria-hidden={!scrolled}
        >
          <div className="min-h-0 overflow-hidden">
            <ColosseumBanner />
          </div>
        </div>
      </header>
      <main className={cn("flex-1", !isHome && "site-subpage relative isolate")}>
        {!isHome && <PageHeroDecor pathname={pathname} />}
        <ScrollReveal />
        {children}
      </main>
      <SiteFooter />
      <CookieConsent />
    </div>
  );
}

const socialLinks = [
  { label: "X (Twitter)", href: "https://x.com/LamportPay", icon: Twitter },
  { label: "LinkedIn", href: "https://www.linkedin.com/company/lamportpay", icon: Linkedin },
  { label: "GitHub", href: "https://github.com/lamportpay", icon: Github },
] as const;

const contactEmail = "hello@lamportpay.com";

function SiteFooter() {
  return (
    <footer className="site-footer relative overflow-hidden mt-24 text-white print:hidden">
      <div aria-hidden className="site-footer-glow pointer-events-none absolute inset-0" />
      <div className="relative max-w-7xl mx-auto px-5 py-12 grid gap-10 grid-cols-2 md:grid-cols-5">
        <div className="col-span-2">
          <BrandLogo className="mb-3 site-footer-logo" />
          <p className="text-sm text-white/80 max-w-sm">
            Crypto in. Local money out. Convert USDC from your own Solana wallet into local currency
            in the bank account you choose.

          </p>
          <div className="mt-4 flex items-center gap-2">
            {socialLinks.map(({ label, href, icon: Icon }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                className="inline-flex items-center justify-center w-9 h-9 rounded-full border border-white/30 bg-white/10 text-white/85 hover:text-white hover:bg-white/20 transition"
              >
                <Icon className="w-4 h-4" />
              </a>
            ))}
            <a
              href={`mailto:${contactEmail}`}
              aria-label={`Email ${contactEmail}`}
              className="inline-flex items-center justify-center w-9 h-9 rounded-full border border-white/30 bg-white/10 text-white/85 hover:text-white hover:bg-white/20 transition"
            >
              <Mail className="w-4 h-4" />
            </a>
          </div>
          <a
            href={`mailto:${contactEmail}`}
            className="mt-3 inline-flex items-center gap-2 text-sm text-white/80 hover:text-white transition"
          >
            <Mail className="w-3.5 h-3.5" />
            {contactEmail}
          </a>
        </div>
        <div>
          <div className="text-sm font-semibold mb-3 text-white">Product</div>
          <ul className="space-y-2 text-sm text-white/80">
            <li>
              <Link to="/pay" className="hover:text-white">
                Swap
              </Link>
            </li>
            <li>
              <Link to="/how-it-works" className="hover:text-white">
                How it works
              </Link>
            </li>
            <li>
              <Link to="/workflow" className="hover:text-white">
                Workflow overview
              </Link>
            </li>
            <li>
              <Link to="/docs" className="hover:text-white">
                Docs
              </Link>
            </li>
            <li>
              <Link to="/technology" className="hover:text-white">
                Technology
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <div className="text-sm font-semibold mb-3 text-white">Company</div>
          <ul className="space-y-2 text-sm text-white/80">
            <li>
              <Link to="/about" className="hover:text-white">
                About us
              </Link>
            </li>
            <li>
              <Link to="/people" className="hover:text-white">
                Our people
              </Link>
            </li>
            <li>
              <Link to="/partners" className="hover:text-white">
                Partners
              </Link>
            </li>
            <li>
              <Link to="/roadmap" className="hover:text-white">
                Roadmap
              </Link>
            </li>
            <li>
              <Link to="/whitepaper" className="hover:text-white">
                White paper
              </Link>
            </li>
            <li>
              <Link to="/blog" className="hover:text-white">
                Blog
              </Link>
            </li>
            <li>
              <Link to="/contact" className="hover:text-white">
                Contact
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <div className="text-sm font-semibold mb-3 text-white">Legal</div>
          <ul className="space-y-2 text-sm text-white/80">
            <li>
              <Link to="/compliance" className="hover:text-white">
                Compliance
              </Link>
            </li>
            <li>
              <Link to="/cookies" className="hover:text-white">
                Cookie policy
              </Link>
            </li>
            <li>
              <button type="button" onClick={openCookieSettings} className="hover:text-white">
                Cookie settings
              </button>
            </li>
          </ul>
        </div>
      </div>
      <div className="relative border-t border-white/20">
        <div className="site-footer-legal max-w-7xl mx-auto px-5 py-5 space-y-2 text-xs text-white/75">
          <div>
            <span className="font-medium text-white">Lamport Pay Ltd</span> — legal entity
            operating the <span className="font-medium text-white">LamportPay</span> platform.
            Contact:{" "}
            <a href={`mailto:${contactEmail}`} className="hover:text-white underline">
              {contactEmail}
            </a>
          </div>
          <div>
            LamportPay is non-custodial: it never holds customer funds or keys. Identity
            verification, currency conversion and bank payouts are provided by a licensed payout
            partner. LamportPay is in a controlled test phase; availability depends on country and
            currency.
          </div>
        </div>
      </div>
    </footer>
  );
}
