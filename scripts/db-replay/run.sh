#!/usr/bin/env bash
# Replays every file in supabase/migrations/ in order on a NEW throwaway database, then
# runs the access-control checks in checks.sql. LOCAL ONLY: it creates and drops the
# database named in REPLAY_DB on the server given by the usual PG* variables (PGHOST,
# PGPORT, PGUSER = a superuser). Never point it at a Supabase project.
#
# Needs Postgres 16 client and server. pg_net and pg_cron are replaced by the no-network
# stubs in extension/ (copied into the server's extension directory if missing).
set -euo pipefail
here="$(cd "$(dirname "$0")" && pwd)"
repo="$(cd "$here/../.." && pwd)"
db="${REPLAY_DB:-lamportpay_migration_replay}"
case "${PGHOST:-}" in *supabase.co*|*supabase.com*|*pooler*) echo "Refusing: PGHOST looks like a hosted Supabase database." >&2; exit 2;; esac

extdir="$(pg_config --sharedir)/extension"
for f in "$here"/extension/*; do
  [ -f "$extdir/$(basename "$f")" ] || cp "$f" "$extdir/"
done

psql_q() { psql -X -q -v ON_ERROR_STOP=1 "$@"; }
psql_q -d postgres -c "drop database if exists $db" -c "create database $db"
psql_q -d "$db" -f "$here/supabase-stub.sql"

n=0
for f in $(ls "$repo"/supabase/migrations/*.sql | sort); do
  # one transaction per migration, as the Supabase CLI applies them
  if ! out=$(psql_q -d "$db" -1 -f "$f" 2>&1); then
    echo "FAIL $(basename "$f")"; echo "$out" | grep -v NOTICE | head -10
    echo "Applied before the failure: $n"; exit 1
  fi
  n=$((n + 1)); echo "ok   $(basename "$f")"
done
echo "Applied $n migrations."

out=$(psql_q -d "$db" -f "$here/checks.sql" 2>&1) || { echo "$out" | grep -E "pass|FAIL|ERROR"; exit 1; }
echo "$out" | grep -oE "pass: .*"
echo "Checks passed: $(echo "$out" | grep -c "pass: ")"
[ "${KEEP_REPLAY_DB:-0}" = 1 ] || psql_q -d postgres -c "drop database $db"
