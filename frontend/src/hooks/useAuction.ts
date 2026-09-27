"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useWeb3 } from "@/contexts/Web3Context";
import { shortenAddress } from "@/utils/web3";

export type BidRecord = {
  bidder: string;
  amount: bigint;
  blockNumber: number;
};

export type AuctionState = {
  nft: string;
  nftId: bigint;
  seller: string;
  started: boolean;
  ended: boolean;
  endAt: number;
  highestBid: bigint;
  highestBidder: string;
  myBalance: bigint;
};

export function useAuction() {
  const { auction, account, signer } = useWeb3();
  const [state, setState] = useState<AuctionState | null>(null);
  const [bids, setBids] = useState<BidRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setError(null);
    const [nft, nftId, seller, started, ended, endAt, highestBid, highestBidder] =
      await Promise.all([
        auction.nft(),
        auction.nftId(),
        auction.seller(),
        auction.started(),
        auction.ended(),
        auction.endAt(),
        auction.highestBid(),
        auction.highestBidder(),
      ]);

    const myBalance = account ? await auction.bids(account) : 0n;
    setState({
      nft,
      nftId,
      seller,
      started,
      ended,
      endAt: Number(endAt),
      highestBid,
      highestBidder,
      myBalance,
    });

    const logs = await auction.queryFilter(auction.filters.Bid(), 0);
    setBids(
      logs
        .map((log) => {
          const event = auction.interface.parseLog({
            topics: [...log.topics],
            data: log.data,
          });
          return {
            bidder: String(event?.args[0]),
            amount: event?.args[1] as bigint,
            blockNumber: Number(log.blockNumber),
          };
        })
        .reverse()
        .slice(0, 10),
    );
  }, [auction, account]);

  useEffect(() => {
    let cancelled = false;
    void Promise.resolve()
      .then(refresh)
      .catch((cause: unknown) => {
        if (cancelled) return;
        setError(
          cause instanceof Error
            ? cause.message
            : "Could not read the auction contract.",
        );
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [refresh]);

  const isSeller = !!state && !!account && state.seller === account;
  const isHighestBidder =
    !!state && !!account && state.highestBidder === account;

  return useMemo(
    () => ({
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
      sellerLabel: state ? shortenAddress(state.seller) : null,
    }),
    [
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
    ],
  );
}
