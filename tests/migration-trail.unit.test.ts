/**
 * One migration trail (30 Oct 2026). Lovable kept four schema changes in drizzle/migrations/,
 * which no LamportPay database is built from. They were ported to supabase/migrations
 * (20261015030000_support_chats.sql and 20261028100000_lovable_parity.sql). This fails when a
 * new file appears in drizzle/migrations/ (for example a later Lovable edit merged from main)
 * until it is ported too and listed here, so a production database built from
 * supabase/migrations/ is never missing a table the app uses.
 */
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const PORTED: Record<string, string[]> = {
  "0000_verified_wallets.sql": ["create table if not exists public.verified_wallets", "record_verified_wallet"],
  "0001_support_chats.sql": ["support_chats"],
  "0002_early_access_signups.sql": ["early_access_signups"],
  "0003_early_access_fee_waiver.sql": ["fee_waiver"],
};

const dir = (p: string) => join(process.cwd(), p);

describe("database migrations live in one trail", () => {
  it("every Lovable migration in drizzle/migrations/ has been ported", () => {
    const lovable = readdirSync(dir("drizzle/migrations")).filter((f) => f.endsWith(".sql")).sort();
    expect(lovable).toEqual(Object.keys(PORTED).sort());
  });

  it("supabase/migrations/ creates what each of them created", () => {
    const all = readdirSync(dir("supabase/migrations"))
      .filter((f) => f.endsWith(".sql"))
      .map((f) => readFileSync(join(dir("supabase/migrations"), f), "utf8").toLowerCase())
      .join("\n");
    for (const [file, marks] of Object.entries(PORTED)) {
      for (const mark of marks) expect(all.includes(mark), `${file}: ${mark}`).toBe(true);
    }
  });
});
