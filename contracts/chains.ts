import { InterfaceAbi } from "ethers";
import { Chain, defineChain } from "viem";

import { DataRegistryImplementationAbi } from "./abi/DataRegistryImplementation";
import { getContractAddress } from "./addresses";

export const mokshaTestnet = defineChain({
  id: 14800,
  caipNetworkId: "eip155:14800",
  chainNamespace: "eip155",
  name: "VANA - Moksha",
  nativeCurrency: {
    name: "VANA",
    symbol: "VANA",
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: [process.env.NEXT_PUBLIC_RPC_URL || "https://rpc.moksha.vana.org"],
    },
  },
  blockExplorers: {
    default: {
      url: "https://moksha.vanascan.io",
      name: "VANAScan",
    },
    etherscan: {
      url: "https://moksha.vanascan.io",
      name: "VANAScan",
    },
  },
  contracts: {
    dataRegistry: { address: getContractAddress(14800, "DataRegistryProxy") },
  },
  abis: {
    dataRegistry: DataRegistryImplementationAbi,
  },
});

export const vanaMainnet = defineChain({
  id: 1480,
  caipNetworkId: "eip155:1480",
  chainNamespace: "eip155",
  name: "VANA - Mainnet",
  nativeCurrency: {
    name: "VANA",
    symbol: "VANA",
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: [process.env.NEXT_PUBLIC_MAINNET_RPC_URL || "https://rpc.vana.org"],
    },
  },
  blockExplorers: {
    default: {
      url: "https://vana.vanascan.io",
      name: "VANAScan",
    },
    etherscan: {
      url: "https://vana.vanascan.io",
      name: "VANAScan",
    },
  },
  contracts: {
    dataRegistry: { address: getContractAddress(1480, "DataRegistryProxy") },
  },
  abis: {
    dataRegistry: DataRegistryImplementationAbi,
  },
});

export interface Chains {
  [key: number]: Chain & { abis?: Record<string, InterfaceAbi> };
}

export const chains: Chains = {
  [mokshaTestnet.id]: mokshaTestnet,
  [vanaMainnet.id]: vanaMainnet,
};

const chainId = Number(process.env.NEXT_PUBLIC_CHAIN_ID || 14800);
export const activeChain = chains[chainId];
export const activeChainId = chainId;
if (!activeChain) throw new Error(`Chain with id ${chainId} not found`);

export function getTransactionUrl(txHash: string): string {
  let baseUrl =
    activeChain.blockExplorers?.default?.url ||
    activeChain.blockExplorers?.etherscan?.url;
  if (!baseUrl) {
    console.warn("No block explorer configured for chain", activeChain.id);
    baseUrl = "https://moksha.vanascan.io";
  }
  return `${baseUrl}/tx/${txHash}`;
}
