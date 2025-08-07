"use client";

import Image from "next/image";
import { useState, useCallback } from "react";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card";
import {
  Alert, AlertDescription, AlertTitle,
} from "@/components/ui/alert";
import {
  Upload, Loader2, AlertCircle,
} from "lucide-react";

import { toast } from "sonner";
import { useWalletAuth } from "@/lib/auth/walletAuth";
import { useDropzone } from "react-dropzone";
import { useAccount } from "wagmi";
import { Navigation } from "../components/Navigation";
import { useContributionFlow } from "../contribution/hooks/useContributionFlow";
import { ContributionSuccess } from "../contribution/ContributionSuccess";
import { ContributionSteps } from "../contribution/ContributionSteps";
import { WalletLoginButton } from "../auth/WalletLoginButton";


interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  lastModified: number;
  status: 'pending' | 'processing' | 'completed' | 'error';
  uploadedAt: string;
}

interface UploadStatus {
  isUploading: boolean;
  isSuccess: boolean;
  error: string | null;
  uploadedFile: UploadedFile | null;
}

export default function UploadPage() {
  const { user } = useWalletAuth();
  const { isConnected } = useAccount();

  const {
    isSuccess,
    error,
    currentStep,
    completedSteps,
    contributionData,
    shareUrl,
    handleContributeData,
  } = useContributionFlow();

  const [uploadStatus, setUploadStatus] = useState<UploadStatus>({
    isUploading: false,
    isSuccess: false,
    error: null,
    uploadedFile: null,
  });

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (!user?.address) {
      toast.error("Please connect your wallet first");
      return;
    }

    if (!isConnected) {
      toast.error("Wallet not connected. Please connect your wallet and try again.");
      return;
    }

    const file = acceptedFiles[0];

    setUploadStatus(prev => ({
      ...prev,
      isUploading: true,
      error: null,
    }));

    try {
      await handleContributeData(user.address, file, isConnected);

      setUploadStatus(prev => ({
        ...prev,
        isUploading: false,
        isSuccess: true,
      }));
    } catch (err: any) {
      console.error("Upload error:", err);

      const errorCode = err?.response?.data?.detail?.error?.code;

      let userMessage = "Cannot proccess your file. Try again.";

      if (errorCode === "PROOF_OF_CONTRIBUTION_ERROR") {
        userMessage = "Your audio file is not valid.";
      }

      setUploadStatus(prev => ({
        ...prev,
        isUploading: false,
        error: userMessage,
      }));

      toast.error(userMessage);
    }
  }, [user?.address, isConnected, handleContributeData]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'audio/ogg': ['.ogg'] },
    multiple: false,
    disabled: uploadStatus.isUploading,
  });

  if (!user?.address) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Wallet Required</AlertTitle>
              <AlertDescription>
                Please connect your wallet to upload voice files.
              </AlertDescription>
            </Alert>
            <div className="flex justify-center pt-2">
              <WalletLoginButton />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Header */}
          <div className="text-center space-y-4">
            <h1 className="text-3xl font-bold">Upload Voice Data</h1>
            <p className="text-lg text-gray-600">
              Contribute your voice recordings to the VANA network. Your data will be encrypted and processed securely.
            </p>
          </div>

          {/* How it works */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                      <Image
                        src={"/icons/shield.png"}
                        alt="user"
                        width={20}
                        height={20}
                        className="object-contain"
                      />                  
                      How It Works
              </CardTitle>
              <CardDescription>
                Your voice data goes through a secure pipeline
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center space-y-2">
                  <div className="mx-auto w-14 h-14 rounded-full flex items-center justify-center">
                    <Image
                        src={"/icons/upload.png"}
                        alt="user"
                        width={75}
                        height={75}
                        className="object-contain"
                      />  
                  </div>
                  <h3 className="font-semibold">1.Upload</h3>
                  <p className="text-sm text-gray-600">Upload your .ogg voice files to local storage</p>
                </div>
                <div className="text-center space-y-2">
                  <div className="mx-auto w-14 h-14  rounded-full flex items-center justify-center">
                    <Image
                        src={"/icons/cloud.png"}
                        alt="user"
                        width={75}
                        height={75}
                        className="object-contain"
                      />  
                  </div>
                  <h3 className="font-semibold">2.Register</h3>
                  <p className="text-sm text-gray-600">Data is registered on the blockchain with proof of contribution</p>
                </div>
                <div className="text-center space-y-2">
                  <div className="mx-auto w-14 h-14 rounded-full flex items-center justify-center">
                    <Image
                        src={"/icons/web.png"}
                        alt="user"
                        width={75}
                        height={75}
                        className="object-contain"
                      />  
                  </div>
                  <h3 className="font-semibold">3.Process</h3>
                  <p className="text-sm text-gray-600">Voice data is processed and validated by the VANA network</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Upload Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                      <Image
                        src={"/icons/headphones.png"}
                        alt="user"
                        width={20}
                        height={20}
                        className="object-contain"
                      />                  
                      Upload Audio Files (.ogg)
              </CardTitle>
              <CardDescription>
                Upload your .ogg audio files to contribute to the VANA network.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                  isDragActive ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-gray-400"
                } ${uploadStatus.isUploading ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                <input {...getInputProps()} />
                <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                {uploadStatus.isUploading ? (
                  <div className="space-y-2">
                    <Loader2 className="mx-auto h-8 w-8 animate-spin text-blue-500" />
                    <p className="text-sm text-gray-600">Processing files...</p>
                  </div>
                ) : isDragActive ? (
                  <p className="text-lg font-medium text-blue-600">Drop the .ogg files here...</p>
                ) : (
                  <div className="space-y-2">
                    <p className="text-lg font-medium text-gray-900">Drag & drop .ogg files here</p>
                    <p className="text-sm text-gray-500">or click to select files</p>
                    <p className="text-xs text-gray-400">Only .ogg audio files are accepted</p>
                  </div>
                )}
              </div>
            </CardContent>
            <CardContent className="space-y-4">
              {uploadStatus.error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{uploadStatus.error}</AlertDescription>
                </Alert>
              )}

              {isSuccess && contributionData ? (
                <ContributionSuccess
                  contributionData={contributionData}
                  completedSteps={completedSteps}
                  shareUrl={shareUrl}
                />
              ) : (
                <div className="space-y-4">
                  {currentStep > 0 && (
                    <ContributionSteps
                      currentStep={currentStep}
                      completedSteps={completedSteps}
                      hasError={!!error}
                    />
                  )}
                  {!isConnected && (
                    <div className="bg-yellow-50 text-yellow-800 p-2 text-xs rounded mt-2">
                      Please connect your wallet to contribute data
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
