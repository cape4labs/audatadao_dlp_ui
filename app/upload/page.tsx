"use client";

import Image from "next/image";
import { useState, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Upload, Loader2, AlertCircle } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useWalletAuth } from "@/lib/auth/walletAuth";
import { useDropzone } from "react-dropzone";
import { useAccount } from "wagmi";
import { Navigation } from "../components/Navigation";
import { useContributionFlow } from "../contribution/hooks/useContributionFlow";
import { ContributionSuccess } from "../contribution/ContributionSuccess";
import { ContributionSteps, contributionSteps } from "../contribution/ContributionSteps";
import { WalletLoginButton } from "../auth/WalletLoginButton";

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  lastModified: number;
  status: "pending" | "processing" | "completed" | "error";
  uploadedAt: string;
}

interface UploadStatus {
  isUploading: boolean;
  isSuccessStatus: boolean;
  error: string | null;
  uploadedFiles: UploadedFile[];
}

export default function UploadPage() {
  const { user } = useWalletAuth();
  const { isConnected } = useAccount();
  const [audioLanguage, setAudioLanguage] = useState<string>("");
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
    isSuccessStatus: false,
    error: null,
    uploadedFiles: [],
  });

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (!user?.address) {
        toast.error("Please connect your wallet first");
        return;
      }

      if (!isConnected) {
        toast.error(
          "Wallet not connected. Please connect your wallet and try again."
        );
        return;
      }
      

      if (localStorage.getItem("user_onboarding") === null) {
        setUploadStatus((prev) => ({
          ...prev,
          isUploading: false,
          isSuccessStatus: false,
          error: "Finish onboarding first",
        }));
        return;
      }

      if (audioLanguage === "") {
        setUploadStatus((prev) => ({
          ...prev,
          isUploading: false,
          isSuccessStatus: false,
          error: "Select language of speech in audio",
        }));
        return;
      }

      if (audioLanguage === "") {
        setUploadStatus((prev) => ({
          ...prev,
          isUploading: false,
          error: "Select audio language",
          isSuccessStatus: false,
        }));
        return;
      }

      for (const file of acceptedFiles) {
        const newFile: UploadedFile = {
          id: crypto.randomUUID(),
          name: file.name,
          size: file.size,
          type: file.type,
          lastModified: file.lastModified,
          status: "processing",
          uploadedAt: new Date().toISOString(),
        };

        setUploadStatus((prev) => ({
          ...prev,
          uploadedFiles: [...prev.uploadedFiles, newFile],
          isUploading: true,
        }));

        try {
          await handleContributeData(
            user.address,
            audioLanguage,
            file,
            isConnected
          );

          console.log(currentStep)

          console.log(completedSteps)

          if (isSuccess) {
            setUploadStatus((prev) => ({
            ...prev,
            uploadedFiles: prev.uploadedFiles.map((f) =>
              f.id === newFile.id ? { ...f, status: "completed" } : f
            ),
            isUploading: false,
            isSuccessStatus: true,
          }));
          } else {
            setUploadStatus((prev) => ({
              ...prev,
              uploadedFiles: prev.uploadedFiles.map((f) =>
                f.id === newFile.id ? { ...f, status: "error" } : f
              ),
              isUploading: false,
              isSuccessStatus: false,
              error: error,
            }));
          }
        } catch (err: any) {
          console.error("Upload error:", err);
          const errorCode = err?.response?.data?.detail?.error?.code;
          let userMessage = "Cannot process your file. Try again.";
          if (errorCode === "PROOF_OF_CONTRIBUTION_ERROR") {
            userMessage = "Your audio file is not valid.";
          }

          setUploadStatus((prev) => ({
            ...prev,
            uploadedFiles: prev.uploadedFiles.map((f) =>
              f.id === newFile.id ? { ...f, status: "error" } : f
            ),
            isUploading: false,
            isSuccessStatus: false,
            error: error,
          }));

          toast.error(userMessage);
        }
      }
    },
    [user?.address, isConnected, audioLanguage, handleContributeData]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "audio/ogg": [".ogg"] },
    multiple: true,
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

  const languages = ["en", "ru", "es", "de"];

  return (
    <div className="flex flex-col min-h-screen">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Header */}
          <div className="text-center space-y-4">
            <h1 className="text-3xl font-bold">Upload Voice Data</h1>
            <p className="text-lg text-gray-600">
              Contribute your voice recordings to the VANA network. Your data
              will be encrypted and processed securely.
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
                  <p className="text-sm text-gray-600">
                    Upload your .ogg voice files to Pinata storage
                  </p>
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
                  <p className="text-sm text-gray-600">
                    Data is registered on the blockchain with proof of
                    contribution
                  </p>
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
                  <p className="text-sm text-gray-600">
                    Voice data is processed and validated by the VANA network
                  </p>
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
              <Select
                value={audioLanguage}
                onValueChange={(value) => setAudioLanguage(value)}
              >
                <CardDescription>
                  Select language of speech in audio
                </CardDescription>
                <SelectTrigger>
                  <SelectValue placeholder="Languages" />
                </SelectTrigger>
                <SelectContent>
                  {languages.map((language) => (
                    <SelectItem key={language} value={language.toString()}>
                      {language}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <CardDescription>
                Upload your .ogg audio files to contribute to the VANA network.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                  isDragActive
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-300 hover:border-gray-400"
                } ${uploadStatus.isUploading ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                <input {...getInputProps()} />
                <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                {uploadStatus.isUploading ? (
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600">Processing files...</p>
                  </div>
                ) : isDragActive ? (
                  <p className="text-lg font-medium text-blue-600">
                    Drop the .ogg files here...
                  </p>
                ) : (
                  <div className="space-y-2">
                    <p className="text-lg font-medium text-gray-900">
                      Drag & drop .ogg files here
                    </p>
                    <p className="text-sm text-gray-500">
                      or click to select files
                    </p>
                    <p className="text-xs text-gray-400">
                      Only .ogg audio files are accepted
                    </p>
                  </div>
                )}
              </div>
            </CardContent>

            {/* Список файлов */}
            <CardContent className="space-y-2">
              {uploadStatus.uploadedFiles.length > 0 && (
                <div className="space-y-2">
                  {uploadStatus.uploadedFiles.map((file) => (
                    <div
                      key={file.id}
                      className="flex justify-between items-center p-2 border rounded"
                    >
                      <span className="text-sm">{file.name}</span>
                      <span className="text-xs text-gray-500">
                        {file.status === "processing" && "⏳ Processing"}
                        {file.status === "completed" && "✅ Completed"}
                        {file.status === "error" && "❌ Error"}
                      </span>
                    </div>
                  ))}
                </div>
              )}
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
                  {contributionSteps.map((step, i) => {
                    return (
                      <div key={step.id} className="flex mb-4 last:mb-0">
                        {/* Step indicator */}
                        <div className="mr-4 flex flex-col items-center">
                          <div
                            className={`flex items-center justify-center w-8 h-8 rounded-full aspect-square bg-gray-200`}
                          >
                            {step.id}
                          </div>
                          {/* Connector line (except for last item) */}
                          {i < contributionSteps.length - 1 && (
                            <div className="w-0.5 h-full bg-gray-200 my-1"></div>
                          )}
                        </div>
                        {/* Step content */}
                        <div className="flex-1">
                          <h3 className="text-sm font-medium">{step.title}</h3>
                          <p className="text-xs text-muted-foreground">
                            {step.description}
                          </p>
                        </div>
                      </div>
                    );
                  })}
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
