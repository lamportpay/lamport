import { createFileRoute, Link } from "@tanstack/react-router";

import { LegalPage, type LegalSection } from "@/components/site/LegalPage";
import { COMPANY } from "@/lib/company-profile";
import { LEGAL_CONTACT } from "@/lib/legal";
import { pageSeo } from "@/lib/seo";

export const Route = createFileRoute("/terms")({
  head: () =>
    pageSeo({
      path: "/terms",
      title: "Terms of use — LamportPay",
      description:
        "The terms for using LamportPay: a non-custodial service to send stablecoins from your own wallet to a bank payout through our partner Stables.",
    }),
  component: TermsPage,
});

const SECTIONS: LegalSection[] = [
  {
    title: "About these terms",
    body: (
      <p>
        These terms apply when you use lamportpay.com and the LamportPay app. They are an agreement
        between you and {COMPANY.legalName} (company number {COMPANY.number}, {COMPANY.office}). By
        using LamportPay you accept them. Our{" "}
        <Link to="/privacy" className="text-primary underline">
          privacy policy
        </Link>{" "}
        and{" "}
        <Link to="/cookies" className="text-primary underline">
          cookie policy
        </Link>{" "}
        explain how we handle data.
      </p>
    ),
  },
  {
    title: "What LamportPay does",
    body: (
      <>
        <p>
          LamportPay is non-custodial software. It helps you send USDC on Solana from your own
          wallet to a single-use deposit address of our payout partner, Stables, which converts it
          and pays out to a bank account. We never hold your funds, private keys or seed phrases,
          and we cannot move funds from your wallet: every payment is a transaction you review and
          sign yourself.
        </p>
        <p>
          The payout itself, identity verification and the bank transfer are provided by Stables
          under its own terms. LamportPay is not a bank, does not take deposits and does not give
          investment, tax or legal advice.
        </p>
        <p>
          <strong>Current status:</strong> bank payouts and identity verification are being tested
          in Stables' sandbox, pending production approval. Until LamportPay announces otherwise,
          no real bank payouts are made.
        </p>
      </>
    ),
  },
  {
    title: "Who can use it",
    body: (
      <ul className="list-disc pl-5 space-y-2">
        <li>You must be at least 18 and able to enter a binding agreement.</li>
        <li>
          You must complete Stables' identity verification before any payout, and use LamportPay
          only with funds that are lawfully yours.
        </li>
        <li>
          You must not use LamportPay if you, or the payout's beneficiary, are subject to sanctions,
          or from a country where the service is not offered.
        </li>
        <li>
          Payouts go to your own bank account or to a named beneficiary you are allowed to pay, with
          an accurate purpose.
        </li>
      </ul>
    ),
  },
  {
    title: "Quotes, fees and limits",
    body: (
      <>
        <p>
          Before you sign, LamportPay shows what you will send, the LamportPay fee as an amount,
          the payout partner's fee and the expected payout. The LamportPay fee is charged once per
          payment and is taken out of what you send. Payout partner fees, swap costs and Solana
          network fees are separate and shown separately.
        </p>
        <p>
          Quotes are valid for a limited time. Minimum and maximum amounts per payment apply and
          are shown in the app.
        </p>
      </>
    ),
  },
  {
    title: "Your responsibilities",
    body: (
      <ul className="list-disc pl-5 space-y-2">
        <li>Keep your wallet, keys and devices secure; anyone with them can sign for you.</li>
        <li>
          Check the payout details and the transaction in your wallet before signing. Blockchain
          transactions cannot be reversed once confirmed.
        </li>
        <li>Give accurate information to us and to Stables.</li>
        <li>
          Do not use LamportPay for fraud, money laundering, terrorist financing, sanctions evasion
          or any other unlawful purpose, and do not try to disrupt or attack the service.
        </li>
      </ul>
    ),
  },
  {
    title: "When things go wrong",
    body: (
      <>
        <p>
          If a payout is delayed or fails, contact us through the app or at{" "}
          <a href={`mailto:${LEGAL_CONTACT}`} className="text-primary underline">
            {LEGAL_CONTACT}
          </a>
          . We will work with Stables to trace it; refunds of a failed payout are made by Stables
          according to its terms.
        </p>
        <p>
          We may pause payments, or refuse or suspend use of LamportPay, to protect users, meet
          legal requirements or keep the service secure.
        </p>
      </>
    ),
  },
  {
    title: "Third-party services",
    body: (
      <p>
        LamportPay relies on services we do not control: Stables, your wallet, the Solana network
        and, where used, swap routing by Jupiter. Their availability, fees and terms are theirs.
      </p>
    ),
  },
  {
    title: "Risks",
    body: (
      <p>
        Stablecoins and blockchain networks carry risks, including network congestion, failed
        transactions, smart-contract or wallet faults and changes in stablecoin value or
        regulation. You use LamportPay at your own risk within the limits of the law.
      </p>
    ),
  },
  {
    title: "Our liability",
    body: (
      <p>
        We provide LamportPay with reasonable care and skill. To the extent the law allows, we are
        not liable for losses caused by third-party services, by transactions you sign, or by
        events outside our reasonable control, nor for indirect losses. Nothing in these terms
        limits liability for death or personal injury caused by negligence, for fraud, or any
        liability that cannot be limited by law, and nothing affects your statutory rights as a
        consumer.
      </p>
    ),
  },
  {
    title: "Changes and law",
    body: (
      <p>
        We may update these terms; the date at the top shows the latest version, and material
        changes will be announced in the app. These terms are governed by the law of England and
        Wales, and its courts have jurisdiction, without removing any right you have as a consumer
        to bring proceedings where you live.
      </p>
    ),
  },
];

function TermsPage() {
  return (
    <LegalPage
      title="Terms of use"
      intro="The terms for using lamportpay.com and the LamportPay app."
      sections={SECTIONS}
    />
  );
}
