import { useState } from "react";
import { clientSideEncrypt, formatVanaFileId } from "@/lib/crypto/utils";
import { DriveInfo, UserInfo } from "../types";

export interface LocalUploadResponse {
  downloadUrl: string;
  fileId: string;
  vanaFileId: string;
}

/**
 * Hook for handling local file upload and encryption
 */
export function useLocalFileUpload() {
  const [isUploading, setIsUploading] = useState(false);

  /**
   * Process local file data
   */
  const processLocalFile = async (
    userInfo: UserInfo,
    walletPublicKey: string,
    fileData: File | string,
  ): Promise<LocalUploadResponse | null> => {
    setIsUploading(true);

    try {
      // Prepare data package
      const timestamp = Date.now();
      const dataPackage = {
        userId: userInfo.id || "unknown",
        email: userInfo.email,
        timestamp,
        profile: {
          name: userInfo.name,
          locale: userInfo.locale || "en",
        },
        metadata: {
          source: "Local",
          collectionDate: new Date().toISOString(),
          dataType: "profile",
        },
      };

      // Convert file data to blob
      let fileBlob: Blob;
      if (typeof fileData === "string") {
        // If it's a string, create a JSON blob
        const fileString = JSON.stringify(dataPackage);
        fileBlob = new Blob([fileString], { type: "application/json" });
      } else {
        // If it's a File object, use it directly
        fileBlob = fileData;
      }

      // Encrypt the data with wallet public key
      const encryptedBlob = await clientSideEncrypt(fileBlob, walletPublicKey);

      // Create a local URL for the encrypted blob
      const downloadUrl = URL.createObjectURL(encryptedBlob);
      
      // Generate a unique file ID (using timestamp and user ID)
      const fileId = `local_${userInfo.id || "unknown"}_${timestamp}`;
      
      // Generate vana file ID
      const vanaFileId = formatVanaFileId(downloadUrl, timestamp);

      return {
        downloadUrl,
        fileId,
        vanaFileId,
      };
    } catch (error) {
      console.error("Error processing local file:", error);
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  return {
    processLocalFile,
    isUploading,
  };
} 