/**
 * Code-level lock for LIVE MODE.
 *
 * LIVE MODE stays unavailable while this is false, whatever the environment
 * says. Turning it on is a deliberate, reviewed code change, made only after
 * the production configuration is complete and the owner has approved going
 * live (docs/security/test-live-mode.md). Environment variables alone can
 * never enable live payments.
 *
 * Opened 11 Nov 2026 on the owner's decision, to run real-money tests on the
 * Production deployment before the domain switch. LIVE still needs the
 * recorded approval, the complete production configuration and
 * VERCEL_ENV=production (app-mode.server.ts); set this back to false to lock it.
 */
export const LIVE_MODE_CODE_UNLOCKED: boolean = true;
