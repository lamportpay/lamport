import { Link } from "@tanstack/react-router";
import { Cookie, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

const KEY = "lamportpay-cookie-consent";
const OPEN_EVENT = "lamportpay:open-cookie-settings";

export type CookieChoice = "all" | "essential";

export function openCookieSettings() {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(OPEN_EVENT));
}

export function CookieConsent() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      if (!window.localStorage.getItem(KEY)) setOpen(true);
    } catch {
      setOpen(true);
    }
    const show = () => setOpen(true);
    window.addEventListener(OPEN_EVENT, show);
    return () => window.removeEventListener(OPEN_EVENT, show);
  }, []);

  // Keep the footer's legal line clear of the banner while it is open.
  useEffect(() => {
    document.body.classList.toggle("has-cookie-banner", open);
    return () => document.body.classList.remove("has-cookie-banner");
  }, [open]);

  const choose = (choice: CookieChoice) => {
    try {
      window.localStorage.setItem(
        KEY,
        JSON.stringify({ choice, at: new Date().toISOString(), version: 1 }),
      );
    } catch {
      /* storage blocked: banner simply closes for this visit */
    }
    setOpen(false);
  };

  if (!open) return null;

  return (
    <div
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
        wallet session and secure payments. We do not use advertising cookies.{" "}
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
