import zoaibAli from "@/assets/team/team-zoaib-ali.jpg.asset.json";
import zaheerMuneer from "@/assets/team/team-zaheer-muneer.jpg.asset.json";
import ghazanfarAbbas from "@/assets/team/team-ghazanfar-abbas.jpg.asset.json";
import izzat from "@/assets/team/team-izzat.jpg.asset.json";
import safiUllahAdam from "@/assets/team/team-safi-ullah-adam.jpg.asset.json";

export type TeamCategory = "Leadership" | "Engineering" | "Growth & Community" | "Advisors";

export const TEAM_CATEGORIES: TeamCategory[] = [
  "Leadership",
  "Engineering",
  "Growth & Community",
  "Advisors",
];

export type TeamMember = {
  slug: string;
  name: string;
  role: string;
  category: TeamCategory;
  photo: string;
  summary: string;
  focus: string[];
  /** Work at LamportPay, newest first. Only owner-supplied facts. */
  history: { period: string; title: string; detail: string }[];
  /** Only filled in when the person has shared the profile URL. */
  socials: { linkedin?: string; twitter?: string; github?: string };
  /** Extra framing so every face sits at the same size and height. */
  photoClass?: string;
};

export const TEAM: TeamMember[] = [
  {
    slug: "zoaib-ali",
    name: "Zoaib Ali",
    role: "Founder & CEO",
    category: "Leadership",
    photo: zoaibAli.url,
    summary: "Leads strategy, partnerships and the funding round.",
    focus: ["Company strategy", "Partnerships", "Fundraising"],
    history: [
      {
        period: "LamportPay",
        title: "Founder & CEO",
        detail: "Founded Lamport Pay Ltd and leads strategy, partner relationships and the funding round.",
      },
    ],
    socials: {},
  },
  {
    slug: "zaheer-muneer",
    name: "Zaheer Muneer",
    role: "Advisor",
    category: "Advisors",
    photo: zaheerMuneer.url,
    summary: "Strategic guidance, growth scaling and institutional partnerships.",
    focus: ["Strategic guidance", "Growth scaling", "Institutional partnerships"],
    history: [
      {
        period: "LamportPay",
        title: "Advisor",
        detail: "Advises on strategy, scaling growth and institutional partnerships.",
      },
    ],
    socials: {},
    photoClass: "scale-[1.3] origin-[50%_22%]",
  },
  {
    slug: "ghazanfar-abbas",
    name: "Ghazanfar Abbas",
    role: "CTO & Lead Developer",
    category: "Engineering",
    photo: ghazanfarAbbas.url,
    summary:
      "Product engineering · Web3 · Solana · full-stack development. Built the LamportPay payment engine.",
    focus: ["Solana & Web3", "Payment engine", "Full-stack development"],
    history: [
      {
        period: "LamportPay",
        title: "CTO & Lead Developer",
        detail: "Built the LamportPay payment engine, wallet sign-in and the partner payout integration.",
      },
    ],
    socials: {},
  },
  {
    slug: "izzat",
    name: "Izzat",
    role: "Marketing & Community",
    category: "Growth & Community",
    photo: izzat.url,
    summary: "Community growth, ambassador programme and ecosystem outreach.",
    focus: ["Community growth", "Ambassador programme", "Ecosystem outreach"],
    history: [
      {
        period: "LamportPay",
        title: "Marketing & Community",
        detail: "Runs community growth, the ambassador programme and outreach across the ecosystem.",
      },
    ],
    socials: {},
  },
  {
    slug: "safi-ullah-adam",
    name: "Safi Ullah Adam",
    role: "Advisor — Technology & AI",
    category: "Advisors",
    photo: safiUllahAdam.url,
    summary: "AI architecture, technical strategy and platform infrastructure advisory.",
    focus: ["AI architecture", "Technical strategy", "Platform infrastructure"],
    history: [
      {
        period: "LamportPay",
        title: "Advisor — Technology & AI",
        detail: "Advises on AI architecture, technical strategy and platform infrastructure.",
      },
    ],
    socials: {},
  },
];
