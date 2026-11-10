/**
 * Sends an operations alert to the team's channel.
 *
 * Channel: OPS_ALERT_WEBHOOK_URL, an https incoming-webhook URL (a Slack
 * incoming webhook takes `{ "text": ... }` as sent here; OPS_ALERT_WEBHOOK_FORMAT=json
 * adds the structured alert for any other receiver). The URL is a credential:
 * it is never logged. Every alert is also written to the server log as one
 * `ops_alert` JSON line, so it is searchable even with no channel set.
 */

const TIMEOUT_MS = 5_000;

export type AlertDelivery = "sent" | "failed" | "no_channel";

export type AlertMessage = {
  text: string;
  /** Logged and, with the json format, sent. IDs, counts and reasons only. */
  fields: Record<string, unknown>;
};

type Env = Record<string, string | undefined>;

/** The configured channel URL, or null. Only https is accepted. */
export function alertChannelUrl(env: Env = process.env): string | null {
  const raw = env["OPS_ALERT_WEBHOOK_URL"]?.trim();
  if (!raw) return null;
  try {
    const url = new URL(raw);
    return url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

/** True when OPS_ALERT_WEBHOOK_URL is set but unusable (not https, not a URL). */
export function alertChannelMisconfigured(env: Env = process.env): boolean {
  return Boolean(env["OPS_ALERT_WEBHOOK_URL"]?.trim()) && alertChannelUrl(env) === null;
}

export async function sendOpsAlert(
  message: AlertMessage,
  env: Env = process.env,
  fetchImpl: typeof fetch = fetch,
): Promise<AlertDelivery> {
  const url = alertChannelUrl(env);
  let delivery: AlertDelivery = "no_channel";
  if (url) {
    const body =
      env["OPS_ALERT_WEBHOOK_FORMAT"]?.trim().toLowerCase() === "json"
        ? { text: message.text, ...message.fields }
        : { text: message.text };
    try {
      const response = await fetchImpl(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(TIMEOUT_MS),
        redirect: "error",
      });
      delivery = response.ok ? "sent" : "failed";
      if (!response.ok) console.error(`[ops-alert] channel answered ${response.status}`);
    } catch (error) {
      delivery = "failed";
      console.error(
        "[ops-alert] channel unreachable:",
        error instanceof Error ? error.name : "unknown error",
      );
    }
  } else if (alertChannelMisconfigured(env)) {
    console.error("[ops-alert] OPS_ALERT_WEBHOOK_URL is set but is not an https URL");
  }
  const log = delivery === "sent" ? console.info : console.warn;
  log(JSON.stringify({ event: "ops_alert", delivery, ...message.fields }));
  return delivery;
}
