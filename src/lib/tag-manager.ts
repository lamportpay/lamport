import { isAdminArea } from "@/lib/admin-path";

export const GTM_ID = "GTM-M8XDHCH4";

/**
 * Google Tag Manager runs whatever code is published in the GTM console, so it never loads on
 * admin pages (sign-in included). Everywhere else it loads as before.
 */
export function tagManagerAllowed(pathname: string): boolean {
  return !isAdminArea(pathname);
}

export const GTM_SNIPPET = `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${GTM_ID}');`;

/** True when Google's tag code (GTM, or gtag.js from the marketing pages) ran in this document. */
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
