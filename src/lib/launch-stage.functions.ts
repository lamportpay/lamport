/**
 * Which public wording the site shows (decision 3 Nov 2026, docs/launch/live-wording.md):
 * "live" only when LIVE is actually active — the server runs LIVE MODE and every LIVE
 * requirement is met (code lock open, owner approval, production configuration; the
 * same check as /api/integration-status `liveAvailable`). Anything else is "test", so
 * a LIVE build that is still locked never claims real payouts. Read on the server once
 * per page load by the root route.
 */
import { createServerFn } from "@tanstack/react-start";

import type { LaunchStage } from "./launch-stage";

export const getLaunchStage = createServerFn({ method: "GET" }).handler(
  async (): Promise<{ stage: LaunchStage }> => {
    const { currentMode } = await import("@/lib/app-mode.server");
    const status = currentMode();
    const live = status.mode === "live" && status.ok && status.liveAvailable;
    return { stage: live ? "live" : "test" };
  },
);
