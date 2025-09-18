import { useState } from "react";
import { TransactionReceipt } from "viem";
import { debugLog } from "@/lib/logger";
import { useAccount, useConfig, useWriteContract } from "wagmi";
import { waitForTransactionReceipt } from "@wagmi/core";
import { DataRegistry } from "@/contracts/instances/data-registry";
import { Controller } from "@/contracts/instances/controller";

interface BlockchainErrorObject {
  reason?: string;
  message?: string;
  code?: string | number;
  [key: string]: unknown;
}

export function useAddFile() {
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [contractError, setContractError] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<TransactionReceipt | null>(null);
  const { address } = useAccount();
  const config = useConfig();
  const { writeContractAsync, isPending } = useWriteContract();

  const { address: dataLiquidityPoolAddress } = Controller(
    "DataLiquidityPoolProxy",
  );

  const addFile = async (
    fileUrl: string,
    encryptionKey: string,
    userAddress: string,
    isGasless: boolean,
  ): Promise<TransactionReceipt | null> => {
    if (isGasless) {
      setIsAdding(true);
      setError(null);

      try {
        const res = await fetch("/api/addFile", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fileUrl, encryptionKey, userAddress }),
          credentials: "include",
        });

        if (!res.ok) {
          throw new Error(`Backend error: ${await res.text()}`);
        }

        const data = await res.json();

        debugLog("useAddFile 32", data);

        setReceipt(data.receipt);

        return data.receipt;
      } catch (err) {
        console.error(err);
        const error =
          err instanceof Error ? err : new Error("Failed to add file");
        setError(error);
      } finally {
        setIsAdding(false);
      }
    } else {
      setIsAdding(true);
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
            address,
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
      } finally {
        setIsAdding(false);
      }
    }
  };

  return {
    addFile,
    isAdding,
    contractError,
    receipt,
  };
}
