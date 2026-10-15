/**
 * Grounding for the Ask AI assistant, built from the same shared content the
 * website shows (journey, costs, roadmap, partners, integrations, team), so
 * answers always match the published pages.
 */
import { PAYMENT_COSTS, PAYMENT_JOURNEY, PAYMENT_SAFETY, VERIFICATION_JOURNEY } from "@/content/payment-flow";
import { CURRENT_FLOW, FUTURE_EXPLORATION, ROADMAP_NOTE, ROADMAP_PHASES } from "@/content/roadmap";
import { publicEcosystem } from "@/content/ecosystem";
import { integrationPartners, licensedPartner, techStack } from "@/content/integrations";
import { BANK_RESTRICTIONS, INTEGRATION_GROUPS } from "@/content/integration-status";
import { TEAM } from "@/lib/team";

const DROP = /^(logo|image|photo|src|icon|asset|color|tone|className|accent)/i;

function clean(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(clean);
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) {
      if (DROP.test(k) || typeof v === "function") continue;
      out[k] = clean(v);
    }
    return out;
  }
  return value;
}

let cached: string | null = null;

export function askAiKnowledge(): string {
  if (cached) return cached;
  const sections: [string, unknown][] = [
    ["Payment journey (8 steps)", PAYMENT_JOURNEY],
    ["Verification journey", VERIFICATION_JOURNEY],
    ["Costs", PAYMENT_COSTS],
    ["Safety", PAYMENT_SAFETY],
    ["Licensed payout partner", licensedPartner],
    ["Integration partners", integrationPartners],
    ["Integration status", INTEGRATION_GROUPS],
    ["Bank deposit guidance (not a payout blacklist)", BANK_RESTRICTIONS],
    ["Technology", techStack],
    ["Roadmap", ROADMAP_PHASES],
    ["Roadmap note", ROADMAP_NOTE],
    ["Current flow", CURRENT_FLOW],
    ["Future exploration (not commitments)", FUTURE_EXPLORATION],
    ["Ecosystem businesses (ready to adopt; onboarding planned, not investors or endorsements)", publicEcosystem()],
    ["Team", TEAM.map((m) => clean(m))],
  ];
  cached = sections
    .map(([title, data]) => `## ${title}\n${JSON.stringify(clean(data))}`)
    .join("\n\n");
  return cached;
}
