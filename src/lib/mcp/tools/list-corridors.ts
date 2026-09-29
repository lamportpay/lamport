import { defineTool } from "@lovable.dev/mcp-js";
import { CORRIDORS, PAYOUT_METHODS, SENDER_CURRENCIES } from "@/components/site/demo-data";

export default defineTool({
  name: "list_corridors",
  title: "List payout corridors",
  description:
    "List Stables-supported payout currencies used by the LamportPay demo, with indicative demo FX rates, payout methods, and Stables-supported pay-in currencies.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: () => {
    const corridors = CORRIDORS.map((c) => ({
      country: c.country,
      currency: c.currency,
      usdRate: c.rate,
    }));
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              note: "Currency availability follows Stables' public documentation. FX rates are indicative LamportPay demo data, not live Stables quotes.",
              corridors,
              payoutMethods: PAYOUT_METHODS,
              senderCurrencies: SENDER_CURRENCIES,
            },
            null,
            2,
          ),
        },
      ],
      structuredContent: {
        corridors,
        payoutMethods: [...PAYOUT_METHODS],
        senderCurrencies: [...SENDER_CURRENCIES],
      },
    };
  },
});
