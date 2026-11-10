import { describe, expect, it, vi } from "vitest";

import { passwordBreachCount } from "@/lib/password-check";

// SHA-1("password") = 5BAA61E4C9B93F3F0682250B6CF8331B7EE68FD8
const RANGE = ["0018A45C4D1DEF81644B54AB7F969B88D65:0", "1E4C9B93F3F0682250B6CF8331B7EE68FD8:9545824", "011053FD0102E94D6AE2F8B83D76FAF94F6:3"].join("\r\n");

const respond = (body: string, status = 200) => vi.fn(async () => new Response(body, { status }));

describe("leaked-password check (HaveIBeenPwned range API)", () => {
  it("sends only the first five characters of the hash, with padding", async () => {
    const fetchImpl = respond(RANGE);
    await passwordBreachCount("password", fetchImpl as unknown as typeof fetch);
    const [url, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("https://api.pwnedpasswords.com/range/5BAA6");
    expect(new URL(url).pathname).toBe("/range/5BAA6"); // never the password or its full hash
    expect((init.headers as Record<string, string>)["Add-Padding"]).toBe("true");
  });

  it("reports a breached password", async () => {
    await expect(passwordBreachCount("password", respond(RANGE) as unknown as typeof fetch)).resolves.toBe(9545824);
  });

  it("reports 0 for a password not in the range (padding rows count 0)", async () => {
    await expect(
      passwordBreachCount("a-long-unique-passphrase-30-oct", respond(RANGE) as unknown as typeof fetch),
    ).resolves.toBe(0);
  });

  it("returns null (fail open) when the service is down or unreachable", async () => {
    await expect(passwordBreachCount("password", respond("", 503) as unknown as typeof fetch)).resolves.toBeNull();
    const offline = vi.fn(async () => {
      throw new Error("offline");
    });
    await expect(passwordBreachCount("password", offline as unknown as typeof fetch)).resolves.toBeNull();
  });
});
