# Applying the Batch 1 migrations (prepared 11 Nov 2026, NOT applied)

Two migrations, both reviewed and replayed locally (35 migrations, 31 access
checks; apply, re-apply, rollback and apply again tested on a copy of the dev
schema). Nothing below has been run against any remote database. Each step
needs the owner's explicit "go" for that step.

| File | What it does | Safe for the code running today? |
| --- | --- | --- |
| `20261109100000_funding_pending_signature.sql` | Adds 5 nullable columns to `payments`, an index and a both-or-neither check | Yes: additive only; old code ignores the columns |
| `20261109120000_production_schema_hygiene.sql` | Drops the 2 demo tables, removes user write grants on roles and invites, `has_role` with empty `search_path`, faster RLS, 4 indexes | Only with Batch 1 code: the old "cancel invite" used the admin's own session |

## Order

1. Dev, migration 1: any time after approval (additive).
2. Merge Batch 1 into `vercel-preview-migration`; check the Preview.
3. Dev, migration 2: after step 2 (the Preview then runs code that no longer
   writes invites with the user's session).
4. Production: the new project is built from all files with the CLI (below),
   never by copying dev.

## Dev project (`gdksfksypkcfiohozzsx`): exact steps

Dev's migration history does not use the file version numbers (it was built
with named migrations). **Do not run `supabase db push` against dev**: it would
try to re-run every file. Apply each file the way the earlier ones were applied,
as a named migration:

- Migration 1: Supabase MCP `apply_migration`, project `gdksfksypkcfiohozzsx`,
  name `funding_pending_signature`, query = the full contents of
  `supabase/migrations/20261109100000_funding_pending_signature.sql`.
  (Alternative: Supabase dashboard → SQL editor → paste the file → Run.)
- Migration 2: the same with name `production_schema_hygiene` and
  `supabase/migrations/20261109120000_production_schema_hygiene.sql`.

Check after each step (read-only SQL):

```sql
-- after migration 1
select column_name from information_schema.columns
 where table_schema = 'public' and table_name = 'payments'
   and (column_name like 'funding_pending%' or column_name like 'funding_build%');
-- expect 5 rows

-- after migration 2
select to_regclass('public.mock_kyc_submissions') is null as demo_dropped,
       (select proconfig from pg_proc where oid = 'public.has_role(uuid,public.app_role)'::regprocedure) as has_role_config,
       (select string_agg(privilege_type, ',') from information_schema.role_table_grants
         where table_schema = 'public' and table_name = 'user_roles' and grantee = 'authenticated') as user_roles_grants;
-- expect: true, {search_path=""}, SELECT
```

Then in the Preview: admin sign-in with the authenticator, Roles page lists
roles and invites, cancel an invite, and a TEST Pay Now on devnet.

## Rollback

Run in the SQL editor (each script is one transaction):

- Migration 2: `supabase/rollbacks/20261109120000_production_schema_hygiene.down.sql`.
  Restores `has_role` with `search_path=public`, the previous RLS expressions,
  the read-and-write invite policy and invite writes for signed-in users, and
  drops the 4 indexes. It does not restore the demo tables (sample data) or
  write/TRUNCATE grants on roles, which no code used.
- Migration 1: `supabase/rollbacks/20261109100000_funding_pending_signature.down.sql`,
  only after code that reads the columns is no longer deployed. Loses only
  pending markers, never verified funding.

## Production project (new, empty)

After the project exists (owner, Supabase Pro) and only with approval:

```bash
supabase link --project-ref <production-ref>      # owner logs in; no keys in files
supabase db push --dry-run                        # must list all 35 files, in order
supabase db push                                  # applies them; records file versions
```

Then run `scripts/db-replay/checks.sql` style checks read-only (roles, invites,
`has_role`, demo tables absent) and the Supabase security advisor. The replay
tool (`scripts/db-replay/run.sh`) reproduces the same result on a local Postgres
first. Dev runs Postgres 17; the local replay ran on 16.
