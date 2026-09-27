import {
  BaseContract,
  BrowserProvider,
  JsonRpcProvider,
  formatEther,
  type BigNumberish,
  type ContractRunner,
  type ContractTransactionResponse,
  type InterfaceAbi,
  type JsonFragment,
  type TransactionRequest,
} from "ethers";

type RawFragment = {
  type?: string;
  inputs?: RawFragment[];
  outputs?: RawFragment[];
} & Record<string, unknown>;

function toEthersAbi(abi: readonly RawFragment[]): InterfaceAbi {
  const normalize = (fragment: RawFragment): RawFragment => ({
    ...fragment,
    type: fragment.type?.startsWith("contract ")
      ? "address"
      : fragment.type,
    ...(fragment.inputs ? { inputs: fragment.inputs.map(normalize) } : {}),
    ...(fragment.outputs ? { outputs: fragment.outputs.map(normalize) } : {}),
  });

  return abi.map(normalize) as JsonFragment[];
}

export const ENGLISH_AUCTION_ADDRESS =
  process.env.NEXT_PUBLIC_ENGLISH_AUCTION_ADDRESS ??
  "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0";

const RAW_ENGLISH_AUCTION_ABI: RawFragment[] = [
  {
    type: "constructor",
    inputs: [
      { name: "_nft", type: "address", internalType: "address" },
      { name: "_nftId", type: "uint256", internalType: "uint256" },
      { name: "_startingBid", type: "uint256", internalType: "uint256" },
    ],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "bid",
    inputs: [],
    outputs: [],
    stateMutability: "payable",
  },
  {
    type: "function",
    name: "bids",
    inputs: [{ name: "", type: "address", internalType: "address" }],
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "end",
    inputs: [],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "endAt",
    inputs: [],
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "ended",
    inputs: [],
    outputs: [{ name: "", type: "bool", internalType: "bool" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "highestBid",
    inputs: [],
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "highestBidder",
    inputs: [],
    outputs: [{ name: "", type: "address", internalType: "address" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "nft",
    inputs: [],
    outputs: [{ name: "", type: "contract IERC721", internalType: "contract IERC721" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "nftId",
    inputs: [],
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "seller",
    inputs: [],
    outputs: [{ name: "", type: "address", internalType: "address payable" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "start",
    inputs: [],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "started",
    inputs: [],
    outputs: [{ name: "", type: "bool", internalType: "bool" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "withdraw",
    inputs: [],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "event",
    name: "Bid",
    inputs: [
      { name: "bidder", type: "address", indexed: true, internalType: "address" },
      { name: "amount", type: "uint256", indexed: false, internalType: "uint256" },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "End",
    inputs: [
      { name: "winner", type: "address", indexed: false, internalType: "address" },
      { name: "amount", type: "uint256", indexed: false, internalType: "uint256" },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "Start",
    inputs: [],
    anonymous: false,
  },
  {
    type: "event",
    name: "Withdraw",
    inputs: [
      { name: "bidder", type: "address", indexed: true, internalType: "address" },
      { name: "amount", type: "uint256", indexed: false, internalType: "uint256" },
    ],
    anonymous: false,
  },
];

export const ENGLISH_AUCTION_ABI = toEthersAbi(RAW_ENGLISH_AUCTION_ABI);

export const ANVIL_RPC_URL =
  process.env.NEXT_PUBLIC_ANVIL_RPC_URL ?? "http://127.0.0.1:8545";

export type Eip1193Provider = {
  request: (args: {
    method: string;
    params?: unknown[];
  }) => Promise<unknown>;
  on?: (event: string, listener: (...args: never[]) => void) => void;
  removeListener?: (
    event: string,
    listener: (...args: never[]) => void,
  ) => void;
};

declare global {
  interface Window {
    ethereum?: Eip1193Provider;
  }
}

export interface EnglishAuctionInterface {
  bid(overrides?: TransactionRequest & { value?: BigNumberish }): Promise<ContractTransactionResponse>;
  bids(account: string): Promise<bigint>;
  end(): Promise<ContractTransactionResponse>;
  endAt(): Promise<bigint>;
  ended(): Promise<boolean>;
  highestBid(): Promise<bigint>;
  highestBidder(): Promise<string>;
  nft(): Promise<string>;
  nftId(): Promise<bigint>;
  seller(): Promise<string>;
  start(): Promise<ContractTransactionResponse>;
  started(): Promise<boolean>;
  withdraw(): Promise<ContractTransactionResponse>;
}

export type EnglishAuctionContract = BaseContract &
  EnglishAuctionInterface;

export type AuctionEventMap = {
  Start: [];
  Bid: [bidder: string, amount: bigint];
  Withdraw: [bidder: string, amount: bigint];
  End: [winner: string, amount: bigint];
};

export type AuctionEventName = keyof AuctionEventMap;

export function getEnglishAuctionContract(
  runner: ContractRunner | null,
): EnglishAuctionContract {
  return BaseContract.from<EnglishAuctionInterface>(
    ENGLISH_AUCTION_ADDRESS,
    ENGLISH_AUCTION_ABI,
    runner,
  );
}

export function getInjectedProvider(): Eip1193Provider | undefined {
  if (typeof window === "undefined") return undefined;
  return window.ethereum;
}

export function toBrowserProvider(
  injected: Eip1193Provider,
): BrowserProvider {
  return new BrowserProvider(injected as never, "any");
}

let readOnlyProvider: JsonRpcProvider | null = null;

export function getReadOnlyProvider(): JsonRpcProvider {
  readOnlyProvider ??= new JsonRpcProvider(ANVIL_RPC_URL, undefined, {
    staticNetwork: true,
  });
  return readOnlyProvider;
}

export function shortenAddress(address: string, visible = 4): string {
  if (address.length <= visible * 2 + 2) return address;
  return `${address.slice(0, visible + 2)}...${address.slice(-visible)}`;
}

export function formatEth(wei: bigint, precision = 4): string {
  const value = Number(formatEther(wei));
  if (!Number.isFinite(value)) return "0";
  return value.toFixed(precision);
}
