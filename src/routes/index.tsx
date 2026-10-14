import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, ArrowUpRight, Coins, Globe2, ShieldCheck, Wallet } from "lucide-react";
import { SiteLayout } from "@/components/site/Layout";
import { Button } from "@/components/ui/button";
import { PaymentNetwork } from "@/components/site/PaymentNetwork";
import { HomeBankNetwork } from "@/components/site/HomeBankNetwork";
import { CustomerSupport } from "@/components/site/CustomerSupport";
import { EcosystemSection, RoadmapSection } from "@/components/site/VisionRoadmapEcosystem";
import { PAYMENT_COSTS } from "@/content/payment-flow";
import { pageSeo } from "@/lib/seo";
import hero from "@/assets/home-commerce.jpg";

export const Route = createFileRoute("/")({
  head: () => pageSeo({ path: "/", title: "LamportPay — Crypto in. Local money out.", description: "Explore LamportPay’s non-custodial payment journey: Solana wallets, Jupiter swap quotes, USDC settlement and Stables bank-payout sandbox. Meet our business ecosystem." }),
  component: Index,
});

function Index() {
  return (
    <div className="commercial-home">
      <SiteLayout>
        <section className="home-hero relative isolate overflow-hidden border-b border-border">
          <img src={hero} alt="" width={1920} height={1024} fetchPriority="high" className="absolute inset-0 -z-20 h-full w-full object-cover object-center" />
          <div className="home-hero-veil absolute inset-0 -z-10" />
          <div className="home-container py-14 md:py-20">
            <p className="home-eyebrow">Digital assets. Everyday payments.</p>
            <h1 className="mt-4 text-5xl font-semibold leading-tight md:text-7xl">LamportPay</h1>
            <p className="mt-3 text-2xl font-medium leading-snug md:text-4xl">Crypto in. <span className="text-home-brand">Local money out.</span></p>
            <p className="mt-5 max-w-lg text-base leading-relaxed text-home-ink md:text-lg">A connected route from your Solana wallet to local-currency bank payments. Your wallet. A clear quote. One payment journey.</p>
            <div className="mt-7 flex flex-wrap gap-3"><Button asChild size="lg" className="h-12 bg-home-brand text-primary-foreground hover:bg-home-brand/90"><Link to="/pay">Open payment app <ArrowRight /></Link></Button><Button asChild size="lg" variant="outline" className="h-12 bg-card/90"><a href="#payment-network">Explore the payment route <ArrowUpRight /></a></Button></div>
            <p className="mt-6 max-w-lg text-xs leading-relaxed text-home-ink"><span className="font-semibold">DEMO / SIMULATED</span> · Controlled test phase. Real bank payouts and production identity verification remain disabled.</p>
          </div>
        </section>
        <div className="border-b border-border bg-card"><div className="home-container grid grid-cols-1 gap-4 py-6 sm:grid-cols-3">{[{ icon: Wallet, title: "Your wallet stays yours", text: "No custody of funds or private keys" }, { icon: Coins, title: "One transparent service fee", text: "2% of the total sent · Partner costs separate" }, { icon: Globe2, title: "Local bank destinations", text: "Own account or beneficiary · Sandbox" }].map(({ icon: Icon, title, text }) => <div key={title} className="flex items-center gap-3"><Icon className="size-5 shrink-0 text-home-brand" strokeWidth={1.6} /><div><p className="text-sm font-semibold">{title}</p><p className="mt-1 text-xs text-muted-foreground">{text}</p></div></div>)}</div></div>
        <PaymentNetwork />
        <HomeBankNetwork />
        <section className="home-section border-b border-border" id="infrastructure"><div className="home-container"><p className="home-eyebrow">The infrastructure behind the journey</p><h2 className="home-heading">Clear roles. Connected systems.</h2><div className="mt-8 grid gap-6 md:grid-cols-3">{[
          { name: "Solana", status: "NETWORK", image: "/tokens/sol.svg", role: "Wallet & transaction layer", detail: "Wallet connection and signed transactions. Payment tests use Solana devnet." },
          { name: "Jupiter", status: "LIVE QUOTES", image: null, role: "Swap infrastructure", detail: "Solana asset-to-USDC price routes. Payment TEST MODE is quote-only; no mainnet swaps." },
          { name: "Stables", status: "DEMO / SIMULATED", image: null, role: "Verification & bank payouts", detail: "Hosted sandbox verification and payout status. Production KYC and fiat payouts are disabled." },
        ].map((provider) => <div key={provider.name} className="border-t-2 border-home-brand pt-5"><div className="flex items-center gap-2">{provider.image && <img src={provider.image} alt="" width="24" height="24" />}<h3 className="text-2xl font-semibold">{provider.name}</h3></div><p className="mt-3 text-[10px] font-semibold text-home-brand">{provider.status}</p><p className="mt-3 text-sm font-semibold">{provider.role}</p><p className="mt-2 text-sm leading-relaxed text-muted-foreground">{provider.detail}</p></div>)}</div><p className="mt-7 text-xs text-muted-foreground">Technology providers are not investors or guarantors. No financial backing or direct bank partnership is implied.</p></div></section>
        <EcosystemSection compact />
        <section className="home-section border-y border-border bg-home-surface" id="costs"><div className="home-container grid gap-8 md:grid-cols-[1fr_1.4fr]"><div><p className="home-eyebrow">The business model</p><h2 className="home-heading">One service fee.<br />No hidden layers.</h2><p className="mt-4 max-w-sm text-sm leading-relaxed text-muted-foreground">LamportPay earns a single fee for arranging the payment journey. Provider and network costs are shown separately.</p><Button asChild variant="link" className="mt-4 px-0 text-home-brand"><Link to="/how-it-works">How payments work <ArrowRight /></Link></Button></div><div><div className="flex items-center gap-5 border-b border-border pb-5"><p className="text-5xl font-semibold text-home-brand">2%</p><div><p className="font-semibold">Of the total you send</p><p className="mt-1 text-sm text-muted-foreground">150 USDC sent → 3 USDC fee → 147 USDC to Stables</p></div></div><dl className="divide-y divide-border">{PAYMENT_COSTS.map((cost) => <div key={cost.title} className="py-4"><dt className="text-sm font-semibold">{cost.title}</dt><dd className="mt-1 text-sm leading-relaxed text-muted-foreground">{cost.detail}</dd></div>)}</dl></div></div></section>
        <RoadmapSection />
        <section className="home-section border-t border-border"><div className="home-container flex flex-wrap items-center justify-between gap-6"><div><p className="home-eyebrow">Build your next payment connection</p><h2 className="home-heading">Let’s talk business.</h2><p className="mt-3 text-sm text-muted-foreground">Explore business onboarding, payment use cases and our product roadmap.</p></div><div className="flex gap-3"><Button asChild size="lg" className="h-12 bg-home-brand text-primary-foreground hover:bg-home-brand/90"><Link to="/contact">Contact our team <ArrowRight /></Link></Button><Button asChild size="lg" variant="outline" className="h-12"><Link to="/whitepaper">White paper</Link></Button></div></div></section>
        <CustomerSupport />
      </SiteLayout>
    </div>
  );
}
