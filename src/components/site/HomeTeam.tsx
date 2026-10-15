import zoaibAli from "@/assets/team/team-zoaib-ali.png.asset.json";
import zaheerMuneer from "@/assets/team/team-zaheer-muneer.jpg.asset.json";
import ghazanfarAbbas from "@/assets/team/team-ghazanfar-abbas.jpg.asset.json";
import izzat from "@/assets/team/team-izzat.jpg.asset.json";
import safiUllahAdam from "@/assets/team/team-safi-ullah-adam.jpg.asset.json";

type Member = {
  name: string;
  role: string;
  bio: string;
  photo: string;
};

const featured: Member[] = [
  {
    name: "Zoaib Ali",
    role: "Founder & CEO",
    bio: "Leads strategy, partnerships and the funding round.",
    photo: zoaibAli.url,
  },
  {
    name: "Zaheer Muneer",
    role: "Advisor",
    bio: "Strategic guidance, growth scaling and institutional partnerships.",
    photo: zaheerMuneer.url,
  },
  {
    name: "Ghazanfar Abbas",
    role: "CTO & Lead Developer",
    bio: "Product engineering · Web3 · Solana · full-stack development. Built the LamportPay payment engine.",
    photo: ghazanfarAbbas.url,
  },
];

const wide: Member[] = [
  {
    name: "Izzat",
    role: "Marketing & Community",
    bio: "Community growth, ambassador programme and ecosystem outreach.",
    photo: izzat.url,
  },
  {
    name: "Safi Ullah Adam",
    role: "Advisor — Technology & AI",
    bio: "AI architecture, technical strategy and platform infrastructure advisory.",
    photo: safiUllahAdam.url,
  },
];

function Avatar({ member, size }: { member: Member; size: "lg" | "sm" }) {
  return (
    <div
      className={
        size === "lg"
          ? "size-24 shrink-0 rounded-full p-[2px] bg-gradient-to-br from-primary via-violet-500 to-blue-500"
          : "size-14 shrink-0 rounded-full p-[2px] bg-gradient-to-br from-primary via-violet-500 to-blue-500"
      }
    >
      <img
        src={member.photo}
        alt={`Portrait of ${member.name}`}
        loading="lazy"
        className="size-full rounded-full object-cover"
      />
    </div>
  );
}

export function HomeTeam() {
  return (
    <section className="home-section border-t border-border" id="team">
      <div className="home-container">
        <p className="home-eyebrow">The team</p>
        <h2 className="home-heading">
          Builders, operators <span className="text-primary">and advisors.</span>
        </h2>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {featured.map((m) => (
            <article
              key={m.name}
              className="rounded-2xl border border-border bg-card p-6 transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <Avatar member={m} size="lg" />
              <h3 className="mt-5 text-lg font-bold">{m.name}</h3>
              <p className="mt-1 text-sm font-semibold text-primary">{m.role}</p>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{m.bio}</p>
            </article>
          ))}
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {wide.map((m) => (
            <article
              key={m.name}
              className="flex items-start gap-4 rounded-2xl border border-border bg-card p-5 transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <Avatar member={m} size="sm" />
              <div>
                <h3 className="text-base font-bold">{m.name}</h3>
                <p className="mt-0.5 text-sm font-semibold text-primary">{m.role}</p>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{m.bio}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
