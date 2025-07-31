"use client";

import { useState, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Upload, FileAudio, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { useDropzone } from "react-dropzone";
import { toast } from "sonner";
import { useWalletAuth } from "@/lib/auth/walletAuth";
import { useStorjIntegration } from "./hooks/useStorjIntegration";
import { useBlockchainIntegration } from "./hooks/useBlockchainIntegration";

interface UploadedFile {
  name: string;
  size: number;
  type: string;
  lastModified: number;
}

interface UploadStatus {
  isUploading: boolean;
  isSuccess: boolean;
  error: string | null;
  uploadedFiles: UploadedFile[];
}

export function OggFileUpload({ onUploadComplete }: { onUploadComplete: () => void }) {
  const { user } = useWalletAuth();
  const { uploadToStorj, generateFileHash, isUploading: isStorjUploading } = useStorjIntegration();
  const { registerDataOnBlockchain, isRegistering, transactionHash } = useBlockchainIntegration();
  
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>({
    isUploading: false,
    isSuccess: false,
    error: null,
    uploadedFiles: [],
  });

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (!user?.address) {
      toast.error("Please connect your wallet first");
      return;
    }

    // Фильтруем только .ogg файлы
    const oggFiles = acceptedFiles.filter(file => 
      file.type === "audio/ogg" || file.name.toLowerCase().endsWith('.ogg')
    );

    if (oggFiles.length === 0) {
      toast.error("Please select only .ogg audio files");
      return;
    }

    setUploadStatus(prev => ({
      ...prev,
      isUploading: true,
      error: null,
    }));

    try {
      for (const file of oggFiles) {
        // Шаг 1: Загружаем файл в Storj
        const storjResult = await uploadToStorj(file, user.address);
        
        if (!storjResult.success) {
          throw new Error(storjResult.error || 'Failed to upload to Storj');
        }

        // Шаг 2: Генерируем метаданные для блокчейна
        const metadata = JSON.stringify({
          fileName: file.name,
          fileSize: file.size,
          walletAddress: user.address,
          uploadedAt: new Date().toISOString(),
          fileType: 'audio/ogg',
        });

        // Шаг 3: Регистрируем данные в блокчейне
        await registerDataOnBlockchain({
          fileHash: storjResult.fileHash,
          fileUrl: storjResult.fileUrl,
          metadata: metadata,
          walletAddress: user.address,
        });

        // Шаг 4: Отправляем в refiner
        await uploadFileToRefiner(file, storjResult.fileUrl);
      }

      setUploadStatus(prev => ({
        ...prev,
        isUploading: false,
        isSuccess: true,
        uploadedFiles: [...prev.uploadedFiles, ...oggFiles.map(file => ({
          name: file.name,
          size: file.size,
          type: file.type,
          lastModified: file.lastModified,
        }))],
      }));

      toast.success(`${oggFiles.length} file(s) processed successfully!`);
      onUploadComplete();
    } catch (error) {
      console.error("Upload error:", error);
      setUploadStatus(prev => ({
        ...prev,
        isUploading: false,
        error: "Failed to process files. Please try again.",
      }));
      toast.error("Failed to process files");
    }
  }, [user?.address, uploadToStorj, registerDataOnBlockchain]);

  const uploadFileToRefiner = async (file: File, storjUrl: string) => {
    // Получаем данные пользователя из onboarding (если есть)
    let userData = null;
    try {
      const onboardingResponse = await fetch(`/api/user/onboarding?walletAddress=${user!.address}`);
      if (onboardingResponse.ok) {
        const onboardingData = await onboardingResponse.json();
        if (onboardingData.onboardingData) {
          userData = onboardingData.onboardingData;
        }
      }
    } catch (error) {
      console.log('No onboarding data found, using defaults', error);
    }

    // Создаем FormData для загрузки файла
    const formData = new FormData();
    formData.append('file', file);
    formData.append('walletAddress', user!.address);
    formData.append('storjUrl', storjUrl);
    if (userData) {
      formData.append('userData', JSON.stringify(userData));
    }

    const response = await fetch('/api/refine/upload', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Refiner upload failed: ${response.statusText}`);
    }

    const result = await response.json();
    console.log('Refiner upload result:', result);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'audio/ogg': ['.ogg'],
    },
    multiple: true,
    disabled: uploadStatus.isUploading,
  });

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileAudio className="h-5 w-5" />
          Upload Audio Files (.ogg)
        </CardTitle>
        <CardDescription>
          Upload your .ogg audio files to contribute to the VANA network. 
          Files will be processed and sent to the refiner for analysis.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {uploadStatus.error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Upload Error</AlertTitle>
            <AlertDescription>{uploadStatus.error}</AlertDescription>
          </Alert>
        )}

        {uploadStatus.isSuccess && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertTitle>Processing Complete</AlertTitle>
            <AlertDescription>
              {uploadStatus.uploadedFiles.length} file(s) processed successfully!
              {transactionHash && (
                <div className="mt-2 text-sm">
                  <strong>Blockchain Transaction:</strong> {transactionHash}
                </div>
              )}
            </AlertDescription>
          </Alert>
        )}

        {(isStorjUploading || isRegistering) && (
          <Alert>
            <Loader2 className="h-4 w-4 animate-spin" />
            <AlertTitle>Processing Files</AlertTitle>
            <AlertDescription>
              {isStorjUploading && "Uploading to Storj..."}
              {isRegistering && "Registering on blockchain..."}
            </AlertDescription>
          </Alert>
        )}

        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
            isDragActive
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-300 hover:border-gray-400'
          } ${uploadStatus.isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <input {...getInputProps()} />
          <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          {uploadStatus.isUploading ? (
            <div className="space-y-2">
              <Loader2 className="mx-auto h-8 w-8 animate-spin text-blue-500" />
              <p className="text-sm text-gray-600">Uploading files...</p>
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

        {uploadStatus.uploadedFiles.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium">Uploaded Files:</h4>
            <div className="space-y-1">
              {uploadStatus.uploadedFiles.map((file, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <div className="flex items-center gap-2">
                    <FileAudio className="h-4 w-4 text-blue-500" />
                    <span className="text-sm font-medium">{file.name}</span>
                  </div>
                  <span className="text-xs text-gray-500">
                    {formatFileSize(file.size)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {!user?.address && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Wallet Required</AlertTitle>
            <AlertDescription>
              Please connect your wallet to upload files.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
} 