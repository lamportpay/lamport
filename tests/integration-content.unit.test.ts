import { describe, expect, it } from "vitest";

import { integrationPartners } from "@/content/integrations";

const circle = integrationPartners.find((item) => item.name === "Circle (USDC)");

describe("Circle (USDC) integration card", () => {
  it("is a planned partnership, never shown as live or confirmed", () => {
    expect(circle?.status).toBe("Planned");
    expect(circle?.detail).toBe(
      "USDC is supported through the current settlement infrastructure. A direct partnership with Circle is planned and not yet confirmed.",
    );
    expect(circle?.href).toBe("https://www.circle.com");
  });
});
