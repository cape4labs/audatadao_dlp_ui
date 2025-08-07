import { useState } from "react";
import { clientSideEncrypt, formatVanaFileId } from "../../../lib/crypto/utils";
import JSZip from "jszip";

export interface UploadResponse {
  downloadUrl: string;
  vanaFileId: string;
}

interface User {
  wallet_address: string;
  birth_month: string;
  birth_year: string;
  occupation: string;
  country: string;
  region: string;
}

interface UserMetadata {
  language_code: string;
  audio_length: string;
  audio_source: string;
  audio_type: string;
  user: User | null;
}

export function useDataUpload() {
  const [isUploading, setIsUploading] = useState(false);
  /**
   * Upload data to Google Drive
   */
  const uploadData = async (
    userAddress: string,
    file: Blob,
    signature: string,
  ): Promise<UploadResponse | null> => {
    setIsUploading(true);

    try {
        const timestamp = Date.now();

        let formData = new FormData();

        const metadataRes = await fetch(`api/user/onboarding?walletAddress=${userAddress}`);
        if (!metadataRes.ok) {
          console.log(metadataRes)
        }

        const metadataJson = await metadataRes.json();

        const data = metadataJson.data

        const userMetadata: UserMetadata = {
          language_code: "ru",
          audio_length: "123",
          audio_source: "telegram",
          audio_type: "speech",
          user: {
            wallet_address: data.userAddress,
            birth_month: data.birthMonth,
            birth_year: data.birthYear,
            occupation: "IT",
            country: data.country,
            region: "asd",
          },
        };

        const fileName = file.text.name;

        const zip = new JSZip();
        
        const fileBuffer = await file.arrayBuffer();
        zip.file(`${fileName}.ogg`, Buffer.from(fileBuffer));
    
        const jsonFile = new Blob([JSON.stringify(userMetadata, null, 2)], {
          type: "application/json",
        });
    
        const jsonBuffer = await jsonFile.arrayBuffer();
        zip.file("data.json", jsonBuffer);
    
        const zipContent = await zip.generateAsync({ type: "uint8array" });
        const zipBlob = new Blob([zipContent], { type: "application/zip" });
        const zipFile = new File([zipBlob], "archive.zip", { type: "application/zip" });
    

        const ecnryptFile = await clientSideEncrypt(zipFile, signature)

        formData.append("file", ecnryptFile)

        const pinataResponse = await fetch("api/upload", {
          method: "POST",
          body: formData,
        });

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