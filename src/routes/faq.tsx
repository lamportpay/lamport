import { createFileRoute, Link } from "@tanstack/react-router";
import { MessageCircleQuestion, Sparkles, ArrowRight, ShieldCheck } from "lucide-react";
import { FAQS } from "@/lib/ask-ai-faq";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/faq")({
  head: () => ({
    meta: [
      { title: "FAQs — LamportPay" },
      {
        name: "description",
        content:
          "Answers to the 12 most common questions about LamportPay: fees, supported countries, wallet safety, verification, partners, limits and the roadmap.",
      },
      { property: "og:title", content: "FAQs — LamportPay" },
      {
        property: "og:description",
        content:
          "Fees, countries, wallet safety, verification, partners and more — answered by Lammy, the LamportPay assistant.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: FaqPage,
});

function openAskAi() {
  window.dispatchEvent(new CustomEvent("lamportpay:open-ask-ai"));
}

function FaqPage() {
  return (
    <div className="relative">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-5 pt-16 sm:pt-20 pb-10 text-center">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-violet-500 text-primary-foreground shadow-lg shadow-primary/25">
            <MessageCircleQuestion className="h-7 w-7" aria-hidden />
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">
            Frequently asked questions
          </h1>
          <p className="mt-4 max-w-2xl mx-auto text-muted-foreground text-base sm:text-lg">
            The 12 questions people ask most about LamportPay — fees, countries,
            wallet safety, verification and the roadmap. Every answer here is the
            same one <span className="font-medium text-foreground">Lammy</span>,
            our assistant, gives in chat.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Button onClick={openAskAi} className="rounded-full gap-2">
              <Sparkles className="h-4 w-4" aria-hidden />
              Ask Lammy live
            </Button>
            <Button asChild variant="outline" className="rounded-full gap-2">
              <Link to="/contact">
                Contact the team
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* FAQ list */}
      <section className="max-w-3xl mx-auto px-4 sm:px-5 pb-16 sm:pb-20">
        <Accordion type="single" collapsible className="space-y-3">
          {FAQS.map((f, i) => (
            <AccordionItem
              key={f.id}
              value={f.id}
              className="rounded-2xl border border-border/70 bg-card px-5 shadow-sm data-[state=open]:shadow-md transition-shadow"
            >
              <AccordionTrigger className="text-left text-base font-semibold hover:no-underline py-5">
                <span className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                    {i + 1}
                  </span>
                  {f.question}
                </span>
              </AccordionTrigger>
              <AccordionContent className="pb-5 pl-9 text-muted-foreground leading-relaxed whitespace-pre-line">
                {f.answer.replace(/\*\*/g, "")}
                <button
                  type="button"
                  onClick={openAskAi}
                  className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
                >
                  <Sparkles className="h-3.5 w-3.5" aria-hidden />
                  Ask Lammy about this
                </button>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        {/* Bottom CTA */}
        <div className="mt-10 rounded-3xl border border-border/70 bg-gradient-to-br from-primary/5 via-card to-violet-500/5 p-6 sm:p-8 text-center">
          <ShieldCheck className="mx-auto h-8 w-8 text-primary" aria-hidden />
          <h2 className="mt-3 text-xl font-bold">Still have a question?</h2>
          <p className="mt-2 text-muted-foreground max-w-md mx-auto">
            Lammy answers instantly about payments, fees, partners and the
            roadmap — free, no sign-up needed.
          </p>
          <Button onClick={openAskAi} className="mt-5 rounded-full gap-2">
            <Sparkles className="h-4 w-4" aria-hidden />
            Chat with Lammy
          </Button>
        </div>
      </section>
    </div>
  );
}
