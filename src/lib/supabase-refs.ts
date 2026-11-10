/**
 * Supabase project refs (not secrets). Shared by the server mode guard
 * (app-mode.server.ts) and the build-time public configuration check
 * (public-env.ts), so both refuse the same database. No imports: vite.config.ts
 * loads this file through public-env.ts.
 */

/** The dev / TEST project (supabase/config.toml). */
export const DEV_SUPABASE_REF = "gdksfksypkcfiohozzsx";

/** Lovable Cloud's project: the live site's database with customer data (CLAUDE.md: never touch). */
export const LIVE_SUPABASE_REF = "zmcbnknjatrfwrcfvtzt";
