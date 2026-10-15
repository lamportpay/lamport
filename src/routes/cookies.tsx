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
          lamportpay.com and the LamportPay app. Last updated: 15 October 2026.
        </p>
      </section>

      <section className="max-w-4xl mx-auto px-5 space-y-10">
        <div>
          <h2 className="text-2xl font-semibold mb-3">What we use</h2>
          <p className="text-muted-foreground">
            We only use cookies and browser storage that the service needs to work, plus one
            functional item for speed. We do not use advertising, cross-site tracking or
            third-party marketing cookies, and we never store private keys or seed phrases.
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
        </div>

        <div>
          <h2 className="text-2xl font-semibold mb-3">Your choice</h2>
          <p className="text-muted-foreground mb-4">
            Essential items cannot be switched off, because sign-in and payments would stop
            working. You can change your choice at any time, or clear cookies in your browser
            settings.
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
