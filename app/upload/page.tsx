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
import { ContributionSteps } from "../contribution/ContributionSteps";
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
  error: string | null;
  uploadedFiles: UploadedFile[];
}


export default function UploadPage() {
  const { user } = useWalletAuth();
  const { isConnected } = useAccount();
  const [audioLanguage, setAudioLanguage] = useState<string>("");
  const {
    getFileContribution,
    getAllFileContributions,
    areAllFilesCompleted,
    hasAnySuccess,
    handleContributeData,
  } = useContributionFlow();

  const [uploadStatus, setUploadStatus] = useState<UploadStatus>({
    isUploading: false,
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
          "Wallet not connected. Please connect your wallet and try again.",
        );

        return;
      }

      if (localStorage.getItem("user_onboarding") === null) {
        setUploadStatus((prev) => ({
          ...prev,
          error: "Finish onboarding first",
        }));
        return;
      }

      if (audioLanguage === "") {
        setUploadStatus((prev) => ({
          ...prev,
          error: "Select language of speech in audio",
        }));
        return;
      }

      const newFiles: UploadedFile[] = acceptedFiles.map((file) => ({
        id: crypto.randomUUID(),
        name: file.name,
        size: file.size,
        type: file.type,
        lastModified: file.lastModified,
        status: "processing",
        uploadedAt: new Date().toISOString(),
      }));

      setUploadStatus((prev) => ({
        ...prev,
        uploadedFiles: [...prev.uploadedFiles, ...newFiles],
        isUploading: true,
        error: null,
      }));

      for (let i = 0; i < acceptedFiles.length; i++) {
        const file = acceptedFiles[i];
        const fileRecord = newFiles[i];

        try {
          await handleContributeData(
            fileRecord.id,
            user.address,
            audioLanguage,
            file,
            isConnected,
          );

          setUploadStatus((prev) => ({
            ...prev,
            uploadedFiles: prev.uploadedFiles.map((f) =>
              f.id === fileRecord.id ? { ...f, status: "completed" } : f,
            ),
          }));
        } catch (err: any) {
          console.error(`Upload error for ${file.name}:`, err);

          const errorCode = err?.response?.data?.detail?.error?.code;
          let userMessage = `Cannot process ${file.name}. Try again.`;
          if (errorCode === "PROOF_OF_CONTRIBUTION_ERROR") {
            userMessage = `${file.name} is not a valid audio file.`;
          }

          setUploadStatus((prev) => ({
            ...prev,
            uploadedFiles: prev.uploadedFiles.map((f) =>
              f.id === fileRecord.id ? { ...f, status: "error" } : f,
            ),
          }));
        }
      } 
      setUploadStatus((prev) => ({
        ...prev,
        isUploading: false,
      }));
    },
    [user?.address, isConnected, audioLanguage, handleContributeData],

  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "audio/ogg": [".ogg"] },
    multiple: false,
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
          <Card className={uploadStatus.uploadedFiles.length <= 0 ? "h-[55vh] flex flex-col" : "h-[70vh] flex flex-col"}>
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
                      <p className=" text-gray-600">Processing files...</p>
                      <p className="text-sm text-gray-600">
                        You can upload multiple files
                      </p>
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
                      <p className="text-sm text-gray-500">or click to select files</p>
                      <p className="text-xs text-gray-400">
                        Only .ogg audio files are accepted
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            <div className="flex-1 overflow-y-auto overflow-x-hidden space-y-4 p-4">
              <CardContent className="space-y-4">
                {uploadStatus.error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{uploadStatus.error}</AlertDescription>
                  </Alert>
                )}

                {areAllFilesCompleted() && hasAnySuccess() && (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Upload Complete</AlertTitle>
                    <AlertDescription>
                      {
                        getAllFileContributions().filter((f) => f.isSuccess)
                          .length
                      }{" "}
                      of {getAllFileContributions().length} files processed
                      successfully.
                    </AlertDescription>
                  </Alert>
                )}

                {!isConnected && (
                  <div className="bg-yellow-50 text-yellow-800 p-2 text-xs rounded mt-2">
                    Please connect your wallet to contribute data
                  </div>
                )}
              </CardContent>
              <CardContent className="space-y-2">
                {uploadStatus.uploadedFiles.map((file) => {
                  const contribution = getFileContribution(file.id);

                  return (
                    <div
                      key={file.id}
                      className="border rounded-lg p-4 space-y-3"
                    >
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">{file.name}</span>
                        <span
                          className={`text-xs px-2 py-1 rounded ${
                            contribution?.isSuccess
                              ? "bg-green-100 text-green-800"
                              : contribution?.error && !contribution?.isSuccess
                                ? "bg-red-100 text-red-800"
                                : file.status === "processing"
                                  ? "bg-blue-100 text-blue-800"
                                  : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {file.status === "completed" && contribution?.isSuccess
                            ? "Success"
                            : file.status === "error" ||
                                (contribution?.error && !contribution?.isSuccess)
                              ? "Failed"
                              : file.status === "processing"
                                ? "Processing"
                                : "Pending"}
                        </span>
                      </div>

                      <div className="mt-3">
                        <ContributionSteps
                          currentStep={contribution?.currentStep || 0}
                          completedSteps={contribution?.completedSteps || []}
                          hasError={!!contribution?.error}
                          compact={true}
                        />
                      </div>

                      {contribution?.error && (
                        <div className="ml-4">
                          <Alert variant="destructive" className="text-xs">
                            <AlertCircle className="h-3 w-3" />
                            <AlertDescription className="text-xs">
                              {contribution.error}
                            </AlertDescription>
                          </Alert>
                        </div>
                      )}

                      {contribution?.isSuccess && contribution.shareUrl && (
                        <div className="ml-4">
                          <ContributionSuccess
                            contributionData={contribution}
                            completedSteps={contribution.completedSteps}
                            shareUrl={contribution.shareUrl}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </CardContent>
            </div>
          </Card>

        </div>
      </div>
    </div>
  );
}