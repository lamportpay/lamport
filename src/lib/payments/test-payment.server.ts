/**
 * TEST MODE "Pay Now" (owner decisions 3 Oct and 5 Nov 2026).
 *
 * The Stables sandbox gives no real deposit address, so a real devnet USDC
 * deposit to Stables is impossible; the sandbox simulates that deposit. What IS
 * real on devnet since 5 Nov: LamportPay's own fee. The server builds one devnet
 * transaction (`prepareTestPaymentTransaction`) holding:
 *
 *   - a Memo-program instruction "LamportPay TEST payment <payment id>", signed
 *     by the user's wallet (ties the transaction to this payment), and
 *   - when the payment carries a fee, a transfer of exactly that fee in devnet
 *     test USDC from the user's wallet to the configured revenue wallet — the
 *     same split the LIVE funding transaction makes on mainnet.
 *
 * The user's wallet signs and sends it. The server then reads it from devnet
 * (`confirmTestPayment`) and checks:
 *
 *   - the server is in TEST MODE (refused otherwise — LIVE uses real funding);
 *   - the payment is the caller's own, has a sandbox transfer, and waits for funds;
 *   - the transaction succeeded, carries exactly this payment's memo, and is
 *     signed by the caller's wallet (linked wallet, or the wallet the payment
 *     was planned with for email accounts);
 *   - it is newer than the transfer and has never been used for another payment.
 *
 * It records what the revenue wallet actually received in that transaction
 * (token balances before/after, never the amount the page calculated) once, as
 * network "solana-devnet" — test evidence, never counted as revenue. Only then
 * is the deposit simulated in the Stables sandbox. Stables' webhooks and the
 * reconciliation job drive the payment to COMPLETED; nothing here marks it
 * complete. Never a fake success: a missing or wrong transaction is refused.
 */
import { MODE_PROFILES } from "@/lib/app-mode";
import { currentMode, requireModeProfile } from "@/lib/app-mode.server";
import { toMajor } from "@/lib/money";
import { isLikelySignature } from "@/lib/solana-rpc";
import { readWalletHoldings } from "@/lib/solana-balances.server";
import { rpc } from "@/lib/solana-rpc.server";
import {
  buildTestPaymentTransaction,
  isValidPublicKey,
  tokenDelta,
  type TokenBalance,
} from "@/lib/solana-usdc.server";
import type { AuthenticatedUser } from "./auth.server";
import { PaymentError } from "./errors";
import { appendFeeLedger, receivedFeeEntry } from "./fee-ledger.server";
import * as ledger from "./ledger.server";
import {
  assertPaymentsOpen,
  FUNDABLE,
  latestSettlement,
  ownedPayment,
  platformFeeOf,
  simulateSandboxDeposit,
  viewOf,
} from "./service.server";
import type { PaymentView } from "./view";

import { MEMO_PROGRAM_ID, testPaymentMemo } from "./test-payment";

export { MEMO_PROGRAM_ID, testPaymentMemo };

/** Network marker of every TEST MODE fee receipt (never revenue). */
const TEST_FEE_NETWORK = "solana-devnet" as const;
/** Both payment coins use 6 decimals (devnet USDC included). */
const COIN_DECIMALS = 6;

type ParsedInstruction = {
  programId?: string;
  program?: string;
  parsed?: unknown;
};

type ParsedTransaction = {
  blockTime: number | null;
  meta: {
    err: unknown;
    preTokenBalances?: TokenBalance[];
    postTokenBalances?: TokenBalance[];
  } | null;
  transaction: {
    message: {
      accountKeys: Array<{ pubkey: string; signer: boolean }>;
      instructions: ParsedInstruction[];
    };
  };
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function requireTestMode() {
  const status = currentMode();
  const profile = requireModeProfile(status);
  if (status.mode !== "test" || profile.realFunds) {
    throw new PaymentError(
      "This is the devnet / sandbox payment check; LIVE payments use the real deposit.",
      409,
      "test_mode_only",
    );
  }
}

/** Wallets the caller may pay from: their linked wallet(s), else the planned wallet. */
async function allowedPayers(user: AuthenticatedUser, paymentId: string): Promise<string[]> {
  if (user.wallets && user.wallets.length > 0) return user.wallets;
  const planned = (await latestSettlement(paymentId))?.wallet;
  return planned ? [planned] : [];
}

function coinOf(currency: string): "usdc" | "usdt" {
  return currency === "usdt" ? "usdt" : "usdc";
}

/**
 * What the revenue wallet received in a transaction, counting only what left
 * the payer's own wallet (a third party topping up the revenue wallet in the
 * same transaction never counts as this payment's fee). Pure.
 */
export function feePaidBy(
  meta: { preTokenBalances?: TokenBalance[]; postTokenBalances?: TokenBalance[] } | null,
  mint: string,
  payer: string,
  revenueWallet: string,
): bigint {
  if (payer === revenueWallet) return 0n;
  const toRevenue = tokenDelta(
    meta?.preTokenBalances,
    meta?.postTokenBalances,
    mint,
    revenueWallet,
  );
  const fromPayer = -tokenDelta(meta?.preTokenBalances, meta?.postTokenBalances, mint, payer);
  const paid = toRevenue < fromPayer ? toRevenue : fromPayer;
  return paid > 0n ? paid : 0n;
}

/**
 * The unsigned devnet "Pay Now" transaction for this payment: the memo plus the
 * LamportPay fee in devnet test USDC to the revenue wallet. Built by the server
 * so the amount and the recipient never come from the browser.
 */
export async function prepareTestPaymentTransaction(
  user: AuthenticatedUser,
  paymentId: string,
  payer: string,
) {
  requireTestMode();
  if (!isValidPublicKey(payer)) throw new PaymentError("Invalid wallet address.", 400);
  const payment = await ownedPayment(user, paymentId);
  await assertPaymentsOpen(null, { globalOnly: true, paymentId: payment.id });
  const events = await ledger.listPaymentEvents(payment.id);
  if (events.some((e) => e.kind === "test_payment_detected")) {
    throw new PaymentError(
      "This payment has already been paid. Nothing more needs to be signed.",
      409,
      "already_paid",
    );
  }
  if (!payment.transfer_id || !FUNDABLE.includes(ledger.paymentState(payment))) {
    throw new PaymentError(
      `This payment is not waiting for a payment (it is ${payment.status}).`,
      409,
    );
  }
  if (!(await allowedPayers(user, payment.id)).includes(payer)) {
    throw new PaymentError("Pay from the wallet linked to your account.", 403, "wrong_wallet");
  }
  const fee = platformFeeOf(payment);
  if (fee.wallet && fee.wallet === payer) {
    throw new PaymentError(
      "This wallet is LamportPay's revenue wallet, so it cannot pay a LamportPay fee. Pay from a different wallet.",
      409,
      "revenue_wallet_payer",
    );
  }
  const coin = coinOf(payment.source_currency);
  const mint = MODE_PROFILES.test.mints[coin];
  if (fee.minor > 0n && !mint) {
    throw new PaymentError(`Devnet has no test ${coin.toUpperCase()}.`, 409, "currency_disabled");
  }
  let built: { transaction: string; lastValidBlockHeight: number };
  try {
    built = await buildTestPaymentTransaction({
      payer,
      memo: testPaymentMemo(payment.id),
      mint: mint ?? "",
      decimals: COIN_DECIMALS,
      fee: fee.wallet && fee.minor > 0n ? { recipient: fee.wallet, amountMinor: fee.minor } : null,
    });
  } catch (e) {
    console.error("[test-payment] build:", e instanceof Error ? e.message : e);
    throw new PaymentError(
      "We couldn't reach Solana devnet to prepare the transaction. Try again shortly.",
      503,
      "rpc_unavailable",
    );
  }
  await ledger.recordEvent(payment.id, "test_payment_transaction_built", "api", {
    detail: { payer, platform_fee_minor: fee.minor.toString(), cluster: "devnet" },
  });
  return {
    ...built,
    cluster: "devnet" as const,
    currency: coin,
    platformFee: toMajor(fee.minor, coin),
  };
}

export async function confirmTestPayment(
  user: AuthenticatedUser,
  paymentId: string,
  signature: string,
): Promise<PaymentView> {
  requireTestMode();
  if (!isLikelySignature(signature)) {
    throw new PaymentError("Invalid transaction signature.", 400, "invalid_signature");
  }

  const payment = await ownedPayment(user, paymentId);
  await assertPaymentsOpen(null, { globalOnly: true, paymentId: payment.id });
  const events = await ledger.listPaymentEvents(payment.id);
  const detected = events.find((e) => e.kind === "test_payment_detected");
  if (detected) {
    // Duplicate protection: one payment transaction per payment.
    const prior = isRecord(detected.detail) ? detected.detail["signature"] : null;
    if (prior === signature) return viewOf(payment);
    throw new PaymentError(
      "This payment has already been paid. Nothing more needs to be signed.",
      409,
      "already_paid",
    );
  }
  if (!payment.transfer_id || !FUNDABLE.includes(ledger.paymentState(payment))) {
    throw new PaymentError(
      `This payment is not waiting for a payment (it is ${payment.status}).`,
      409,
    );
  }
  if (await ledger.getPaymentEventBySignature("test_payment_detected", signature)) {
    throw new PaymentError(
      "This transaction was already used for another payment.",
      409,
      "signature_reused",
    );
  }

  const cluster = MODE_PROFILES.test.solanaCluster;
  const read = await rpc<ParsedTransaction | null>(cluster, "getTransaction", [
    signature,
    { encoding: "jsonParsed", commitment: "confirmed", maxSupportedTransactionVersion: 0 },
  ]);
  if (!read.ok) {
    throw new PaymentError(
      "We couldn't reach Solana devnet to check the transaction. Try again shortly.",
      503,
      "rpc_unavailable",
    );
  }
  const tx = read.result;
  if (!tx) {
    throw new PaymentError(
      "The transaction isn't confirmed on devnet yet. Try again in a few seconds.",
      409,
      "not_confirmed",
    );
  }
  if (tx.meta?.err) {
    throw new PaymentError("The transaction failed on devnet.", 422, "transaction_failed");
  }

  const keys = tx.transaction?.message?.accountKeys ?? [];
  const signers = keys.filter((k) => k.signer).map((k) => k.pubkey);
  const payers = await allowedPayers(user, payment.id);
  const wallet = signers.find((s) => payers.includes(s));
  if (!wallet) {
    throw new PaymentError("The transaction wasn't signed by your wallet.", 403, "wrong_wallet");
  }

  const expected = testPaymentMemo(payment.id);
  const memos = (tx.transaction?.message?.instructions ?? [])
    .filter((ix) => ix.programId === MEMO_PROGRAM_ID || ix.program === "spl-memo")
    .map((ix) => (typeof ix.parsed === "string" ? ix.parsed : null));
  if (!memos.includes(expected)) {
    throw new PaymentError("The transaction doesn't belong to this payment.", 422, "memo_mismatch");
  }

  const transferEvent = events.find((e) => e.to_status && e.from_status === "QUOTED");
  const transferAt = transferEvent ? Date.parse(transferEvent.created_at) : 0;
  if (tx.blockTime !== null && transferAt && tx.blockTime * 1000 < transferAt - 120_000) {
    throw new PaymentError(
      "This transaction is older than the payment's transfer.",
      422,
      "stale_transaction",
    );
  }

  // The LamportPay fee leg: what the revenue wallet actually received in this
  // transaction (token balances before and after), never what the page computed.
  const coin = coinOf(payment.source_currency);
  const mint = MODE_PROFILES.test.mints[coin];
  const fee = platformFeeOf(payment);
  const feeReceived = fee.wallet && mint ? feePaidBy(tx.meta, mint, wallet, fee.wallet) : 0n;

  // Realistic TEST: after paying the fee, the wallet must still hold the devnet
  // USDC for the deposit itself, as LIVE would require for the whole total.
  const view = await viewOf(payment);
  const needed = BigInt(view.totalToPay.amountMinor) - feeReceived;
  const holdings = await readWalletHoldings(wallet);
  if (holdings.status !== "ok") {
    throw new PaymentError(
      "We couldn't read your devnet balance. Try again shortly.",
      503,
      "balance_unavailable",
    );
  }
  if ((holdings.tokens[coin] ?? 0n) < needed) {
    throw new PaymentError(
      `Your wallet doesn't hold the ${view.totalToPay.amount} ${coin.toUpperCase()} this payment needs (devnet test ${coin.toUpperCase()}).`,
      409,
      "insufficient_funds",
    );
  }

  if (fee.wallet) {
    const receipt = await ledger.recordFeeReceipt(payment.id, {
      receivedMinor: feeReceived,
      network: TEST_FEE_NETWORK,
      signature,
      receivedAt: new Date().toISOString(),
    });
    if (receipt === "signature_taken") {
      throw new PaymentError(
        "This transaction was already used for another payment.",
        409,
        "signature_reused",
      );
    }
  }

  // The wallet that signed, for the admin revenue view (TEST never sets funding).
  await ledger.setPayerWallet(payment.id, wallet);
  await ledger.recordEvent(payment.id, "test_payment_detected", "api", {
    detail: {
      signature,
      wallet,
      cluster,
      memo: expected,
      block_time: tx.blockTime,
      moved_funds: feeReceived > 0n,
      ...(fee.wallet && {
        platform_fee_expected_minor: fee.minor.toString(),
        platform_fee_received_minor: feeReceived.toString(),
        platform_fee_network: TEST_FEE_NETWORK,
      }),
    },
  });
  if (fee.wallet) {
    await appendFeeLedger([
      receivedFeeEntry(payment.id, feeReceived, coin, signature, TEST_FEE_NETWORK),
    ]);
    if (feeReceived !== fee.minor) {
      console.error(`[test-payment] ${payment.id}: devnet fee ${feeReceived}/${fee.minor}`);
      await ledger.recordEvent(payment.id, "platform_fee_mismatch", "api", {
        detail: {
          signature,
          network: TEST_FEE_NETWORK,
          expected_minor: fee.minor.toString(),
          received_minor: feeReceived.toString(),
        },
      });
    }
  }
  // The sandbox deposit for this transfer (idempotent per transfer).
  await simulateSandboxDeposit(payment.id, { id: user.id, role: "test_payment" });
  return viewOf((await ledger.getPayment(payment.id)) ?? payment);
}
