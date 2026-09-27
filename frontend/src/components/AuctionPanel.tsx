"use client";

import { useMemo, useState } from "react";
import { parseEther, type ContractTransactionResponse } from "ethers";
import { useAuction } from "@/hooks/useAuction";
import { useNow } from "@/hooks/useNow";
import { ENGLISH_AUCTION_ADDRESS, formatEth, shortenAddress } from "@/utils/web3";
import ConnectWallet from "./ConnectWallet";
import Countdown from "./Countdown";

type Status = "not-started" | "live" | "ended";

function StatusBadge({ status }: { status: Status }) {
  const styles: Record<Status, string> = {
    "not-started": "bg-amber-500/10 text-amber-700 dark:text-amber-400",
    live: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
    ended: "bg-zinc-500/10 text-zinc-600 dark:text-zinc-400",
  };
  const labels: Record<Status, string> = {
    "not-started": "Not started",
    live: "Live",
    ended: "Ended",
  };

  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-medium ${styles[status]}`}
    >
      {labels[status]}
    </span>
  );
}

function Stat({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-black/[.06] bg-white/60 p-4 dark:border-white/[.1] dark:bg-white/[.03]">
      <p className="text-xs uppercase tracking-wide text-zinc-500">{label}</p>
      <div className="mt-1 font-mono text-sm">{children}</div>
    </div>
  );
}

export default function AuctionPanel() {
  const {
    auction,
    signer,
    account,
    state,
    bids,
    isLoading,
    error,
    isSeller,
    isHighestBidder,
    refresh,
  } = useAuction();

  const [bidAmount, setBidAmount] = useState("");
  const [pending, setPending] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const now = useNow();
  const status: Status = !state
    ? "not-started"
    : state.ended
      ? "ended"
      : state.started
        ? "live"
        : "not-started";

  const parsedBid = useMemo(() => {
    const trimmed = bidAmount.trim();
    if (!/^\d*\.?\d*$/.test(trimmed) || trimmed === "") return null;
    try {
      return parseEther(trimmed);
    } catch {
      return null;
    }
  }, [bidAmount]);

  const bidTooLow =
    parsedBid !== null && state !== null && parsedBid <= state.highestBid;

  const canBid =
    !!signer &&
    state?.started === true &&
    state.ended === false &&
    parsedBid !== null &&
    !bidTooLow &&
    !isHighestBidder;

  const canEnd =
    !!signer &&
    state?.started === true &&
    state.ended === false &&
    state.endAt > 0 &&
    now >= state.endAt;

  const canWithdraw = !!signer && state !== null && state.myBalance > 0n;

  async function run(
    label: string,
    action: () => Promise<ContractTransactionResponse>,
  ) {
    setPending(label);
    setActionError(null);
    try {
      const tx = await action();
      await tx.wait();
      await refresh();
    } catch (cause) {
      setActionError(
        cause instanceof Error ? cause.message : "Transaction failed.",
      );
    } finally {
      setPending(null);
    }
  }

  return (
    <div className="flex w-full flex-col gap-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">English Auction</h1>
          <p className="text-sm text-zinc-500">
            Anvil · {shortenAddress(ENGLISH_AUCTION_ADDRESS, 6)}
          </p>
        </div>
        <ConnectWallet />
      </header>

      {isLoading ? (
        <p className="text-sm text-zinc-500">Loading auction state…</p>
      ) : error ? (
        <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-4 text-sm text-red-700 dark:text-red-400">
          <p className="font-medium">Cannot reach the auction contract.</p>
          <p className="mt-1 font-mono text-xs opacity-80">{error}</p>
          <p className="mt-2 text-xs opacity-80">
            Start a node with <code>make anvil</code> and deploy with{" "}
            <code>make deploy</code>, then reload.
          </p>
        </div>
      ) : !state ? null : (
        <>
          <section className="flex flex-col gap-4 rounded-2xl border border-black/[.06] p-6 dark:border-white/[.1]">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <StatusBadge status={status} />
              <button
                type="button"
                onClick={() => void refresh()}
                disabled={pending !== null}
                className="text-xs text-zinc-500 underline underline-offset-4 disabled:opacity-50"
              >
                Refresh
              </button>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Stat label="Highest bid">
                {formatEth(state.highestBid)} ETH
              </Stat>
              <Stat label="Highest bidder">
                {state.highestBidder === "0x0000000000000000000000000000000000000000"
                  ? "—"
                  : shortenAddress(state.highestBidder)}
              </Stat>
              <Stat label="Ends in">
                {state.started ? <Countdown now={now} target={state.endAt} /> : "—"}
              </Stat>
              <Stat label="Seller">
                {isSeller ? "You" : shortenAddress(state.seller)}
              </Stat>
            </div>

            <p className="text-xs text-zinc-500">
              NFT {state.nftId.toString()} · {shortenAddress(state.nft, 6)} · ends{" "}
              {state.started
                ? new Date(state.endAt * 1000).toLocaleString()
                : "once started"}
            </p>

            {actionError ? (
              <p className="rounded-lg bg-red-500/10 p-3 font-mono text-xs text-red-700 dark:text-red-400">
                {actionError}
              </p>
            ) : null}

            <div className="flex flex-col gap-3 border-t border-black/[.06] pt-5 dark:border-white/[.1]">
              {!account ? (
                <p className="text-sm text-zinc-500">
                  Connect your wallet to start, bid or end the auction.
                </p>
              ) : (
                <>
                  {state.started && !state.ended ? (
                    <div className="flex flex-wrap items-end gap-3">
                      <label className="flex flex-col gap-1 text-xs text-zinc-500">
                        Your bid (ETH)
                        <input
                          type="text"
                          inputMode="decimal"
                          value={bidAmount}
                          onChange={(event) => setBidAmount(event.target.value)}
                          placeholder={formatEth(state.highestBid + 10n ** 14n)}
                          className="w-40 rounded-lg border border-black/[.1] bg-transparent px-3 py-2 font-mono text-sm outline-none focus:border-black/40 dark:border-white/[.2] dark:focus:border-white/60"
                        />
                      </label>
                      <button
                        type="button"
                        disabled={!canBid || pending !== null}
                        onClick={() =>
                          void run("bid", () =>
                            auction.bid({ value: parsedBid ?? 0n }),
                          )
                        }
                        className="rounded-lg bg-foreground px-5 py-2 text-sm font-medium text-background transition-colors hover:bg-[#383838] disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-[#ccc]"
                      >
                        {pending === "bid" ? "Confirm in wallet…" : "Place bid"}
                      </button>
                    </div>
                  ) : null}

                  {bidTooLow ? (
                    <p className="text-xs text-amber-600 dark:text-amber-400">
                      Bid must be higher than {formatEth(state.highestBid)} ETH.
                    </p>
                  ) : null}

                  {isHighestBidder ? (
                    <p className="text-xs text-zinc-500">
                      You are the highest bidder. Wait for another bid or the
                      auction to end.
                    </p>
                  ) : null}

                  <div className="flex flex-wrap gap-3">
                    {!state.started ? (
                      <button
                        type="button"
                        disabled={!isSeller || pending !== null}
                        onClick={() => void run("start", () => auction.start())}
                        className="rounded-lg border border-black/[.1] px-4 py-2 text-sm font-medium transition-colors hover:bg-black/[.04] disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/[.2] dark:hover:bg-white/[.06]"
                      >
                        {pending === "start"
                          ? "Confirm in wallet…"
                          : "Start auction"}
                      </button>
                    ) : null}

                    {state.started && !state.ended ? (
                      <button
                        type="button"
                        disabled={!canEnd || pending !== null}
                        onClick={() => void run("end", () => auction.end())}
                        className="rounded-lg border border-black/[.1] px-4 py-2 text-sm font-medium transition-colors hover:bg-black/[.04] disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/[.2] dark:hover:bg-white/[.06]"
                      >
                        {pending === "end"
                          ? "Confirm in wallet…"
                          : "End auction"}
                      </button>
                    ) : null}

                    {state.myBalance > 0n ? (
                      <button
                        type="button"
                        disabled={!canWithdraw || pending !== null}
                        onClick={() =>
                          void run("withdraw", () => auction.withdraw())
                        }
                        className="rounded-lg border border-black/[.1] px-4 py-2 text-sm font-medium transition-colors hover:bg-black/[.04] disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/[.2] dark:hover:bg-white/[.06]"
                      >
                        {pending === "withdraw"
                          ? "Confirm in wallet…"
                          : `Withdraw ${formatEth(state.myBalance)} ETH`}
                      </button>
                    ) : null}
                  </div>

                  {!isSeller && !state.started ? (
                    <p className="text-xs text-zinc-500">
                      Only the seller can start this auction.
                    </p>
                  ) : null}
                </>
              )}
            </div>
          </section>

          <section className="rounded-2xl border border-black/[.06] p-6 dark:border-white/[.1]">
            <h2 className="text-sm font-medium uppercase tracking-wide text-zinc-500">
              Bid history
            </h2>
            {bids.length === 0 ? (
              <p className="mt-3 text-sm text-zinc-500">No bids yet.</p>
            ) : (
              <ul className="mt-3 flex flex-col divide-y divide-black/[.06] dark:divide-white/[.1]">
                {bids.map((bid, index) => (
                  <li
                    key={`${bid.bidder}-${bid.blockNumber}-${index}`}
                    className="flex items-center justify-between py-2 text-sm"
                  >
                    <span className="font-mono">
                      {bid.bidder === account ? "You" : shortenAddress(bid.bidder)}
                    </span>
                    <span className="font-mono">{formatEth(bid.amount)} ETH</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </div>
  );
}
