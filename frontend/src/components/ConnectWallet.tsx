"use client";

import { useWeb3 } from "@/contexts/Web3Context";
import { shortenAddress } from "@/utils/web3";

export default function ConnectWallet() {
  const { account, chainId, isConnecting, error, connect, disconnect } =
    useWeb3();

  if (!account) {
    return (
      <div className="flex flex-col items-center gap-2">
        <button
          type="button"
          onClick={() => void connect()}
          disabled={isConnecting}
          className="rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background transition-colors hover:bg-[#383838] disabled:cursor-not-allowed disabled:opacity-60 dark:hover:bg-[#ccc]"
        >
          {isConnecting ? "Connecting..." : "Connect Wallet"}
        </button>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex items-center gap-3 rounded-full border border-black/[.08] px-5 py-2.5 text-sm dark:border-white/[.145]">
        <span className="font-mono">{shortenAddress(account)}</span>
        {chainId !== null ? (
          <span className="text-zinc-500">chain {chainId}</span>
        ) : null}
      </div>
      <button
        type="button"
        onClick={disconnect}
        className="text-sm text-zinc-600 underline underline-offset-4 dark:text-zinc-400"
      >
        Disconnect
      </button>
    </div>
  );
}
