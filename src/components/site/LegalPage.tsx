import type { ReactNode } from "react";

import { SiteLayout } from "@/components/site/Layout";
import { LEGAL_CONTACT, LEGAL_LAST_UPDATED, LEGAL_REVIEWED } from "@/lib/legal";

export type LegalSection = { title: string; body: ReactNode };

/** Layout shared by the privacy policy and the terms of use (same look as the cookie policy). */
export function LegalPage({
  title,
  intro,
  sections,
}: {
  title: string;
  intro: ReactNode;
  sections: LegalSection[];
}) {
  return (
    <SiteLayout>
      <section className="max-w-4xl mx-auto px-5 pt-16 pb-8">
        <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-3">Legal</p>
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight">{title}</h1>
        <p className="mt-4 text-muted-foreground max-w-2xl">
          {intro} Last updated: {LEGAL_LAST_UPDATED}.
        </p>
        {!LEGAL_REVIEWED && (
          <p
            role="note"
            className="mt-6 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-200"
          >
            Draft: this page describes how LamportPay works today and is awaiting review by our
            legal advisers. It may change before LamportPay processes real payments.
          </p>
        )}
      </section>
      <section className="max-w-4xl mx-auto px-5 pb-16 space-y-10">
        {sections.map((section, index) => (
          <div key={section.title}>
            <h2 className="text-2xl font-semibold mb-3">
              {index + 1}. {section.title}
            </h2>
            <div className="space-y-3 text-muted-foreground">{section.body}</div>
          </div>
        ))}
        <div>
          <h2 className="text-2xl font-semibold mb-3">Contact</h2>
          <p className="text-muted-foreground">
            Questions about this page:{" "}
            <a href={`mailto:${LEGAL_CONTACT}`} className="text-primary underline">
              {LEGAL_CONTACT}
            </a>
          </p>
        </div>
      </section>
    </SiteLayout>
  );
}
