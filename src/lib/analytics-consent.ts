export const ANALYTICS_ID = "G-J4DVLBPWRZ";
export const COOKIE_KEY = "lamportpay-cookie-consent";
export const COOKIE_VERSION = 2;
export const COOKIE_CHANGE_EVENT = "lamportpay:cookie-choice";
export type CookieChoice = "all" | "essential";

export function readCookieChoice(raw: string | null, now = Date.now()): CookieChoice | null {
  if (!raw) return null;
  try {
    const record = JSON.parse(raw) as { choice?: unknown; version?: unknown; at?: unknown };
    if (record.version !== COOKIE_VERSION || typeof record.at !== "string") return null;
    const age = now - Date.parse(record.at);
    if (!Number.isFinite(age) || age < 0 || age > 365 * 24 * 60 * 60 * 1000) return null;
    return record.choice === "all" || record.choice === "essential" ? record.choice : null;
  } catch { return null; }
}

const PUBLIC_PAGES = new Set(["/", "/about", "/people", "/how-it-works", "/workflow", "/whitepaper", "/docs", "/compliance", "/cookies", "/partners", "/technology", "/roadmap", "/contact", "/faq", "/blog", "/news"]);
export function analyticsPath(pathname: string): string | null {
  if (PUBLIC_PAGES.has(pathname)) return pathname;
  return /^\/(blog|news)\/[a-z0-9-]+$/.test(pathname) ? pathname : null;
}