/**
 * The site's public wording stage: "test" (devnet and the partner's sandbox; today)
 * or "live" (real payments, only once LIVE is active). Decided by the server
 * (launch-stage.functions.ts) and read by components through the root route.
 */
import { getRouteApi } from "@tanstack/react-router";

export type LaunchStage = "test" | "live";

const rootRoute = getRouteApi("__root__");

/** Current wording stage; "test" until the server says LIVE is active. */
export function useLaunchStage(): LaunchStage {
  const data = rootRoute.useLoaderData() as { stage?: LaunchStage } | undefined;
  return data?.stage === "live" ? "live" : "test";
}

/** The stage inside a route's `head()`, read from the root route's match. */
export function stageFromMatches(
  matches: ReadonlyArray<{ routeId?: string; loaderData?: unknown }>,
): LaunchStage {
  const root = matches.find((m) => m.routeId === "__root__")?.loaderData as
    { stage?: LaunchStage } | undefined;
  return root?.stage === "live" ? "live" : "test";
}

/** Pick the wording for the current stage. */
export function useStageText<T>(text: { test: T; live: T }): T {
  return text[useLaunchStage()];
}
