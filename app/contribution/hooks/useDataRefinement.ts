import { useState, useCallback } from "react";

interface RefinementInput {
  file_id: number;
  encryption_key: string;
  refiner_id?: number;
}

interface RefinementJobStatus {
  job_id: string;
  status: string;
  file_id: number;
  refiner_id: number;
  error?: string;
  transaction_hash?: string;
  submitted_at: string;
  started_at?: string;
  completed_at?: string;
  processing_duration_seconds?: number;
}

interface RefinementResponseV1 {
  add_refinement_tx_hash: string;
  success?: boolean;
  error?: string;
}

// Unified response that always represents the final result
interface RefinementFinalResponse {
  transaction_hash?: string; // For V1 this is add_refinement_tx_hash, for V2 this comes from job status
  job_id?: string; // Only present for V2
  api_version: string; // V1 or V2
  success: boolean;
  error?: string;
  processing_duration_seconds?: number; // Only for V2
}

interface UseDataRefinementReturn {
  refine: (
    input: RefinementInput,
    onStatusUpdate?: (status: RefinementJobStatus) => void,
    maxPollingDurationMs?: number,
    maxPollingRetries?: number,
  ) => Promise<RefinementFinalResponse>;
  checkStatus: (jobId: string) => Promise<RefinementJobStatus>;
  pollJobStatus: (
    jobId: string,
    onUpdate?: (status: RefinementJobStatus) => void,
    maxDurationMs?: number,
    maxRetries?: number,
  ) => Promise<RefinementJobStatus>;
  isLoading: boolean;
  error: Error | null;
  data: RefinementFinalResponse | null;
}

export function useDataRefinement(): UseDataRefinementReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [data, setData] = useState<RefinementFinalResponse | null>(null);

  const refine = async (
    input: RefinementInput,
    onStatusUpdate?: (status: RefinementJobStatus) => void,
    maxPollingDurationMs: number = 5 * 60 * 1000, // 5 minutes
    maxPollingRetries: number = 150, // 150 retries * 2 seconds = 5 minutes
  ): Promise<RefinementFinalResponse> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/refine", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          file_id: input.file_id,
          encryption_key: input.encryption_key,
          refiner_id: input.refiner_id,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Refinement request failed");
      }

      const responseData = await response.json();

      // Check if it's a V2 response (requires polling)
      if ("api_version" in responseData && responseData.api_version === "V2") {
        // V2: Poll for completion
        const finalStatus = await pollJobStatus(
          responseData.job_id,
          onStatusUpdate,
          maxPollingDurationMs,
          maxPollingRetries,
        );

        const finalResponse: RefinementFinalResponse = {
          job_id: finalStatus.job_id,
          api_version: "V2",
          success: finalStatus.status === "completed",
          error: finalStatus.error,
          transaction_hash: finalStatus.transaction_hash,
          processing_duration_seconds: finalStatus.processing_duration_seconds,
        };

        setData(finalResponse);
        return finalResponse;
      } else {
        // V1: Direct response
        const finalResponse: RefinementFinalResponse = {
          api_version: "V1",
          success: !!(responseData as RefinementResponseV1)
            .add_refinement_tx_hash,
          transaction_hash: (responseData as RefinementResponseV1)
            .add_refinement_tx_hash,
          error: (responseData as RefinementResponseV1).error,
        };

        setData(finalResponse);
        return finalResponse;
      }
    } catch (err) {
      const error =
        err instanceof Error ? err : new Error("Unknown error occurred");
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const checkStatus = async (jobId: string): Promise<RefinementJobStatus> => {
    try {
      const response = await fetch(`/api/refine/status/${jobId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Status check failed");
      }

      return await response.json();
    } catch (err) {
      const error =
        err instanceof Error ? err : new Error("Unknown error occurred");
      throw error;
    }
  };

  const pollJobStatus = useCallback(
    async (
      jobId: string,
      onUpdate?: (status: RefinementJobStatus) => void,
      maxDurationMs: number = 15 * 60 * 1000, // 15 minutes default
      maxRetries: number = 450, // 450 retries * 2 seconds = 15 minutes
    ): Promise<RefinementJobStatus> => {
      const startTime = Date.now();
      let retryCount = 0;

      const poll = async (): Promise<RefinementJobStatus> => {
        const currentTime = Date.now();
        const elapsedTime = currentTime - startTime;

        // Check timeout
        if (elapsedTime > maxDurationMs) {
          throw new Error(
            `Job polling timeout after ${Math.round(elapsedTime / 1000)}s. Job may still be processing.`,
          );
        }

        // Check retry limit
        if (retryCount >= maxRetries) {
          throw new Error(
            `Maximum polling attempts (${maxRetries}) exceeded. Job may still be processing.`,
          );
        }

        retryCount++;

        try {
          const status = await checkStatus(jobId);

          if (onUpdate) {
            onUpdate(status);
          }

          // If job is still processing, continue polling
          if (status.status === "submitted" || status.status === "processing") {
            await new Promise((resolve) => setTimeout(resolve, 2000)); // Wait 2 seconds
            return poll();
          }

          // Job is completed or failed, return final status
          return status;
        } catch (error) {
          // If it's a network error and we haven't exceeded limits, retry
          if (retryCount < maxRetries && elapsedTime < maxDurationMs) {
            console.warn(
              `Status check failed (attempt ${retryCount}/${maxRetries}), retrying in 2 seconds...`,
            );
            await new Promise((resolve) => setTimeout(resolve, 2000));
            return poll();
          }

          // If we've exceeded limits, throw the error
          throw error;
        }
      };

      return poll();
    },
    [],
  );

  return {
    refine,
    checkStatus,
    pollJobStatus,
    isLoading,
    error,
    data,
  };
}
