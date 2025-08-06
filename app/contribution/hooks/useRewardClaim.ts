import { useState } from 'react';
import { useAccount, useConfig, useWriteContract } from 'wagmi';
import { waitForTransactionReceipt } from '@wagmi/core';
import { TransactionReceipt } from 'viem';
import { Controller } from '@/contracts/instances/controller';

// Interface for blockchain error objects
interface BlockchainErrorObject {
  reason?: string;
  message?: string;
  code?: string | number;
  [key: string]: unknown;
}

/**
 * Hook for claiming rewards from the blockchain
 */
export const useRewardClaim = () => {
  const { address } = useAccount();
  const config = useConfig();
  const { writeContractAsync, isPending } = useWriteContract();
  const [isClaiming, setIsClaiming] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [contractError, setContractError] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<TransactionReceipt | null>(null);

  /**
   * Request reward for a file and wait for receipt
   */
  const requestReward = async (fileId: number | bigint): Promise<TransactionReceipt | null> => {
    setIsClaiming(true);
    setError(null);
    setContractError(null);
    
    try {
      if (!address) {
        throw new Error("Wallet not connected");
      }

      // Get contract instance
      const dataLiquidityPool = Controller("DataLiquidityPoolProxy");
      
      // Request reward using wagmi hooks
      const hash = await writeContractAsync({
        address: dataLiquidityPool.address,
        abi: dataLiquidityPool.abi,
        functionName: "requestReward",
        args: [BigInt(fileId), BigInt(1)], // Convert both values to bigint
      });
      
      // Wait for transaction receipt
      const txReceipt = await waitForTransactionReceipt(config, {
        hash,
        confirmations: 1,
      });
      
      setReceipt(txReceipt);
      return txReceipt;
    } catch (err) {
      console.error("Error claiming reward:", err);
      const error = err instanceof Error ? err : new Error("Failed to claim reward");
      setError(error);

      // Extract contract-specific error message
      if (err instanceof Error) {
        // Contract errors often contain specific messages in their error object
        const errorMessage = err.message || "Unknown contract error";
        setContractError(errorMessage);
      } else if (typeof err === "object" && err !== null) {
        // Some blockchain errors have custom formats
        const errorObj = err as BlockchainErrorObject;
        const errorMessage = 
          errorObj.reason || errorObj.message || JSON.stringify(err);
        setContractError(errorMessage);
      } else {
        setContractError("Failed to claim reward from blockchain");
      }

      return null;
    } finally {
      setIsClaiming(false);
    }
  };

  return {
    requestReward,
    isClaiming: isClaiming || isPending,
    isPending,
    error,
    contractError,
    receipt,
  };
}; 