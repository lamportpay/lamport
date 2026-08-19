/**
 * Bridge API configuration and server-side helpers.
 *
 * All secrets are read inside handler bodies. Never expose Bridge keys
 * or webhook secrets to the browser.
 */

export const BRIDGE_API_URL = "https://api.bridge.xyz";

export interface BridgeConfig {
  apiKey: string | undefined;
  webhookSecret: string | undefined;
  apiUrl: string;
  enabled: boolean;
}

export function getBridgeConfig(): BridgeConfig {
  const apiKey = process.env["BRIDGE_API_KEY"];
  const webhookSecret = process.env["BRIDGE_WEBHOOK_SECRET"];
  const apiUrl = process.env["BRIDGE_API_URL"] || BRIDGE_API_URL;
  return {
    apiKey,
    webhookSecret,
    apiUrl,
    enabled: Boolean(apiKey && apiKey.startsWith("api_")),
  };
}

export function bridgeHeaders(config: BridgeConfig, idempotencyKey?: string) {
  const headers: Record<string, string> = {
    "Api-Key": config.apiKey || "",
    "Content-Type": "application/json",
    Accept: "application/json",
  };
  if (idempotencyKey) {
    headers["Idempotency-Key"] = idempotencyKey;
  }
  return headers;
}

export function bridgeError(status: number, body: string) {
  return { error: `Bridge API request failed (${status}).`, raw: body };
}
