import { useState } from "react";
import { TransactionReceipt } from "viem";
import { debugLog } from "@/lib/logger";

export function useAddFile() {
  const [isAdding, setIsAdding] = useState(false);
  const [contractError, setError] = useState<Error | null>(null);
  const [receipt, setReceipt] = useState<TransactionReceipt | null>(null);

  const addFile = async (
    fileUrl: string,
    encryptionKey: string,
    userAddress: string,
  ): Promise<TransactionReceipt | null> => {
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
      return null;
    } finally {
      setIsAdding(false);
    }
  };

  return {
    addFile,
    isAdding,
    contractError,
    receipt,
  };
}
