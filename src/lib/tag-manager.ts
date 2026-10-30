/**
 * Google Tag Manager was removed from the application origin (30 Oct 2026): it ran whatever
 * code was published in its console on the same origin as the session tokens. What remains
 * is Google Analytics on marketing pages after consent, and this guard: an admin page is never
 * shown in a document where Google's tag code already ran.
 */

/** True when Google's tag code (gtag.js from the marketing pages) ran in this document. */
export function googleTagLoaded(win: object): boolean {
  return Reflect.get(win, "google_tag_manager") !== undefined || Reflect.get(win, "dataLayer") !== undefined;
}

const CLEAN_LOAD_KEY = "lamportpay-admin-clean-load";
const CLEAN_LOAD_WINDOW_MS = 10_000;

/**
 * Client-side navigation keeps already-loaded tag code running, so entering admin from a tagged
 * page reloads the document (served without tags). Returns false instead of reloading again
 * within 10 s, so something else defining `dataLayer` (an extension) cannot cause a loop.
 */
export function reloadWithoutTags(
  href: string,
  storage: Pick<Storage, "getItem" | "setItem"> | undefined,
  assign: (href: string) => void,
  now = Date.now(),
): boolean {
  let last = 0;
  try {
    last = Number(storage?.getItem(CLEAN_LOAD_KEY) ?? 0);
  } catch {
    /* storage blocked: reload anyway */
  }
  if (now - last < CLEAN_LOAD_WINDOW_MS) return false;
  try {
    storage?.setItem(CLEAN_LOAD_KEY, String(now));
  } catch {
    /* storage blocked */
  }
  assign(href);
  return true;
}
