/** Public corporate facts, checked against the live Companies House register on 2026-10-28. */
export const COMPANY = {
  brand: "LamportPay",
  legalName: "Lamport Pay Ltd",
  number: "11464834",
  incorporationDate: "2018-07-16",
  incorporationLabel: "16 July 2018",
  currentNameDate: "2026-09-14",
  status: "Active",
  type: "Private limited company",
  address: { streetAddress: "7 Bell Yard", addressLocality: "London", postalCode: "WC2A 2JR", addressCountry: "GB" },
  office: "7 Bell Yard, London, WC2A 2JR, United Kingdom",
  registerUrl: "https://find-and-update.company-information.service.gov.uk/company/11464834",
  officersUrl: "https://find-and-update.company-information.service.gov.uk/company/11464834/officers",
  founder: { name: "Zoaib Ali", role: "Founder & CEO", directorAppointed: "2018-07-16" },
  previousNames: [
    { name: "Capital One Group Ltd", from: "16 July 2018", to: "15 January 2025" },
    { name: "Block Sphere Consulting Ltd", from: "15 January 2025", to: "14 September 2026" },
  ],
  sic: [
    { code: "62012", name: "Business and domestic software development" },
    { code: "62020", name: "Information technology consultancy activities" },
    { code: "62090", name: "Other information technology service activities" },
  ],
} as const;

export function companyGraph() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": "https://lamportpay.com/#organization",
        name: COMPANY.brand,
        legalName: COMPANY.legalName,
        url: "https://lamportpay.com",
        email: "hello@lamportpay.com",
        foundingDate: COMPANY.incorporationDate,
        identifier: { "@type": "PropertyValue", propertyID: "UK Companies House company number", value: COMPANY.number },
        address: { "@type": "PostalAddress", ...COMPANY.address },
        founder: { "@id": "https://lamportpay.com/#zoaib-ali" },
        description: "LamportPay is a non-custodial crypto-to-local-bank payment platform. Bank payouts and hosted identity verification remain in the Stables sandbox pending production approval.",
        sameAs: [COMPANY.registerUrl, "https://x.com/LamportPay", "https://www.linkedin.com/company/lamportpay", "https://github.com/lamportpay"],
      },
      {
        "@type": "Person",
        "@id": "https://lamportpay.com/#zoaib-ali",
        name: COMPANY.founder.name,
        jobTitle: COMPANY.founder.role,
        url: "https://lamportpay.com/people",
        worksFor: { "@id": "https://lamportpay.com/#organization" },
      },
      {
        "@type": "WebSite",
        "@id": "https://lamportpay.com/#website",
        name: COMPANY.brand,
        url: "https://lamportpay.com",
        inLanguage: "en",
        publisher: { "@id": "https://lamportpay.com/#organization" },
      },
    ],
  };
}