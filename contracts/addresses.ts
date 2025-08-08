import { Address } from "viem";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const vanaContracts = [
  "DataRegistryProxy",
  "TeePoolProxy",
  "DataLiquidityPoolProxy",
] as const;
export type VanaContract = (typeof vanaContracts)[number];

const addresses: Record<number, Record<VanaContract, Address>> = {
  // Moksha Testnet
  14800: {
    DataRegistryProxy: "0x8C8788f98385F6ba1adD4234e551ABba0f82Cb7C",
    TeePoolProxy: "0xE8EC6BD73b23Ad40E6B9a6f4bD343FAc411bD99A",
    DataLiquidityPoolProxy:
      (process.env.NEXT_PUBLIC_DLP_CONTRACT_ADDRESS as Address) ||
      "0x0161DFbf70a912668dd1B4365b43c1348e8bD3ab",
  },
  // Mainnet
  1480: {
    DataRegistryProxy: "0x8C8788f98385F6ba1adD4234e551ABba0f82Cb7C",
    TeePoolProxy: "0xE8EC6BD73b23Ad40E6B9a6f4bD343FAc411bD99A",
    DataLiquidityPoolProxy:
      (process.env.NEXT_PUBLIC_DLP_CONTRACT_ADDRESS as Address) ||
      "0x0161DFbf70a912668dd1B4365b43c1348e8bD3ab",
  },
};

export const getContractAddress = (chainId: number, contract: VanaContract) => {
  const contractAddress = addresses[chainId]?.[contract];
  if (!contractAddress) {
    throw new Error(
      `Contract address not found for ${contract} on chain ${chainId}`,
    );
  }
  return contractAddress;
};
