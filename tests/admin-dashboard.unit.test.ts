import { describe, expect, it } from "vitest";
import {
  filterRecentPayments,
  statusLabel,
  statusTone,
  type AdminDashboardData,
} from "../src/lib/admin-dashboard";
const rows: AdminDashboardData["recent"] = [
  {
    id: "abc123",
    status: "COMPLETED",
    created_at: "2026-10-14T00:00:00Z",
    source_currency: "usdc",
    source_amount_minor: "20000000",
    destination_currency: "gbp",
    destination_amount_minor: "1450",
    destination_country: "GB",
  },
  {
    id: "def456",
    status: "KYC_PENDING",
    created_at: "2026-10-13T00:00:00Z",
    source_currency: "usdc",
    source_amount_minor: "15000000",
    destination_currency: "php",
    destination_amount_minor: null,
    destination_country: "PH",
  },
];
describe("Admin dashboard presentation", () => {
  it("keeps all recent records when filters are empty", () =>
    expect(filterRecentPayments(rows, "", "all")).toEqual(rows));
  it("searches country, currency and ID case-insensitively", () => {
    expect(filterRecentPayments(rows, " gb ", "all")).toEqual([rows[0]]);
    expect(filterRecentPayments(rows, "PHP", "all")).toEqual([rows[1]]);
    expect(filterRecentPayments(rows, "ABC", "all")).toEqual([rows[0]]);
  });
  it("combines search and status without changing records", () => {
    expect(filterRecentPayments(rows, "usdc", "KYC_PENDING")).toEqual([rows[1]]);
    expect(filterRecentPayments(rows, "abc", "KYC_PENDING")).toEqual([]);
    expect(rows).toHaveLength(2);
  });
  it("labels statuses without claiming completion for other states", () => {
    expect(statusLabel("KYC_PENDING")).toBe("kyc pending");
    expect(statusTone("COMPLETED")).toContain("text-success");
    expect(statusTone("FAILED")).toContain("text-destructive");
    expect(statusTone("TRANSFER_CREATED")).toContain("text-muted-foreground");
  });
});
