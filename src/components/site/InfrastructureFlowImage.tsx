import flowImage from "@/assets/multi-asset-payment-flow-infographic.png.asset.json";

/**
 * The multi-asset payment flow infographic, shown as one high-resolution image
 * so every label stays exactly as the team approved it. The artwork already
 * carries its own heading and status badges, so nothing is duplicated here.
 */
export function InfrastructureFlowImage() {
  return (
    <section className="home-section flow-image-section" id="flow">
      <div className="flow-image-container">
        <h2 className="sr-only">
          How a multi-asset payment reaches a local bank account: digital assets, asset and network
          detection, liquidity and conversion, identity check, USDC settlement, licensed payout
          partners, local currency, recipient.
        </h2>
        <div className="flow-image-scroll">
          <img
            className="flow-image"
            src={flowImage.url}
            width={1774}
            height={887}
            loading="lazy"
            decoding="async"
            alt="Flow diagram. Digital assets — Solana live, Bitcoin, Ethereum, USDT, USDC and BNB Chain planned — are checked for network and liquidity, routed through Jupiter or Hyperliquid for conversion to USDC, pass an identity check, settle in USDC, then move through licensed payout partners to local currency in the recipient's bank account. If the identity check fails, funds return to the original wallet."
          />
        </div>
        <p className="flow-image-hint">Swipe sideways to read the flow at full size.</p>
        <a className="flow-image-open" href={flowImage.url} target="_blank" rel="noopener">
          View full size
        </a>
      </div>
    </section>
  );
}
