import { generateKeyPairSync, sign } from "node:crypto";

import { PublicKey } from "@solana/web3.js";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { buildWalletSignInMessage } from "@/lib/identity/wallet-message";

// A chainable stand-in for supabase-js table calls: every builder method returns
// itself, and awaiting it (or maybeSingle) answers with the canned result.
const tableResult: Record<string, { data: unknown; error: unknown }> = {};
function table(name: string) {
  const result = () => tableResult[name] ?? { data: null, error: null };
  const chain: Record<string, unknown> = {};
  for (const m of ["select", "eq", "update", "insert"]) chain[m] = () => chain;
  chain["maybeSingle"] = async () => result();
  chain["then"] = (resolve: (v: unknown) => unknown) => resolve(result());
  return chain;
}

const admin = {
  getUserById: vi.fn(),
  updateUserById: vi.fn(),
  createUser: vi.fn(),
  generateLink: vi.fn(),
};

vi.mock("@/integrations/supabase/client.server", () => ({
  supabaseAdmin: { from: (name: string) => table(name), auth: { admin } },
}));
vi.mock("@/lib/payments/rate-limit.server", () => ({ allowShared: async () => true }));

function wallet() {
  const { publicKey, privateKey } = generateKeyPairSync("ed25519");
  const raw = Buffer.from(publicKey.export({ format: "jwk" }).x!, "base64url");
  return { address: new PublicKey(raw).toBase58(), raw, privateKey };
}

function signedRequest(w: ReturnType<typeof wallet>) {
  const message = buildWalletSignInMessage({
    host: "localhost:8080",
    origin: "http://localhost:8080",
    address: w.address,
    issuedAt: new Date().toISOString(),
  });
  const signature = sign(null, Buffer.from(message), w.privateKey).toString("base64");
  return { message, signature };
}

beforeEach(() => {
  vi.resetAllMocks();
  for (const k of Object.keys(tableResult)) delete tableResult[k];
  admin.generateLink.mockResolvedValue({
    data: { properties: { hashed_token: "token-hash" } },
    error: null,
  });
  admin.updateUserById.mockResolvedValue({ data: {}, error: null });
});

describe("wallet sign-in for accounts without an email (5 Nov 2026)", () => {
  it("gives an old wallet-provider account its placeholder email and signs it in", async () => {
    const w = wallet();
    tableResult["user_wallets"] = { data: { user_id: "user-1" }, error: null };
    admin.getUserById.mockResolvedValue({
      data: { user: { id: "user-1", email: "", app_metadata: { provider: "web3" } } },
      error: null,
    });
    const { walletSignIn } = await import("@/lib/identity/wallet-session.server");

    const result = await walletSignIn(signedRequest(w));

    const placeholder = `${w.raw.toString("hex")}@wallet.lamportpay.com`;
    expect(admin.updateUserById).toHaveBeenCalledWith("user-1", {
      email: placeholder,
      email_confirm: true,
      app_metadata: { provider: "web3", wallet_solana: w.address },
    });
    expect(admin.generateLink).toHaveBeenCalledWith({ type: "magiclink", email: placeholder });
    expect(result).toEqual({ tokenHash: "token-hash", address: w.address });
    expect(admin.createUser).not.toHaveBeenCalled();
  });

  it("keeps an existing email and never replaces it", async () => {
    const w = wallet();
    tableResult["user_wallets"] = { data: { user_id: "user-2" }, error: null };
    admin.getUserById.mockResolvedValue({
      data: {
        user: {
          id: "user-2",
          email: "owner@example.com",
          app_metadata: { wallet_solana: w.address },
        },
      },
      error: null,
    });
    const { walletSignIn } = await import("@/lib/identity/wallet-session.server");

    await walletSignIn(signedRequest(w));

    expect(admin.updateUserById).not.toHaveBeenCalled();
    expect(admin.generateLink).toHaveBeenCalledWith({
      type: "magiclink",
      email: "owner@example.com",
    });
  });

  it("refuses cleanly when the email cannot be set", async () => {
    const w = wallet();
    tableResult["user_wallets"] = { data: { user_id: "user-3" }, error: null };
    admin.getUserById.mockResolvedValue({
      data: { user: { id: "user-3", email: null, app_metadata: {} } },
      error: null,
    });
    admin.updateUserById.mockResolvedValue({ data: null, error: { message: "email exists" } });
    const { walletSignIn } = await import("@/lib/identity/wallet-session.server");

    await expect(walletSignIn(signedRequest(w))).rejects.toMatchObject({ status: 503 });
    expect(admin.generateLink).not.toHaveBeenCalled();
  });
});
