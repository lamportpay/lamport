/**
 * Strategic ecosystem partners, confirmed by the owner on 11 Oct 2026.
 * Businesses ready to adopt LamportPay services. `region` only feeds the partner-country
 * flags box — the partner cards themselves are not grouped or labelled by country.
 * Readiness does not mean completed onboarding or live payment processing.
 * No valuations, revenue, investments or commitments are stated.
 */
import blissLogo from "@/assets/partners/bliss-rent.png.asset.json";
import zohLogo from "@/assets/partners/zoh.png.asset.json";
import wharfLogo from "@/assets/partners/wharf-street.png.asset.json";
import secureLedgerLogo from "@/assets/partners/secure-ledger.png.asset.json";
import greatWinchesterLogo from "@/assets/partners/great-winchester.png.asset.json";

export type EcosystemRegion = "USA" | "UK" | "UAE";

export type EcosystemCompany = {
  name: string;
  url: string;
  description: string;
  region: EcosystemRegion;
  sector: string;
  logo: string | null;
};

export const ECOSYSTEM_REGIONS: { id: EcosystemRegion; label: string }[] = [
  { id: "USA", label: "United States" },
  { id: "UK", label: "United Kingdom" },
  { id: "UAE", label: "United Arab Emirates" },
];

export const ECOSYSTEM_COMPANIES: EcosystemCompany[] = [
  {
    name: "Great Winchester Investment Company",
    url: "https://greatwinchester.com/",
    description:
      "Investment business ready to explore adoption of LamportPay's business payment services.",
    region: "UK",
    sector: "Investment",
    logo: greatWinchesterLogo.url,
  },
  {
    name: "AGC Global Logistics",
    url: "https://agcgl.com/",
    description:
      "UAE logistics business ready to adopt LamportPay's payment services for its business payment needs.",
    region: "UAE",
    sector: "Logistics",
    logo: null,
  },
  {
    name: "Wharf Street Studios",
    url: "https://www.wharfstreetstudios.com/",
    description:
      "US media and gaming studio ready to adopt LamportPay's payment services for its business payment needs.",
    region: "USA",
    sector: "Media & Gaming",
    logo: wharfLogo.url,
  },
  {
    name: "ZOH Real Estate",
    url: "https://zoh.ae/",
    description:
      "UAE real-estate business ready to adopt LamportPay's payment services for its business payment needs.",
    region: "UAE",
    sector: "Real Estate",
    logo: zohLogo.url,
  },
  {
    name: "Bliss Rent",
    url: "https://bliss.rent/",
    description:
      "Dubai car-rental booking business ready to adopt LamportPay's payment services for car bookings and rentals.",
    region: "UAE",
    sector: "Mobility",
    logo: blissLogo.url,
  },
  {
    name: "Secure Ledger Solutions",
    url: "https://secureledgerssolutions.com/",
    description:
      "UK digital-asset advisory business ready to adopt LamportPay's payment services for its business payment needs.",
    region: "UK",
    sector: "Digital-asset advisory",
    logo: secureLedgerLogo.url,
  },
];

export function publicEcosystem(): EcosystemCompany[] {
  return ECOSYSTEM_COMPANIES;
}
