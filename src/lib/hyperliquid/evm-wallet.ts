/**
 * The customer's own EVM wallet (MetaMask, Rabby, Phantom …) for the
 * Hyperliquid TESTNET panel, via the injected EIP-1193 provider. Used to read
 * the address and to sign the one-time trading-key approval; it never gives
 * LamportPay a key.
 */
type Eip1193 = {
  request(args: { method: string; params?: unknown[] }): Promise<unknown>;
  on?(event: string, listener: (...args: unknown[]) => void): void;
  removeListener?(event: string, listener: (...args: unknown[]) => void): void;
};

export function evmProvider(): Eip1193 | null {
  if (typeof window === "undefined") return null;
  const eth = (window as unknown as { ethereum?: Eip1193 }).ethereum;
  return eth && typeof eth.request === "function" ? eth : null;
}

export class EvmWalletError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "EvmWalletError";
  }
}

function friendly(e: unknown, fallback: string): EvmWalletError {
  const code = (e as { code?: unknown })?.code;
  if (code === 4001) return new EvmWalletError("You cancelled the request in your wallet.");
  if (code === -32002)
    return new EvmWalletError("Your wallet already has a request open. Check it.");
  const msg = (e as { message?: unknown })?.message;
  return new EvmWalletError(typeof msg === "string" && msg ? msg.slice(0, 200) : fallback);
}

function need(): Eip1193 {
  const p = evmProvider();
  if (!p) throw new EvmWalletError("No EVM wallet found. Install MetaMask or Rabby and reload.");
  return p;
}

/** Ask the wallet for its account; lower-case 0x address. */
export async function connectEvmWallet(): Promise<string> {
  try {
    const accounts = (await need().request({ method: "eth_requestAccounts" })) as string[];
    if (!accounts?.[0]) throw new EvmWalletError("The wallet returned no account.");
    return accounts[0].toLowerCase();
  } catch (e) {
    throw e instanceof EvmWalletError ? e : friendly(e, "Could not connect the wallet.");
  }
}

/** The connected account without prompting, or null. */
export async function currentEvmAccount(): Promise<string | null> {
  const p = evmProvider();
  if (!p) return null;
  try {
    const accounts = (await p.request({ method: "eth_accounts" })) as string[];
    return accounts?.[0]?.toLowerCase() ?? null;
  } catch {
    return null;
  }
}

/** The wallet's current chain id, hex ("0x1"). Hyperliquid accepts any chain for this signature. */
export async function evmChainId(): Promise<string> {
  try {
    const id = (await need().request({ method: "eth_chainId" })) as string;
    if (typeof id !== "string" || !/^0x[0-9a-fA-F]+$/.test(id)) throw new Error("bad chain id");
    return `0x${id
      .slice(2)
      .toLowerCase()
      .replace(/^0+(?=.)/, "")}`;
  } catch (e) {
    throw friendly(e, "Could not read the wallet network.");
  }
}

/** eth_signTypedData_v4 in the customer's wallet; returns the 65-byte signature hex. */
export async function signTypedData(account: string, typedData: unknown): Promise<string> {
  try {
    const sig = await need().request({
      method: "eth_signTypedData_v4",
      params: [account, JSON.stringify(typedData)],
    });
    if (typeof sig !== "string") throw new Error("no signature");
    return sig;
  } catch (e) {
    throw friendly(e, "The wallet did not sign.");
  }
}

/** Call `onChange` when the wallet switches account; returns an unsubscribe. */
export function onEvmAccountChange(onChange: (account: string | null) => void): () => void {
  const p = evmProvider();
  if (!p?.on) return () => {};
  const listener = (...args: unknown[]) => {
    const accounts = args[0] as string[] | undefined;
    onChange(accounts?.[0]?.toLowerCase() ?? null);
  };
  p.on("accountsChanged", listener);
  return () => p.removeListener?.("accountsChanged", listener);
}
