/**
 * Browser copy of the user's payment history (localStorage). The server stays
 * authoritative; this copy lets History show while offline and remembers the
 * step a payment stopped at so the user can continue later.
 */
import type { PaymentListItem } from "./view";

const KEY = "lamportpay.history.v1";
const MAX = 100;

export type LocalHistoryItem = PaymentListItem & {
  failureReason?: string | null;
  lastStep?: string | null;
  savedAt: string;
};

function read(): LocalHistoryItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown) : [];
    return Array.isArray(parsed) ? (parsed as LocalHistoryItem[]) : [];
  } catch {
    return [];
  }
}

function write(items: LocalHistoryItem[]) {
  try {
    const sorted = [...items].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, MAX);
    window.localStorage.setItem(KEY, JSON.stringify(sorted));
  } catch {
    /* storage full or blocked: history still comes from the server */
  }
}

export function loadLocalHistory(): LocalHistoryItem[] {
  return read();
}

/** Upsert one payment, keeping fields the incoming copy lacks. */
export function saveLocalPayment(item: Omit<LocalHistoryItem, "savedAt">) {
  const items = read();
  const i = items.findIndex((p) => p.id === item.id);
  const next: LocalHistoryItem = {
    ...(i >= 0 ? items[i] : {}),
    ...item,
    failureReason: item.failureReason ?? (i >= 0 ? items[i]!.failureReason : null),
    lastStep: item.lastStep ?? (i >= 0 ? items[i]!.lastStep : null),
    savedAt: new Date().toISOString(),
  } as LocalHistoryItem;
  if (i >= 0) items[i] = next;
  else items.push(next);
  write(items);
}

/** Merge the server list into the browser copy and return the combined list. */
export function mergeServerHistory(server: PaymentListItem[]): LocalHistoryItem[] {
  for (const p of server) saveLocalPayment(p);
  return read();
}
