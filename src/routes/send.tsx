import { createFileRoute, redirect } from "@tanstack/react-router";

/**
 * /send was a sandbox wizard with invented quotes, KYC and transaction hashes.
 * Real payments live at /pay; this route only keeps old links working.
 */
export const Route = createFileRoute("/send")({
  beforeLoad: () => {
    throw redirect({ to: "/pay" });
  },
});
