import { useState } from "react";
import { clientSideEncrypt, formatVanaFileId } from "../../../lib/crypto/utils";

export interface UploadResponse {
  downloadUrl: string;
  vanaFileId: string;
}


export function useDataUpload() {
  const [isUploading, setIsUploading] = useState(false);
  /**
   * Upload data to Google Drive
   */
  const uploadData = async (
    file: Blob,
    signature: string,
  ): Promise<UploadResponse | null> => {
    setIsUploading(true);

    try {
        const timestamp = Date.now();

        let formData = new FormData();
        const ecnryptFile = await clientSideEncrypt(file, signature)

        formData.append('file', ecnryptFile)
      

        const pinataResponse = await fetch("api/upload", {
            method: "POST",
            body: formData,
        });

        console.log(pinataResponse)

        if (!pinataResponse.ok) {
            console.error("Upload failed:", pinataResponse.statusText);
            throw new Error("Failed to upload file to Pinata");
        }

        const pinataResult = await pinataResponse.json();

        const fileUrl = pinataResult.data.pinataUrl;

        return {
          downloadUrl: fileUrl,
          vanaFileId: formatVanaFileId(fileUrl, timestamp)

        };
    } finally {
      setIsUploading(false);
    }
  };

  return {
    uploadData,
    isUploading,
  };
}