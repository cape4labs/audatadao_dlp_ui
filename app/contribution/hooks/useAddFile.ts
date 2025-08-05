import { useState } from "react";
import { useAccount, useConfig, useWriteContract } from "wagmi";
import { waitForTransactionReceipt } from "@wagmi/core";
import { DataRegistry } from "@/contracts/instances/data-registry";
import { TransactionReceipt } from "viem";
import { Controller } from "@/contracts/instances/controller";

// Interface for blockchain error objects
interface BlockchainErrorObject {
  reason?: string;
  message?: string;
  code?: string | number;
  [key: string]: unknown;
}

/**
 * Hook for adding a file to the blockchain
 */
export function useAddFile() {
  const { address } = useAccount();
  const config = useConfig();
  const { writeContractAsync, isPending } = useWriteContract();
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [contractError, setContractError] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<TransactionReceipt | null>(null);

  const { address: dataLiquidityPoolAddress } = Controller(
    "DataLiquidityPoolProxy"
  );

  /**
   * Add file to blockchain and wait for receipt
   */
  const addFile = async (
    fileUrl: string,
    encryptionKey: string
  ): Promise<TransactionReceipt | null> => {
    if (!address) {
      throw new Error("Wallet not connected");
    }

    setIsAdding(true);
    setError(null);
    setContractError(null);

    try {
      const dataRegistry = DataRegistry();

      // Send transaction to add file with permissions to DataRegistry
      const hash = await writeContractAsync({
        address: dataRegistry.address,
        abi: dataRegistry.abi,
        functionName: "addFileWithPermissions",
        args: [
          fileUrl,
          address, // ownerAddress - the user's address
          [
            {
              account: dataLiquidityPoolAddress,
              key: encryptionKey,
            },
          ],
        ],
      });

      // Wait for transaction receipt
      const txReceipt = await waitForTransactionReceipt(config, {
        hash,
        confirmations: 1,
      });

      setReceipt(txReceipt);
      return txReceipt;
    } catch (err) {
      console.error(err);
      const error =
        err instanceof Error ? err : new Error("Failed to add file");
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
        setContractError("Failed to add file to blockchain");
      }

      return null;
    } finally {
      setIsAdding(false);
    }
  };

  return {
    addFile,
    isAdding: isAdding || isPending,
    isPending,
    error,
    contractError,
    receipt,
  };
}