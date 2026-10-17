import zoaibAli from "@/assets/team/framed-zoaib.jpg";
import zaheerMuneer from "@/assets/team/framed-zaheer.jpg";
import ghazanfarAbbas from "@/assets/team/framed-ghazanfar.jpg";
import izzat from "@/assets/team/framed-izzat.jpg";
import safiUllahAdam from "@/assets/team/framed-safi.jpg";
import gregMirt from "@/assets/team/greg-mirt-portrait.jpg.asset.json";

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
  /** Professional experience, newest first. Only supplied facts. */
  history: { period: string; title: string; detail: string }[];
  /** Only filled in when the person has shared the profile URL. */
  socials: { linkedin?: string; twitter?: string; github?: string };
  /** Extra framing so every face sits at the same size and height (card crops). */
  photoClass?: string;
  /** Framing for the wider portrait in the open profile panel. */
  sheetPhotoClass?: string;
};

export const TEAM: TeamMember[] = [
  {
    slug: "zoaib-ali",
    name: "Zoaib Ali",
    role: "Founder & CEO",
    category: "Leadership",
    photo: zoaibAli,
    summary: "Leads strategy, partnerships and the funding round.",
    focus: ["Company strategy", "Partnerships", "Fundraising"],
    history: [
      {
        period: "LamportPay",
        title: "Founder & CEO",
        detail:
          "Founded Lamport Pay Ltd and leads strategy, partner relationships and the funding round.",
      },
    ],
    socials: {},
  },
  {
    slug: "ghazanfar-abbas",
    name: "Ghazanfar Abbas",
    role: "CTO & Lead Developer",
    category: "Engineering",
    photo: ghazanfarAbbas,
    summary:
      "Product engineering · Web3 · Solana · full-stack development. Built the LamportPay payment engine.",
    focus: ["Solana & Web3", "Payment engine", "Full-stack development"],
    history: [
      {
        period: "LamportPay",
        title: "CTO & Lead Developer",
        detail:
          "Built the LamportPay payment engine, wallet sign-in and the partner payout integration.",
      },
    ],
    socials: {},
  },
  {
    slug: "zaheer-muneer",
    name: "Zaheer Muneer",
    role: "Advisor",
    category: "Advisors",
    photo: zaheerMuneer,
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
  },
  {
    slug: "izzat",
    name: "Izzat",
    role: "Marketing & Community",
    category: "Growth & Community",
    photo: izzat,
    summary: "Community growth, ambassador programme and ecosystem outreach.",
    focus: ["Community growth", "Ambassador programme", "Ecosystem outreach"],
    history: [
      {
        period: "LamportPay",
        title: "Marketing & Community",
        detail:
          "Runs community growth, the ambassador programme and outreach across the ecosystem.",
      },
    ],
    socials: {},
  },
  {
    slug: "safi-ullah-adam",
    name: "Safi Ullah Adam",
    role: "Advisor — Technology & AI",
    category: "Advisors",
    photo: safiUllahAdam,
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
  {
    slug: "greg-mirt",
    name: "Greg Mirt",
    role: "Advisor — Team Wellbeing & Performance",
    category: "Advisors",
    photo: gregMirt.url,
    summary:
      "Physiotherapy-trained advisor supporting team wellbeing, mental health, stress management and sustainable performance within a fast-paced startup environment.",
    focus: [
      "Team Wellbeing",
      "Mental Health",
      "Stress Management",
      "Performance & Resilience",
      "Healthy Work Culture",
    ],
    history: [],

    socials: {},
  },
];
