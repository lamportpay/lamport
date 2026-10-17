import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, ArrowUpRight, Github, Linkedin, Twitter, Users } from "lucide-react";
import { SiteLayout } from "@/components/site/Layout";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { pageSeo } from "@/lib/seo";
import { TEAM, TEAM_CATEGORIES, type TeamMember } from "@/lib/team";

export const Route = createFileRoute("/people")({
  head: () =>
    pageSeo({
      path: "/people",
      title: "Our People — the team behind LamportPay",
      description:
        "Meet the founders, engineers, community builders and advisors building LamportPay: crypto in, local money out.",
    }),
  component: People,
});

function Socials({ m, size = "sm" }: { m: TeamMember; size?: "sm" | "lg" }) {
  const items = [
    { href: m.socials.linkedin, label: "LinkedIn", Icon: Linkedin },
    { href: m.socials.twitter, label: "X / Twitter", Icon: Twitter },
    { href: m.socials.github, label: "GitHub", Icon: Github },
  ].filter((i) => i.href);
  if (!items.length) return null;
  const box = size === "lg" ? "size-10" : "size-8";
  return (
    <div className="flex gap-2">
      {items.map(({ href, label, Icon }) => (
        <a
          key={label}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`${m.name} on ${label}`}
          onClick={(e) => e.stopPropagation()}
          className={`${box} grid place-items-center rounded-lg border border-border bg-background text-muted-foreground transition hover:border-primary hover:text-primary`}
        >
          <Icon className="size-4" />
        </a>
      ))}
    </div>
  );
}

function PersonCard({ m, onOpen }: { m: TeamMember; onOpen: () => void }) {
  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/10">
      <button
        type="button"
        onClick={onOpen}
        className="relative block aspect-square w-full overflow-hidden bg-gradient-to-br from-primary/15 to-violet-500/15 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        aria-label={`Open profile of ${m.name}`}
      >
        <img
          src={m.photo}
          alt={`Portrait of ${m.name}`}
          loading="lazy"
          className={`size-full object-cover object-top transition duration-500 group-hover:scale-105`}
        />
        <span className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-primary via-violet-500 to-blue-500" />
      </button>
      <div className="flex flex-1 flex-col p-4">
        <h3 className="text-base font-bold">{m.name}</h3>
        <p className="mt-0.5 text-sm font-semibold text-primary">{m.role}</p>
        <p className="mt-2 flex-1 text-[13px] leading-relaxed text-muted-foreground">{m.summary}</p>
        <div className="mt-4 flex items-center justify-between gap-3">
          <Socials m={m} />
          <button
            type="button"
            onClick={onOpen}
            className="ml-auto inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
          >
            View profile <ArrowUpRight className="size-4" />
          </button>
        </div>
      </div>
    </article>
  );
}

function People() {
  const [filter, setFilter] = useState<"All" | (typeof TEAM_CATEGORIES)[number]>("All");
  const [active, setActive] = useState<TeamMember | null>(null);
  const visible = filter === "All" ? TEAM : TEAM.filter((m) => m.category === filter);

  return (
    <SiteLayout>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-32 -top-32 size-[520px] rounded-full bg-gradient-to-br from-primary/20 via-violet-500/15 to-transparent blur-3xl"
        />
        <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-5 py-14 md:py-16">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
              <Users className="size-3.5" /> Our people
            </div>
            <h1 className="mt-5 max-w-3xl text-4xl font-semibold leading-[1.1] tracking-tight md:text-6xl">
              The people moving
              <br />
              <span className="bg-gradient-to-r from-primary via-violet-500 to-blue-500 bg-clip-text text-transparent">
                crypto into local money.
              </span>
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-muted-foreground">
              A small team of builders, operators and advisors behind Lamport Pay Ltd. Open any
              profile to see what each person leads and the work they have done at LamportPay.
            </p>
            <dl className="mt-8 flex flex-wrap gap-8">
              <div>
                <dt className="text-xs uppercase tracking-wider text-muted-foreground">People</dt>
                <dd className="text-3xl font-bold">{TEAM.length}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wider text-muted-foreground">Teams</dt>
                <dd className="text-3xl font-bold">{TEAM_CATEGORIES.length}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wider text-muted-foreground">Built on</dt>
                <dd className="text-3xl font-bold">Solana</dd>
              </div>
            </dl>
          </div>
        </div>
      </section>

      {/* Filters + groups */}
      <section className="mx-auto max-w-6xl px-5 py-12 md:py-16">
        <div role="tablist" aria-label="Team categories" className="flex flex-wrap gap-2">
          {(["All", ...TEAM_CATEGORIES] as const).map((c) => (
            <button
              key={c}
              role="tab"
              aria-selected={filter === c}
              onClick={() => setFilter(c)}
              className={`rounded-full border px-4 py-1.5 text-sm font-medium transition ${
                filter === c
                  ? "border-transparent bg-gradient-to-r from-primary to-violet-500 text-primary-foreground"
                  : "border-border bg-card text-muted-foreground hover:border-primary hover:text-primary"
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {visible.map((m) => (
            <PersonCard key={m.slug} m={m} onOpen={() => setActive(m)} />
          ))}
        </div>

        <div className="mt-16 flex flex-col items-start justify-between gap-4 rounded-2xl border border-border bg-card p-6 md:flex-row md:items-center">
          <div>
            <h2 className="text-xl font-semibold">Want to work with us?</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Learn more about the company, or get in touch with the team.
            </p>
          </div>
          <div className="flex gap-3">
            <Button asChild variant="outline">
              <Link to="/about">About us</Link>
            </Button>
            <Button asChild>
              <Link to="/contact">
                Contact <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <Sheet open={!!active} onOpenChange={(o) => !o && setActive(null)}>
        <SheetContent side="right" className="w-full overflow-y-auto p-0 sm:max-w-md">
          {active && (
            <>
              <div className="relative aspect-[5/4] w-full overflow-hidden bg-gradient-to-br from-primary/15 to-violet-500/15">
                <img
                  src={active.photo}
                  alt={`Portrait of ${active.name}`}
                  className={`size-full object-cover object-[50%_15%]`}
                />
                <span className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-primary via-violet-500 to-blue-500" />
              </div>
              <div className="p-6">
                <SheetHeader className="p-0 text-left">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {active.category}
                  </p>
                  <SheetTitle className="text-2xl">{active.name}</SheetTitle>
                  <SheetDescription className="font-semibold text-primary">
                    {active.role}
                  </SheetDescription>
                </SheetHeader>
                <p className="mt-4 leading-relaxed text-muted-foreground">{active.summary}</p>
                <div className="mt-5">
                  <Socials m={active} size="lg" />
                </div>
                <h3 className="mt-8 text-sm font-semibold uppercase tracking-wider">Focus areas</h3>
                <div className="mt-3 flex flex-wrap gap-2">
                  {active.focus.map((f) => (
                    <span
                      key={f}
                      className="rounded-full border border-primary/30 bg-primary/5 px-3 py-1 text-xs font-medium text-primary"
                    >
                      {f}
                    </span>
                  ))}
                </div>
                {active.history.length > 0 && (
                  <>
                    <h3 className="mt-8 text-sm font-semibold uppercase tracking-wider">
                      Experience
                    </h3>
                    <ol className="mt-4 space-y-5 border-l-2 border-primary/30 pl-5">
                      {active.history.map((h) => (
                        <li key={h.title + h.period} className="relative">
                          <span className="absolute -left-[27px] top-1 size-3 rounded-full bg-gradient-to-br from-primary to-violet-500 ring-4 ring-background" />
                          <p className="text-xs font-semibold text-muted-foreground">{h.period}</p>
                          <p className="font-semibold">{h.title}</p>
                          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                            {h.detail}
                          </p>
                        </li>
                      ))}
                    </ol>
                  </>
                )}

              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </SiteLayout>
  );
}
