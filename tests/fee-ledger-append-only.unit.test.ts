/**
 * The LamportPay fee ledger stays append-only in the database, TRUNCATE included. Behaviour was
 * checked on a local Postgres on 30 Oct 2026: before 20261030130000 service_role could TRUNCATE;
 * after it, UPDATE/DELETE/TRUNCATE are refused for service_role and for the owner, while inserts
 * and ON CONFLICT DO NOTHING (appendFeeLedger) still work.
 */
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const base = readFileSync(
  new URL("../supabase/migrations/20260930150000_fee_ledger_pricing_snapshot.sql", import.meta.url),
  "utf8",
);
const noTruncate = readFileSync(
  new URL("../supabase/migrations/20261030130000_fee_ledger_no_truncate.sql", import.meta.url),
  "utf8",
);
const writer = readFileSync(new URL("../src/lib/payments/fee-ledger.server.ts", import.meta.url), "utf8");

describe("payment_fee_ledger is append-only", () => {
  it("refuses UPDATE and DELETE row by row", () => {
    expect(base).toMatch(/before update or delete on public\.payment_fee_ledger/);
    expect(base).toMatch(/raise exception 'payment_fee_ledger is append-only'/);
  });

  it("refuses TRUNCATE and holds no update/delete/truncate grant for any API role", () => {
    expect(noTruncate).toMatch(/before truncate on public\.payment_fee_ledger/);
    expect(noTruncate).toMatch(/for each statement execute function public\.fee_ledger_append_only\(\)/);
    expect(noTruncate).toMatch(
      /revoke update, delete, truncate on public\.payment_fee_ledger from anon, authenticated, service_role/,
    );
  });

  it("the app only inserts, ignoring duplicates (needs no UPDATE privilege)", () => {
    expect(writer).toMatch(/ignoreDuplicates: true/);
    expect(writer).not.toMatch(/from\("payment_fee_ledger"\)\s*\.(update|delete)\(/);
  });
});
