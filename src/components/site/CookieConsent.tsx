import { Link } from "@tanstack/react-router";
import { Cookie, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";

import { COOKIE_KEY as KEY, COOKIE_VERSION, COOKIE_CHANGE_EVENT, readCookieChoice, type CookieChoice } from "@/lib/analytics-consent";
const OPEN_EVENT = "lamportpay:open-cookie-settings";

export type { CookieChoice } from "@/lib/analytics-consent";

export function openCookieSettings() {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(OPEN_EVENT));
}

export function CookieConsent() {
  const [open, setOpen] = useState(false);
  const bannerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    try {
      if (!readCookieChoice(window.localStorage.getItem(KEY))) setOpen(true);
    } catch {
      setOpen(true);
    }
    const show = () => setOpen(true);
    window.addEventListener(OPEN_EVENT, show);
    return () => window.removeEventListener(OPEN_EVENT, show);
  }, []);

  // Keep the footer's legal line clear of the banner while it is open: publish the
  // banner's real height so the page can reserve exactly that much space.
  useEffect(() => {
    document.body.classList.toggle("has-cookie-banner", open);
    if (!open) return;

    const setHeight = () => {
      const h = bannerRef.current?.offsetHeight ?? 0;
      if (h) document.body.style.setProperty("--cookie-banner-height", `${h}px`);
    };
    setHeight();

    const observer =
      typeof ResizeObserver !== "undefined" ? new ResizeObserver(setHeight) : undefined;
    if (bannerRef.current && observer) observer.observe(bannerRef.current);
    window.addEventListener("resize", setHeight);

    return () => {
      document.body.classList.remove("has-cookie-banner");
      document.body.style.removeProperty("--cookie-banner-height");
      observer?.disconnect();
      window.removeEventListener("resize", setHeight);
    };
  }, [open]);

  const choose = (choice: CookieChoice) => {
    try {
      window.localStorage.setItem(
        KEY,
        JSON.stringify({ choice, at: new Date().toISOString(), version: COOKIE_VERSION }),
      );
    } catch {
      /* storage blocked: banner simply closes for this visit */
    }
    window.dispatchEvent(new Event(COOKIE_CHANGE_EVENT));
    setOpen(false);
  };

  if (!open) return null;

  return (
    <div
      ref={bannerRef}
      role="dialog"
      aria-modal="false"
      aria-labelledby="cookie-title"
      className="fixed z-50 left-3 right-3 bottom-[calc(2.5rem+env(safe-area-inset-bottom))] sm:left-5 sm:right-auto sm:max-w-sm rounded-2xl border border-border bg-card text-card-foreground shadow-xl p-5 print:hidden"
    >
      <button
        type="button"
        onClick={() => choose("essential")}
        aria-label="Close and keep essential cookies only"
        className="absolute top-3 right-3 rounded-md p-1 text-muted-foreground hover:text-foreground"
      >
        <X className="w-4 h-4" />
      </button>
      <div className="flex items-center gap-2 mb-2">
        <span className="inline-flex w-8 h-8 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Cookie className="w-4 h-4" />
        </span>
        <h2 id="cookie-title" className="font-semibold">
          We use cookies
        </h2>
      </div>
      <p className="text-sm text-muted-foreground">
        LamportPay uses essential cookies and browser storage to keep you signed in, remember your
        wallet session and secure payments. With your permission, Google Analytics helps us understand visits to public pages. We do not use advertising cookies.{" "}
        <Link to="/cookies" className="text-primary underline underline-offset-2">
          Cookie policy
        </Link>
      </p>
      <div className="mt-4 flex gap-2">
        <Button size="sm" className="flex-1" onClick={() => choose("all")}>
          Accept all
        </Button>
        <Button size="sm" variant="outline" className="flex-1" onClick={() => choose("essential")}>
          Essential only
        </Button>
      </div>
    </div>
  );
}
