# Migration replay (local only)

`run.sh` builds a new throwaway Postgres database, applies every file in
`supabase/migrations/` in order (one transaction each, as the Supabase CLI does),
then runs `checks.sql`: who can read and write roles, invites, payments and the
audit log; that the demo tables are gone; that `has_role()` has an empty
`search_path`; and the pending funding-signature rules.

It never touches a Supabase project. `supabase-stub.sql` stands in for what a
Supabase project already has before the first migration (the `anon`,
`authenticated` and `service_role` roles, Supabase's default grants on `public`,
`auth.users`, `auth.identities`, `auth.uid()/role()/jwt()`, and a plain-text
`vault`). `extension/` holds no-network stand-ins for `pg_net` and `pg_cron`.

```bash
# Postgres 16 server you control, connected as a superuser
PGHOST=/path/to/socket PGPORT=5432 PGUSER=postgres bash scripts/db-replay/run.sh
# KEEP_REPLAY_DB=1 keeps the database for inspection
```

Result on 9 Nov 2026: 35 migrations applied, 31 checks passed. The same
checks against the 33 migrations before Batch 1 fail at "aal2 admin deleting
roles", which is the gap the hygiene migration closes.
