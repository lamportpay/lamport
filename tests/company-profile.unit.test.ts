import { describe, expect, it } from "vitest";
import { COMPANY, companyGraph } from "../src/lib/company-profile";

describe("public company facts", () => {
  it("uses the owner's company number", () => {
    expect(COMPANY.number).toBe("11464834");
  });
  it("uses legal incorporation, not an invented product launch date", () => {
    expect(COMPANY.incorporationDate).toBe("2018-07-16");
  });
  it("identifies the confirmed founder and CEO", () => {
    expect(COMPANY.founder).toMatchObject({ name: "Zoaib Ali", role: "Founder & CEO" });
  });
  it("uses the registered office supplied by the owner", () => {
    expect(COMPANY.address).toEqual({ streetAddress: "7 Bell Yard", addressLocality: "London", postalCode: "WC2A 2JR", addressCountry: "GB" });
  });
  it("links the organization to its founder without inventing stock information", () => {
    const graph = companyGraph()["@graph"];
    const organization = graph.find((node) => node["@type"] === "Organization");
    expect(organization?.founder).toEqual({ "@id": "https://lamportpay.com/#zoaib-ali" });
    expect(organization).not.toHaveProperty("tickerSymbol");
  });
});