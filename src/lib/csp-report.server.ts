import { z } from "zod";

/**
 * Content-Security-Policy violation reports (POST /api/csp-report, 30 Oct 2026).
 *
 * The endpoint is public: anyone can post to it. Reports are validated, reduced to
 * four fields that cannot carry personal data (directive name, blocked host or
 * keyword, page path with identifiers masked, disposition) and only logged. Nothing
 * else from a report is kept or logged: no full URLs, query strings, fragments,
 * script samples, source files, referrers or user agents.
 */

export const CSP_REPORT_MAX_BYTES = 8 * 1024;
/** Per client IP per minute, shared across server instances (allowShared). */
export const CSP_REPORT_RATE_PER_MINUTE = 30;
const MAX_REPORTS_PER_REQUEST = 10;

/** report-uri sends application/csp-report; the Reporting API sends application/reports+json. */
export const CSP_REPORT_CONTENT_TYPES = ["application/csp-report", "application/reports+json"] as const;
export type CspReportContentType = (typeof CSP_REPORT_CONTENT_TYPES)[number];

const DIRECTIVES = new Set([
  "default-src", "script-src", "script-src-elem", "script-src-attr", "style-src", "style-src-elem",
  "style-src-attr", "img-src", "font-src", "connect-src", "media-src", "object-src", "frame-src",
  "child-src", "worker-src", "manifest-src", "prefetch-src", "fenced-frame-src", "form-action",
  "frame-ancestors", "base-uri", "navigate-to", "require-trusted-types-for", "trusted-types",
  "upgrade-insecure-requests", "sandbox", "webrtc",
]);
const KEYWORDS = new Set(["inline", "eval", "wasm-eval", "self", "data", "blob", "trusted-types-policy", "trusted-types-sink"]);

const field = z.string().max(2048);
const disposition = z.enum(["enforce", "report"]);

// Unknown fields (script samples, source files, referrers, the policy text) are dropped by zod.
const LegacyReport = z.object({
  "csp-report": z.object({
    "document-uri": field,
    "violated-directive": field.optional(),
    "effective-directive": field.optional(),
    "blocked-uri": field.optional(),
    disposition: disposition.optional(),
  }),
});
const ReportingApiEntry = z.object({
  type: z.literal("csp-violation"),
  body: z.object({
    documentURL: field,
    effectiveDirective: field,
    blockedURL: field.optional(),
    disposition: disposition.optional(),
  }),
});

export type CspViolation = {
  directive: string;
  blocked: string;
  page: string;
  disposition: "enforce" | "report";
};

export function cspContentType(header: string | null): CspReportContentType | null {
  const type = header?.split(";")[0]?.trim().toLowerCase();
  return CSP_REPORT_CONTENT_TYPES.find((t) => t === type) ?? null;
}

/** The body as UTF-8 text, or null once it exceeds `maxBytes` (the rest is never read). */
export async function readBodyCapped(request: Request, maxBytes = CSP_REPORT_MAX_BYTES): Promise<string | null> {
  if (!request.body) return "";
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > maxBytes) {
      await reader.cancel().catch(() => undefined);
      return null;
    }
    chunks.push(value);
  }
  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
}

/** The directive name only ("script-src 'self'" → "script-src"); null if not a CSP directive. */
function directiveName(raw: string | undefined): string | null {
  const name = raw?.trim().split(/\s+/)[0]?.toLowerCase();
  return name && DIRECTIVES.has(name) ? name : null;
}

/** A CSP keyword, a scheme, or scheme://host for a URL: never its path, query or fragment. */
function blockedSource(raw: string | undefined): string {
  if (!raw) return "none";
  const value = raw.trim().toLowerCase();
  if (KEYWORDS.has(value)) return value;
  try {
    const url = new URL(value);
    if (["https:", "http:", "wss:", "ws:"].includes(url.protocol)) return `${url.protocol}//${url.hostname}`;
    if (url.protocol === "data:" || url.protocol === "blob:") return url.protocol.slice(0, -1);
  } catch {
    /* not a URL */
  }
  return "other";
}

/** The page path without query or fragment; any segment other than a plain word becomes ":id". */
function pagePath(raw: string): string | null {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return null;
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") return null;
  const segments = url.pathname
    .split("/")
    .filter(Boolean)
    .slice(0, 4)
    .map((s) => (s.length <= 40 && /^[a-z]+(?:-[a-z]+)*$/.test(s) ? s : ":id"));
  return `/${segments.join("/")}`;
}

function violation(directiveRaw: string | undefined, blockedRaw: string | undefined, documentUri: string, disp?: "enforce" | "report"): CspViolation | null {
  const directive = directiveName(directiveRaw);
  const page = pagePath(documentUri);
  if (!directive || !page) return null;
  return { directive, blocked: blockedSource(blockedRaw), page, disposition: disp ?? "enforce" };
}

/** The reduced violations in a report body, or null when the body is not a valid CSP report. */
export function parseCspReports(contentType: CspReportContentType, body: string): CspViolation[] | null {
  let json: unknown;
  try {
    json = JSON.parse(body);
  } catch {
    return null;
  }
  const found: CspViolation[] = [];
  if (contentType === "application/csp-report") {
    const parsed = LegacyReport.safeParse(json);
    if (!parsed.success) return null;
    const r = parsed.data["csp-report"];
    const v = violation(r["effective-directive"] ?? r["violated-directive"], r["blocked-uri"], r["document-uri"], r.disposition);
    if (v) found.push(v);
  } else {
    if (!Array.isArray(json) || json.length === 0 || json.length > MAX_REPORTS_PER_REQUEST) return null;
    for (const entry of json) {
      const parsed = ReportingApiEntry.safeParse(entry);
      if (!parsed.success) continue;
      const b = parsed.data.body;
      const v = violation(b.effectiveDirective, b.blockedURL, b.documentURL, b.disposition);
      if (v) found.push(v);
    }
  }
  return found.length > 0 ? found : null;
}

export function logCspViolation(v: CspViolation): void {
  console.warn(JSON.stringify({ event: "csp_violation", ...v }));
}
