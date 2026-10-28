import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/Layout";
import { Button } from "@/components/ui/button";
import { openCookieSettings } from "@/components/site/CookieConsent";
import { pageSeo } from "@/lib/seo";

export const Route = createFileRoute("/cookies")({
  head: () =>
    pageSeo({
      path: "/cookies",
      title: "Cookie policy — LamportPay",
      description:
        "Which cookies and browser storage LamportPay uses, why we use them, and how to change your choice.",
    }),
  component: CookiesPage,
});

const rows = [
  {
    name: "Google Analytics (_ga, _ga_*)",
    type: "Optional analytics",
    purpose: "Measures visits to public pages only after you accept optional cookies. No wallet addresses, payment details, account information or chat content are sent by our tracking code.",
    duration: "Up to 2 years; removed on this site when you choose Essential only",
  },
  {
    name: "Sign-in session",
    type: "Essential",
    purpose: "Keeps you signed in to your LamportPay account after wallet or email sign-in.",
    duration: "Until you sign out or the session expires",
  },
  {
    name: "Wallet connection",
    type: "Essential",
    purpose: "Remembers which Solana wallet you connected so you don't have to reconnect on every page.",
    duration: "Until you disconnect the wallet",
  },
  {
    name: "Payment progress",
    type: "Essential",
    purpose: "Keeps payout details you checked during one payment, so returning from identity verification doesn't ask again.",
    duration: "Current browser tab only",
  },
  {
    name: "Payment history copy",
    type: "Functional",
    purpose: "A local copy of your recent payments for faster loading. The server record stays authoritative.",
    duration: "Until you clear browser data",
  },
  {
    name: "Cookie choice",
    type: "Essential",
    purpose: "Remembers your answer to the cookie notice.",
    duration: "12 months",
  },
];

function CookiesPage() {
  return (
    <SiteLayout>
      <section className="max-w-4xl mx-auto px-5 pt-16 pb-8">
        <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-3">Legal</p>
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight">Cookie policy</h1>
        <p className="mt-4 text-muted-foreground max-w-2xl">
          This page explains the cookies and similar browser storage that Lamport Pay Ltd uses on
          lamportpay.com and the LamportPay app. Last updated: 28 October 2026.
        </p>
      </section>

      <section className="max-w-4xl mx-auto px-5 space-y-10">
        <div>
          <h2 className="text-2xl font-semibold mb-3">What we use</h2>
          <p className="text-muted-foreground">
            We use essential browser storage, one functional item for speed, and optional Google Analytics on public pages only when you accept it. Analytics is not loaded before consent. We do not use advertising cookies and never store private keys or seed phrases.
          </p>
        </div>

        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left">
              <tr>
                <th className="p-3 font-semibold">Name</th>
                <th className="p-3 font-semibold">Type</th>
                <th className="p-3 font-semibold">Purpose</th>
                <th className="p-3 font-semibold">Duration</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.name} className="border-t border-border align-top">
                  <td className="p-3 font-medium">{r.name}</td>
                  <td className="p-3">{r.type}</td>
                  <td className="p-3 text-muted-foreground">{r.purpose}</td>
                  <td className="p-3 text-muted-foreground">{r.duration}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div>
          <h2 className="text-2xl font-semibold mb-3">Third-party services</h2>
          <p className="text-muted-foreground">
            Live prices on our site are loaded from public price services (Jupiter, CoinGecko and an
            open exchange-rate service). When you verify your identity, you are taken to Stables'
            hosted page, which applies its own cookie policy. Your wallet extension (for example
            Phantom or Solflare) also manages its own storage.
          </p>
          <p className="mt-3 text-muted-foreground">If you accept optional analytics, Google receives basic public-page visit information and processes it under its <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-primary underline">privacy policy</a>. Advertising storage, Google signals and advertising personalisation are disabled. We do not track signed-in payment or admin pages.</p>
        </div>

        <div>
          <h2 className="text-2xl font-semibold mb-3">Your choice</h2>
          <p className="text-muted-foreground mb-4">
            Essential items cannot be switched off, because sign-in and payments would stop
            working. You can change your choice at any time, or clear cookies in your browser
            settings. Choose Essential only to withdraw analytics consent and stop future tracking. Your updated choice is remembered for twelve months; earlier cookie choices made before analytics was introduced do not authorize analytics.
          </p>
          <Button onClick={openCookieSettings}>Cookie settings</Button>
        </div>

        <div>
          <h2 className="text-2xl font-semibold mb-3">Contact</h2>
          <p className="text-muted-foreground">
            Questions about this policy:{" "}
            <a href="mailto:hello@lamportpay.com" className="text-primary underline">
              hello@lamportpay.com
            </a>
          </p>
        </div>
      </section>
    </SiteLayout>
  );
}
