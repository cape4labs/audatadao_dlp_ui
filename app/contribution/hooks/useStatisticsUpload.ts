import { useState } from "react";

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

      const timestamp = Date.now();

      const response = await fetch(`/api/stat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_address: userAddress,
          audio_length: audioLength,
          time: timestamp,
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
