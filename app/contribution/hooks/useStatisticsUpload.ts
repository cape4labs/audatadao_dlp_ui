import { useState } from "react";
import { json } from "stream/consumers";

interface UseStatisticsUploadReturn {
  uploadStatistics: (userAddress: string | undefined, audioLength: number | undefined) => Promise<void>,
  isStatisticsUploading: boolean,
}

export function useStatisticsUpload(): UseStatisticsUploadReturn {
  const [isStatisticsUploading, setIsUploading] = useState(false);

  const uploadStatistics = async (
    userAddress: string | undefined,
    audioLength: number | undefined,
  ): Promise<void> => {
    try {
      setIsUploading(true);

      const response = await fetch(`/api/stat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userAddress: userAddress,
          audioLength: audioLength,
        }),
      });

      if (!response.ok) {
        throw new Error(`ERROR GATHERING STATISTICS: ${response}`);
      }
    } finally {
      setIsUploading(false);
    }
  };
  return {
    uploadStatistics,
    isStatisticsUploading,
  };
}
