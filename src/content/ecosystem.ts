/**
 * Strategic ecosystem partners, confirmed by the owner on 11 Oct 2026.
 * Businesses ready to adopt LamportPay services. `region` feeds country labels and flags.
 * Readiness does not mean completed onboarding or live payment processing.
 * No valuations, revenue, investments or commitments are stated.
 */
import blissLogo from "@/assets/partners/bliss-rent.png.asset.json";
import zohLogo from "@/assets/partners/zoh.png.asset.json";
import wharfLogo from "@/assets/partners/wharf-street.png.asset.json";
import secureLedgerLogo from "@/assets/partners/secure-ledger.png.asset.json";
import greatWinchesterLogo from "@/assets/partners/great-winchester-crest.png.asset.json";
import agcLogo from "@/assets/partners/agc-official.png.asset.json";

export type EcosystemRegion = "USA" | "UK" | "UAE" | "IN";

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
  { id: "IN", label: "India" },
];

export const ECOSYSTEM_COMPANIES: EcosystemCompany[] = [
  {
    name: "Great Winchester Investment Company",
    url: "https://greatwinchester.com/",
    description:
      "UK investment group preparing to use LamportPay for business payments.",
    region: "UK",
    sector: "Investment",
    logo: greatWinchesterLogo.url,
  },
  {
    name: "AGC Global Logistics",
    url: "https://agcgl.com/",
    description:
      "UAE logistics company preparing to use LamportPay for supplier and business payments.",
    region: "UAE",
    sector: "Logistics",
    logo: agcLogo.url,
  },
  {
    name: "Wharf Street Studios",
    url: "https://www.wharfstreetstudios.com/",
    description:
      "Indian media and gaming studio preparing to use LamportPay for business payments.",
    region: "IN",
    sector: "Media & Gaming",
    logo: wharfLogo.url,
  },
  {
    name: "ZOH Real Estate",
    url: "https://zoh.ae/",
    description:
      "UAE real-estate business preparing to use LamportPay for property-related payments.",
    region: "UAE",
    sector: "Real Estate",
    logo: zohLogo.url,
  },
  {
    name: "Bliss Rent",
    url: "https://bliss.rent/",
    description:
      "Dubai car-rental platform preparing to use LamportPay for bookings and rentals.",
    region: "UAE",
    sector: "Mobility",
    logo: blissLogo.url,
  },
  {
    name: "Secure Ledger Solutions",
    url: "https://secureledgerssolutions.com/",
    description:
      "UK digital-asset advisory preparing to use LamportPay for client payments.",
    region: "UK",
    sector: "Digital-asset advisory",
    logo: secureLedgerLogo.url,
  },
];

export function publicEcosystem(): EcosystemCompany[] {
  return ECOSYSTEM_COMPANIES;
}
