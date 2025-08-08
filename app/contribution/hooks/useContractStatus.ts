import { useState, useEffect } from "react";
import { useAccount, useReadContract } from "wagmi";
import { DataRegistry } from "@/contracts/instances/data-registry";

export interface ContractStatus {
  isPaused: boolean;
  isLoading: boolean;
  error: string | null;
}

export function useContractStatus() {
  const { address } = useAccount();
  const [status, setStatus] = useState<ContractStatus>({
    isPaused: false,
    isLoading: true,
    error: null,
  });

  const dataRegistry = DataRegistry();

  const {
    data: isPaused,
    isLoading,
    error,
  } = useReadContract({
    address: dataRegistry.address,
    abi: dataRegistry.abi,
    functionName: "paused",
  });

  useEffect(() => {
    setStatus({
      isPaused: Boolean(isPaused),
      isLoading,
      error: error?.message || null,
    });
  }, [isPaused, isLoading, error]);

  return status;
}
