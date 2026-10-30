import { createFileRoute, Link } from "@tanstack/react-router";

import { LegalPage, type LegalSection } from "@/components/site/LegalPage";
import { COMPANY } from "@/lib/company-profile";
import { LEGAL_CONTACT } from "@/lib/legal";
import { pageSeo } from "@/lib/seo";

export const Route = createFileRoute("/privacy")({
  head: () =>
    pageSeo({
      path: "/privacy",
      title: "Privacy policy — LamportPay",
      description:
        "What personal data LamportPay collects, why, who receives it, how long it is kept and your rights under UK data protection law.",
    }),
  component: PrivacyPage,
});

const SECTIONS: LegalSection[] = [
  {
    title: "Who we are",
    body: (
      <p>
        {COMPANY.legalName} ("LamportPay", "we") is the controller of the personal data described
        here. We are a private limited company registered in England and Wales (company number{" "}
        {COMPANY.number}), registered office {COMPANY.office}. Contact:{" "}
        <a href={`mailto:${LEGAL_CONTACT}`} className="text-primary underline">
          {LEGAL_CONTACT}
        </a>
        .
      </p>
    ),
  },
  {
    title: "How LamportPay works, in short",
    body: (
      <p>
        LamportPay is non-custodial software. You send stablecoins from your own Solana wallet to
        a single-use deposit address of our payout partner, Stables, which pays out to a bank
        account. We never hold your funds, private keys or seed phrases. Identity verification
        (KYC) happens on Stables' own hosted page, not on LamportPay.
      </p>
    ),
  },
  {
    title: "What we collect",
    body: (
      <ul className="list-disc pl-5 space-y-2">
        <li>
          <strong>Account and sign-in:</strong> your Solana wallet address when you sign in with
          your wallet (a signed message, never a transaction), or your email address if you sign
          in with email. Admin staff accounts also hold a second-factor (authenticator) record.
        </li>
        <li>
          <strong>Verification status:</strong> the first and last name returned by Stables after
          verification, the verification status and the link to Stables' hosted page. We do not
          receive or store your identity documents. If you have no email on your account, the email
          you give for verification is passed to Stables and not stored by us.
        </li>
        <li>
          <strong>Payments:</strong> amounts, coins, destination country and currency, fees, status,
          on-chain transaction signatures and the deposit address used. For the payout we keep a
          summary: account holder name, bank name, bank country and the last four digits of the
          account. The full bank details you enter are sent to Stables to validate and make the
          payout.
        </li>
        <li>
          <strong>Support:</strong> messages you send through the in-app assistant or support chat,
          any contact email you give, and complaint details.
        </li>
        <li>
          <strong>Early access:</strong> name, email and wallet address if you join the early-access
          list.
        </li>
        <li>
          <strong>Technical and security data:</strong> IP address and request details used for
          rate limiting, fraud prevention and keeping the service secure; server logs from our
          hosting provider.
        </li>
        <li>
          <strong>Cookies and browser storage:</strong> see our{" "}
          <Link to="/cookies" className="text-primary underline">
            cookie policy
          </Link>
          .
        </li>
      </ul>
    ),
  },
  {
    title: "Why we use it (lawful bases)",
    body: (
      <ul className="list-disc pl-5 space-y-2">
        <li>
          <strong>To provide the service you ask for</strong> (contract): sign-in, quotes, payouts,
          payment history, receipts and support.
        </li>
        <li>
          <strong>To meet legal obligations</strong>: record keeping, and supporting our payout
          partner's anti-money-laundering, sanctions and travel-rule checks.
        </li>
        <li>
          <strong>Legitimate interests</strong>: securing accounts and systems, preventing fraud and
          abuse, handling complaints, and improving the service.
        </li>
        <li>
          <strong>Consent</strong>: optional analytics on public pages, which you can withdraw at any
          time in cookie settings.
        </li>
      </ul>
    ),
  },
  {
    title: "Who receives it",
    body: (
      <>
        <ul className="list-disc pl-5 space-y-2">
          <li>
            <strong>Stables</strong> (payout partner): identity verification, payout details and
            payment information needed to make the payout, under Stables' own privacy policy.
          </li>
          <li>
            <strong>Service providers acting for us</strong>: database and authentication hosting
            (Supabase), website and application hosting, a Solana network data provider, price and
            routing quotes (Jupiter), and an AI service used by the in-app assistant (messages are
            processed through Lovable's AI gateway by an OpenAI model).
          </li>
          <li>
            <strong>Google</strong>: analytics data from public pages, only if you accept optional
            cookies.
          </li>
          <li>
            <strong>Authorities</strong>, where the law requires it.
          </li>
        </ul>
        <p>
          <strong>Public blockchain.</strong> Solana transactions, including your wallet address
          and amounts, are public and permanent. Neither we nor anyone else can change or delete
          them.
        </p>
        <p>
          Some providers process data outside the UK. Where they do, we rely on safeguards
          recognised under UK law, such as the UK International Data Transfer Agreement or
          addendum.
        </p>
      </>
    ),
  },
  {
    title: "How long we keep it",
    body: (
      <p>
        Payment and verification records are kept for as long as financial and anti-money-laundering
        rules require (typically six years after the payment), then deleted or anonymised. Support
        conversations and early-access entries are kept while they are needed to help you or run the
        early-access list. Security logs are kept for a short period. The admin audit log is kept
        unchanged as a record of staff actions.
      </p>
    ),
  },
  {
    title: "Your rights",
    body: (
      <>
        <p>
          You can ask to access, correct or delete your data, to restrict or object to how we use
          it, and to receive a copy in a portable format. Where we rely on consent you can withdraw
          it at any time. Some data must be kept by law, and on-chain data cannot be deleted.
        </p>
        <p>
          Write to{" "}
          <a href={`mailto:${LEGAL_CONTACT}`} className="text-primary underline">
            {LEGAL_CONTACT}
          </a>
          . If you are unhappy with our answer you can complain to the Information Commissioner's
          Office (
          <a
            href="https://ico.org.uk/make-a-complaint/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary underline"
          >
            ico.org.uk
          </a>
          ).
        </p>
      </>
    ),
  },
  {
    title: "Security",
    body: (
      <p>
        We never ask for or store private keys or seed phrases, and every payment is signed by you
        in your own wallet. Staff access to the admin console needs a password and an authenticator
        code, and every admin action is recorded in an audit log that cannot be edited.
      </p>
    ),
  },
  {
    title: "Changes",
    body: (
      <p>
        We will update this page when how we use personal data changes, and show the date of the
        latest version at the top.
      </p>
    ),
  },
];

function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy policy"
      intro="How Lamport Pay Ltd collects and uses personal data on lamportpay.com and in the LamportPay app."
      sections={SECTIONS}
    />
  );
}
