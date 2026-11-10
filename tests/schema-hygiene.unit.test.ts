/**
 * Production schema hygiene (Implementation Batch 1, 9 Nov 2026).
 * Static checks on 20261109120000_production_schema_hygiene.sql and the code that depends
 * on it. The behaviour itself (who can read and write what) is checked against a real
 * Postgres by scripts/db-replay/run.sh.
 */
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const migrationsDir = join(process.cwd(), "supabase/migrations");
const HYGIENE = "20261109120000_production_schema_hygiene.sql";
const sql = readFileSync(join(migrationsDir, HYGIENE), "utf8");
const migrations = readdirSync(migrationsDir)
  .filter((f) => f.endsWith(".sql"))
  .sort();
const statements = (text: string) =>
  text
    .split("\n")
    .filter((l) => !l.trim().startsWith("--"))
    .join("\n");
const code = statements(sql);

function sourceFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = join(dir, e.name);
    if (e.isDirectory()) return sourceFiles(p);
    return /\.(ts|tsx)$/.test(e.name) ? [p] : [];
  });
}

describe("demo tables are removed", () => {
  it("drops both mock tables, payouts first, without CASCADE", () => {
    const payouts = code.indexOf("drop table if exists public.mock_payout_transfers;");
    const kyc = code.indexOf("drop table if exists public.mock_kyc_submissions;");
    expect(payouts).toBeGreaterThan(-1);
    expect(kyc).toBeGreaterThan(payouts);
    expect(code).not.toMatch(/cascade/i);
  });

  it("no application code or generated type refers to them", () => {
    const offenders = sourceFiles(join(process.cwd(), "src")).filter((f) =>
      /mock_kyc_submissions|mock_payout_transfers/.test(readFileSync(f, "utf8")),
    );
    expect(offenders).toEqual([]);
  });

  it("no later migration recreates them", () => {
    const later = migrations.filter((f) => f > HYGIENE);
    for (const f of later) {
      expect(readFileSync(join(migrationsDir, f), "utf8")).not.toMatch(
        /mock_(kyc_submissions|payout_transfers)/,
      );
    }
  });
});

describe("roles and invites are written by the server only", () => {
  it("revokes every write privilege on user_roles and admin_invites from signed-in and anonymous users", () => {
    expect(code).toMatch(
      /revoke insert, update, delete, truncate, references, trigger\s+on public\.user_roles, public\.admin_invites from anon, authenticated;/,
    );
  });

  it("no later migration grants a write privilege on them back", () => {
    for (const f of migrations.filter((m) => m > HYGIENE)) {
      const text = statements(readFileSync(join(migrationsDir, f), "utf8")).toLowerCase();
      expect(text).not.toMatch(
        /grant[^;]*(insert|update|delete|truncate|all)[^;]*public\.(user_roles|admin_invites)/,
      );
    }
  });

  it("the invite policy is read-only", () => {
    expect(code).toMatch(/drop policy if exists "Admins manage invites" on public\.admin_invites;/);
    expect(code).toMatch(
      /create policy "Admins read invites" on public\.admin_invites\s+for select to authenticated/,
    );
  });

  it("admin server functions change roles and invites with the service role, never the user's session", () => {
    const flat = readFileSync(join(process.cwd(), "src/lib/admin.functions.ts"), "utf8").replace(
      /\s+/g,
      "",
    );
    expect(flat).not.toMatch(
      /supabase\.from\("(user_roles|admin_invites)"\)\.(insert|update|upsert|delete)\(/,
    );
    expect(flat).toMatch(/supabaseAdmin\.from\("admin_invites"\)\.delete\(\)/);
  });

  it("cancelling an invite checks the admin session before using the service role", () => {
    const src = readFileSync(join(process.cwd(), "src/lib/admin.functions.ts"), "utf8");
    const fn = src.slice(src.indexOf("export const cancelAdminInvite"));
    const body = fn.slice(0, fn.indexOf("export const", 10));
    const check = body.indexOf("await isAdminSession(context)");
    const forbidden = body.indexOf('throw new Error("Forbidden")');
    const write = body.indexOf('.from("admin_invites")');
    expect(check).toBeGreaterThan(-1);
    expect(forbidden).toBeGreaterThan(check);
    expect(write).toBeGreaterThan(forbidden);
  });
});

describe("RLS evaluates auth.uid() and has_role() once per statement", () => {
  const policyStatements = code.split(";").filter((s) => /\b(alter|create) policy\b/i.test(s));

  it("rewrites the 23 policies that called them per row, plus the new invite policy", () => {
    expect(policyStatements.filter((s) => /alter policy/i.test(s))).toHaveLength(23);
    expect(policyStatements.filter((s) => /create policy/i.test(s))).toHaveLength(1);
  });

  it("every auth.uid() and has_role() call in a policy is wrapped in a select", () => {
    for (const s of policyStatements) {
      const bareUid = s.replace(/\(select auth\.uid\(\)\)/g, "").match(/auth\.uid\(\)/g);
      expect(bareUid, s).toBeNull();
      const calls = s.match(/public\.has_role\(/g)?.length ?? 0;
      const wrapped = s.match(/\(select public\.has_role\(/g)?.length ?? 0;
      expect(wrapped, s).toBe(calls);
    }
  });
});

describe("foreign-key indexes", () => {
  it("indexes the foreign keys of the tables that keep growing", () => {
    for (const [table, column] of [
      ["admin_audit_log", "actor_id"],
      ["payment_case_events", "actor_id"],
      ["payment_cases", "opened_by"],
      ["app_mode_events", "user_id"],
    ]) {
      expect(code).toContain(
        `create index if not exists ${table}_${column}_idx on public.${table} (${column});`,
      );
    }
  });
});

describe("funding pending-signature migration", () => {
  const pending = readFileSync(
    join(migrationsDir, "20261109100000_funding_pending_signature.sql"),
    "utf8",
  );

  it("runs before the hygiene migration", () => {
    expect(migrations.indexOf("20261109100000_funding_pending_signature.sql")).toBeLessThan(
      migrations.indexOf(HYGIENE),
    );
  });

  it("adds the pending columns, a lookup index and the both-or-neither check", () => {
    for (const column of [
      "funding_pending_signature text",
      "funding_pending_at timestamptz",
      "funding_pending_last_valid_block_height bigint",
      "funding_build_blockhash text",
      "funding_build_last_valid_block_height bigint",
    ]) {
      expect(pending).toContain(`add column if not exists ${column}`);
    }
    expect(pending).toMatch(
      /create index if not exists payments_funding_pending_signature_idx\s+on public\.payments \(funding_pending_signature\)\s+where funding_pending_signature is not null;/,
    );
    expect(pending).toContain(
      "check ((funding_pending_signature is null) = (funding_pending_at is null))",
    );
  });

  it("the TEST Pay Now flow never touches the new columns (works before the migration)", () => {
    const testFlow = readFileSync(
      join(process.cwd(), "src/lib/payments/test-payment.server.ts"),
      "utf8",
    );
    expect(testFlow).not.toMatch(/funding_(pending|build)_/);
    expect(testFlow).toMatch(/setPayerWallet\(payment\.id, wallet\);/);
  });

  it("does not make the pending signature unique across payments (review 10 Nov)", () => {
    // A signature recorded on someone else's payment must never block this one.
    expect(statements(pending)).not.toMatch(/unique/i);
  });
});

describe("rollback scripts (review 10 Nov)", () => {
  const rollbacks = join(process.cwd(), "supabase/rollbacks");

  it("exist for both Batch 1 migrations, outside the migrations folder", () => {
    for (const name of [
      "20261109100000_funding_pending_signature.down.sql",
      "20261109120000_production_schema_hygiene.down.sql",
    ]) {
      const sql = readFileSync(join(rollbacks, name), "utf8");
      expect(statements(sql)).toMatch(/^\s*begin;/m);
      expect(statements(sql)).toMatch(/^\s*commit;/m);
    }
    expect(migrations.some((f) => f.includes(".down."))).toBe(false);
  });

  it("the hygiene rollback never re-grants write access to roles or TRUNCATE", () => {
    const sql = statements(
      readFileSync(join(rollbacks, "20261109120000_production_schema_hygiene.down.sql"), "utf8"),
    ).toLowerCase();
    expect(sql).not.toMatch(/grant[^;]*public\.user_roles/);
    expect(sql).not.toMatch(/grant[^;]*truncate/);
  });
});
