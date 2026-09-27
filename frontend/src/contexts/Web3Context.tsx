"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { BrowserProvider, Signer } from "ethers";
import {
  getEnglishAuctionContract,
  getInjectedProvider,
  getReadOnlyProvider,
  toBrowserProvider,
  type EnglishAuctionContract,
  type Eip1193Provider,
} from "@/utils/web3";

type Web3ContextValue = {
  account: string | null;
  chainId: number | null;
  provider: BrowserProvider | null;
  signer: Signer | null;
  auction: EnglishAuctionContract;
  isConnecting: boolean;
  error: string | null;
  connect: () => Promise<void>;
  disconnect: () => void;
};

const Web3Context = createContext<Web3ContextValue | null>(null);

export function Web3Provider({ children }: { children: ReactNode }) {
  const [account, setAccount] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [provider, setProvider] = useState<BrowserProvider | null>(null);
  const [signer, setSigner] = useState<Signer | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hydrate = useCallback(
    async (
      injected: Eip1193Provider,
      accounts: unknown,
      chainIdHex: unknown,
    ) => {
      const browserProvider = toBrowserProvider(injected);
      const nextAccount =
        Array.isArray(accounts) && accounts.length > 0
          ? String(accounts[0])
          : null;

      setProvider(browserProvider);
      setAccount(nextAccount);
      setChainId(typeof chainIdHex === "string" ? Number(chainIdHex) : null);
      setSigner(
        nextAccount ? await browserProvider.getSigner(nextAccount) : null,
      );
    },
    [],
  );

  const sync = useCallback(
    async (injected: Eip1193Provider) => {
      const browserProvider = toBrowserProvider(injected);
      const [accounts, chainIdHex] = await Promise.all([
        browserProvider.send("eth_accounts", []),
        browserProvider.send("eth_chainId", []),
      ]);
      await hydrate(injected, accounts, chainIdHex);
    },
    [hydrate],
  );

  useEffect(() => {
    const injected = getInjectedProvider();
    if (!injected) return;

    let cancelled = false;
    void Promise.resolve()
      .then(() => sync(injected))
      .catch((cause: unknown) => {
        if (cancelled) return;
        setError(cause instanceof Error ? cause.message : "Connection failed.");
      });

    const onAccountsChanged = () => {
      void sync(injected);
    };
    const onChainChanged = (chainIdHex: unknown) => {
      setChainId(typeof chainIdHex === "string" ? Number(chainIdHex) : null);
      void sync(injected);
    };

    injected.on?.("accountsChanged", onAccountsChanged);
    injected.on?.("chainChanged", onChainChanged);

    return () => {
      cancelled = true;
      injected.removeListener?.("accountsChanged", onAccountsChanged);
      injected.removeListener?.("chainChanged", onChainChanged);
    };
  }, [sync]);

  const connect = useCallback(async () => {
    const injected = getInjectedProvider();
    if (!injected) {
      setError("No browser wallet detected.");
      return;
    }

    setIsConnecting(true);
    setError(null);
    try {
      const browserProvider = toBrowserProvider(injected);
      const accounts = await browserProvider.send("eth_requestAccounts", []);
      const chainIdHex = await browserProvider.send("eth_chainId", []);
      await hydrate(injected, accounts, chainIdHex);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Connection failed.");
    } finally {
      setIsConnecting(false);
    }
  }, [hydrate]);

  const disconnect = useCallback(() => {
    setAccount(null);
    setSigner(null);
    setError(null);
  }, []);

  const auction = useMemo(
    () => getEnglishAuctionContract(signer ?? getReadOnlyProvider()),
    [signer],
  );

  const value = useMemo(
    () => ({
      account,
      chainId,
      provider,
      signer,
      auction,
      isConnecting,
      error,
      connect,
      disconnect,
    }),
    [
      account,
      chainId,
      provider,
      signer,
      auction,
      isConnecting,
      error,
      connect,
      disconnect,
    ],
  );

  return <Web3Context.Provider value={value}>{children}</Web3Context.Provider>;
}

export function useWeb3(): Web3ContextValue {
  const context = useContext(Web3Context);
  if (!context) {
    throw new Error("useWeb3 must be used within a Web3Provider.");
  }
  return context;
}
