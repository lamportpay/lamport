import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

import { handlePublicRequest, json } from "@/lib/payments/http.server";

const SignInInput = z
  .object({
    message: z.string().min(1).max(1000),
    /** Base64 Ed25519 signature of `message` by the wallet. */
    signature: z.string().min(80).max(120),
  })
  .strict();

/**
 * POST /api/wallet/sign-in — sign in with a Solana wallet. The wallet signs one
 * plain-text message (never a transaction); the server verifies it and returns
 * a one-time token the browser exchanges for a session.
 */
export const Route = createFileRoute("/api/wallet/sign-in")({
  server: {
    handlers: {
      POST: ({ request }) =>
        handlePublicRequest(request, SignInInput, "wallet-sign-in", 10, async (_user, body) => {
          const { walletSignIn, WalletSignInError } = await import(
            "@/lib/identity/wallet-session.server"
          );
          try {
            const result = await walletSignIn({
              message: body.message,
              signature: body.signature,
              requestOrigin: request.headers.get("origin"),
              requestHosts: [
                new URL(request.url).host,
                request.headers.get("x-forwarded-host"),
                request.headers.get("host"),
              ],
            });
            return json(result);
          } catch (error) {
            if (error instanceof WalletSignInError) {
              return json({ error: error.message }, error.status);
            }
            throw error;
          }
        }),
    },
  },
});
