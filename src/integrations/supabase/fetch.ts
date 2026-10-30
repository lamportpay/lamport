// Shared fetch for every Supabase client (browser, server admin, auth middleware).

function isNewSupabaseApiKey(value: string): boolean {
  return value.startsWith('sb_publishable_') || value.startsWith('sb_secret_');
}

// PostgREST answers 401 PGRST303 ("JWT issued at future") when the token the Supabase
// gateway mints for an sb_ key is stamped a moment ahead of PostgREST's clock. Seen on
// the dev project on 30 Oct 2026: of two parallel requests with the same valid key, one
// was refused. The request is refused before anything runs, so one delayed retry is safe.
const CLOCK_SKEW_RETRY_MS = 1000;

async function isJwtIssuedAtFuture(res: Response): Promise<boolean> {
  if (res.status !== 401) return false;
  // Server side the gateway's Proxy-Status header says it; browsers don't see that header.
  if ((res.headers.get('proxy-status') ?? '').includes('PGRST303')) return true;
  try {
    return (await res.clone().text()).includes('"PGRST303"');
  } catch {
    return false;
  }
}

/** A body that can be sent a second time unchanged (supabase-js sends strings). */
function isReplayable(input: RequestInfo | URL, init?: RequestInit): boolean {
  if (typeof Request !== 'undefined' && input instanceof Request && input.body !== null) return false;
  return init?.body == null || typeof init.body === 'string';
}

export function createSupabaseFetch(
  supabaseKey: string,
  { retryDelayMs = CLOCK_SKEW_RETRY_MS }: { retryDelayMs?: number } = {},
): typeof fetch {
  return async (input, init) => {
    const headers = new Headers(
      typeof Request !== 'undefined' && input instanceof Request ? input.headers : undefined,
    );

    if (init?.headers) {
      new Headers(init.headers).forEach((value, key) => headers.set(key, value));
    }

    // New Supabase API keys are opaque strings, not bearer JWTs.
    if (isNewSupabaseApiKey(supabaseKey) && headers.get('Authorization') === `Bearer ${supabaseKey}`) {
      headers.delete('Authorization');
    }

    headers.set('apikey', supabaseKey);
    const res = await fetch(input, { ...init, headers });
    if (!isReplayable(input, init) || !(await isJwtIssuedAtFuture(res))) return res;

    await new Promise((resolve) => setTimeout(resolve, retryDelayMs));
    return fetch(input, { ...init, headers });
  };
}
