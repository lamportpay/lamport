// Sandbox team section — placeholder people until the owner sends the real team and layout.
const team = [
  { initials: "AB", name: "Team member", role: "Founder & CEO" },
  { initials: "CD", name: "Team member", role: "CTO" },
  { initials: "EF", name: "Team member", role: "Head of Compliance" },
  { initials: "GH", name: "Team member", role: "Head of Partnerships" },
];

export function HomeTeam() {
  return (
    <section className="home-section border-t border-border">
      <div className="home-container">
        <p className="home-eyebrow">Our team</p>
        <h2 className="home-heading">The people building LamportPay.</h2>
        <p className="mt-3 text-sm text-muted-foreground">
          Sample profiles shown for layout — real team details coming soon.
        </p>
        <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {team.map((m) => (
            <article
              key={m.role}
              className="rounded-xl border border-border bg-card p-5 text-center transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="home-team-avatar mx-auto flex size-20 items-center justify-center rounded-full text-xl font-semibold text-primary-foreground">
                {m.initials}
              </div>
              <h3 className="mt-4 font-semibold">{m.name}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{m.role}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
