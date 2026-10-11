/**
 * Strategic ecosystem partners, confirmed by the owner on 11 Oct 2026.
 * Grouped by region (USA, UK, UAE). Logos are each company's own site icon.
 * No valuations, revenue, investments or commitments are stated.
 */
import blissLogo from "@/assets/partners/bliss-rent.png.asset.json";
import zohLogo from "@/assets/partners/zoh.png.asset.json";
import wharfLogo from "@/assets/partners/wharf-street.png.asset.json";
import secureLedgerLogo from "@/assets/partners/secure-ledger.png.asset.json";

export type EcosystemRegion = "USA" | "UK" | "UAE";

export type EcosystemCompany = {
  name: string;
  url: string;
  description: string;
  region: EcosystemRegion;
  sector: string;
  logo: string | null;
};

export const ECOSYSTEM_REGIONS: { id: EcosystemRegion; label: string; flag: string; city: string }[] = [
  { id: "USA", label: "United States", flag: "🇺🇸", city: "North America" },
  { id: "UK", label: "United Kingdom", flag: "🇬🇧", city: "London" },
  { id: "UAE", label: "United Arab Emirates", flag: "🇦🇪", city: "Dubai" },
];

export const ECOSYSTEM_COMPANIES: EcosystemCompany[] = [
  {
    name: "AGC Global Logistics",
    url: "https://agcgl.com/",
    description: "Global logistics and freight services connecting businesses across borders.",
    region: "UAE",
    sector: "Logistics",
    logo: null,
  },
  {
    name: "Wharf Street Studios",
    url: "https://www.wharfstreetstudios.com/",
    description:
      "US studio building immersive games and AI-produced films, with a focus on blockchain gaming.",
    region: "USA",
    sector: "Media & Gaming",
    logo: wharfLogo.url,
  },
  {
    name: "ZOH Real Estate",
    url: "https://zoh.ae/",
    description:
      "UAE real-estate firm offering property investment, purchase and property-management services.",
    region: "UAE",
    sector: "Real Estate",
    logo: zohLogo.url,
  },
  {
    name: "Bliss Rent",
    url: "https://bliss.rent/",
    description: "Car-rental booking platform for Dubai airport rentals.",
    region: "UAE",
    sector: "Mobility",
    logo: blissLogo.url,
  },
  {
    name: "Secure Ledger Solutions",
    url: "https://secureledgerssolutions.com/",
    description:
      "Crypto advisory firm offering institutional advisory, liquidity management, digital-asset protection and OTC support.",
    region: "UK",
    sector: "Digital-asset advisory",
    logo: secureLedgerLogo.url,
  },
];

export function publicEcosystem(): EcosystemCompany[] {
  return ECOSYSTEM_COMPANIES;
}
