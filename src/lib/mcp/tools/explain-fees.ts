import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";

export default defineTool({
  name: "explain_fees",
  title: "Explain LamportPay fees",
  description:
    "Explain how LamportPay's demo fee model works, optionally broken down for a specific USD amount.",
  inputSchema: {
    usdAmount: z
      .number()
      .positive()
      .optional()
      .describe("Optional USD send amount to break the fees down for."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: ({ usdAmount }) => {
    const model = {
      stablesPayoutFee: "Indicative demo fee: 1% of the USD value, minimum $1; not a live Stables quote",
      lamportpayFee: "2% of the total the user sends, taken out of it (demo model)",
      fxSpread: "None in the demo — indicative mid-market demo rates are used",
      networkFee: "Solana network fees are paid by the sender's wallet (fractions of a cent)",
    };
    const breakdown = usdAmount
      ? (() => {
          const payout = Math.max(1, usdAmount * 0.01);
          const lamportpay = Math.ceil((usdAmount / 1.02) * 0.02 * 100) / 100;
          return {
            usdAmount,
            stablesPayoutFee: Number(payout.toFixed(2)),
            lamportpayFee: Number(lamportpay.toFixed(2)),
            totalFee: Number((payout + lamportpay).toFixed(2)),
            netSettled: Number((usdAmount - payout - lamportpay).toFixed(2)),
          };
        })()
      : null;
    const result = {
      model,
      breakdown,
      note: "Demo figures only. No real fiat conversion or payout takes place.",
    };
    return {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      structuredContent: result,
    };
  },
});
