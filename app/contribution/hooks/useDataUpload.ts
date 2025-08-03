import { useState } from "react";
import { uploadUserData, UploadResponse } from "@/lib/google/googleService";
import { useSession } from "next-auth/react";
import { DriveInfo, UserInfo } from "../types";

/**
 * Hook for uploading and encrypting data
 */
export function useDataUpload() {
  const [isUploading, setIsUploading] = useState(false);
  const { data: session } = useSession();

  /**
   * Upload data to Google Drive
   */
  const uploadData = async (
    userInfo: UserInfo,
    signature: string,
    driveInfo?: DriveInfo
  ): Promise<UploadResponse | null> => {
    setIsUploading(true);

    try {
      if (!session?.accessToken) {
        throw new Error("No access token available");
      }

      // Use the Google Service to handle the entire upload process
      const result = await uploadUserData(
        userInfo,
        signature,
        session.accessToken as string,
        driveInfo
      );

      return result;
    } finally {
      setIsUploading(false);
    }
  };

  return {
    uploadData,
    isUploading,
  };
}