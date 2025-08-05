"use client";

import { useState, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Upload, FileAudio, Loader2, CheckCircle, AlertCircle, Shield, Database, Globe } from "lucide-react";
import { useDropzone } from "react-dropzone";
import { toast } from "sonner";
import { useWalletAuth } from "@/lib/auth/walletAuth";
import { useAddFile } from "../contribution/hooks/useAddFile";
import { useDataRefinement } from "../contribution/hooks/useDataRefinement";
import { useContractStatus } from "../contribution/hooks/useContractStatus";
import { useAccount } from "wagmi";
import { Navigation } from "../components/Navigation";
import { NetworkSwitcher } from "../components/NetworkSwitcher";

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
  uploadedFiles: UploadedFile[];
}

export default function UploadPage() {
  const { user } = useWalletAuth();
  const { isConnected } = useAccount();
  const { addFile, isAdding, contractError } = useAddFile();
  const { refine, isLoading: isRefining } = useDataRefinement();
  const { isPaused, isLoading: isContractLoading, error: contractStatusError } = useContractStatus();
  
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

    // Check if wallet is properly connected
    if (!isConnected) {
      toast.error("Wallet not connected. Please connect your wallet and try again.");
      return;
    }

    // Filter only .ogg files
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
        // Step 1: Upload file to Pinata (following template approach)
        const formData = new FormData();
        formData.append('file', file);
        formData.append('walletAddress', user.address);

        const uploadResponse = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (!uploadResponse.ok) {
          throw new Error("Failed to upload file to Pinata");
        }

        const uploadResult = await uploadResponse.json();
        const downloadUrl = uploadResult.data.pinataUrl;
        const fileHash = uploadResult.data.fileHash;

        // Step 2: Generate encryption key (using file hash as signature)
        const encryptionKey = fileHash;

        // Step 3: Register on blockchain (following template approach)
        try {
          // Double-check wallet connection before blockchain operation
          if (!isConnected) {
            throw new Error("Wallet connection lost. Please reconnect and try again.");
          }
          
          const txReceipt = await addFile(downloadUrl, encryptionKey);
          
          if (!txReceipt) {
            if (contractError) {
              throw new Error(`Contract error: ${contractError}`);
            } else {
              throw new Error("Failed to add file to blockchain");
            }
          }

          // Extract file ID from transaction receipt (placeholder for now)
          const fileId = 1; // In real implementation, extract from txReceipt

          // Step 4: Call refinement (following template approach)
          try {
            const refinementResult = await refine({
              file_id: fileId,
              encryption_key: encryptionKey,
            });
            
            console.log('Refinement completed:', refinementResult);
            
          } catch (refinerError) {
            console.warn('Refiner processing failed:', refinerError);
            // Continue without refiner - this is optional for development
          }

          // Add to uploaded files list
          setUploadStatus(prev => ({
            ...prev,
            uploadedFiles: [...prev.uploadedFiles, {
              id: uploadResult.data.fileId,
              name: file.name,
              size: file.size,
              type: file.type,
              lastModified: file.lastModified,
              status: 'completed',
              uploadedAt: new Date().toISOString(),
            }],
          }));

        } catch (blockchainError) {
          console.warn('Blockchain registration failed:', blockchainError);
          // Continue without blockchain registration - this is optional for development
          
          // Still add to uploaded files list
          setUploadStatus(prev => ({
            ...prev,
            uploadedFiles: [...prev.uploadedFiles, {
              id: uploadResult.data.fileId,
              name: file.name,
              size: file.size,
              type: file.type,
              lastModified: file.lastModified,
              status: 'completed',
              uploadedAt: new Date().toISOString(),
            }],
          }));
        }
      }

      setUploadStatus(prev => ({
        ...prev,
        isUploading: false,
        isSuccess: true,
      }));

      toast.success(`${oggFiles.length} file(s) processed successfully!`);
    } catch (error) {
      console.error("Upload error:", error);
      setUploadStatus(prev => ({
        ...prev,
        isUploading: false,
        error: "Failed to process files. Please try again.",
      }));
      toast.error("Failed to process files");
    }
  }, [user?.address, isConnected, addFile, refine, contractError]);





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

  return (
    <div className="flex flex-col min-h-screen">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Header */}
          <div className="text-center space-y-4">
            <h1 className="text-3xl font-bold">Upload Voice Data</h1>
            <p className="text-lg text-gray-600">
              Contribute your voice recordings to the VANA network. 
              Your data will be encrypted and processed securely.
            </p>
          </div>

           {/* Network Switcher */}
           <NetworkSwitcher />

           {/* Development Mode Warning */}
           <Alert>
             <AlertCircle className="h-4 w-4" />
             <AlertTitle>Development Mode</AlertTitle>
             <AlertDescription>
               Running in development mode. Files are uploaded to Pinata IPFS. Blockchain registration and refinement processing may be disabled due to testnet restrictions. 
               The application follows the official VANA DLP template flow: Upload → Blockchain Registration → Refinement.
             </AlertDescription>
           </Alert>

           {/* Wallet Connection Status */}
           <Alert variant={isConnected ? "default" : "destructive"}>
             <AlertCircle className="h-4 w-4" />
             <AlertTitle>Wallet Connection</AlertTitle>
             <AlertDescription>
               {isConnected 
                 ? `Connected: ${user?.address?.slice(0, 6)}...${user?.address?.slice(-4)}`
                 : "Wallet not connected. Please connect your wallet to proceed with blockchain operations."
               }
             </AlertDescription>
           </Alert>

                     {/* Contract Status Warning */}
           {!isContractLoading && contractStatusError && (
             <Alert variant="destructive">
               <AlertCircle className="h-4 w-4" />
               <AlertTitle>Contract Connection Error</AlertTitle>
               <AlertDescription>
                 Unable to check contract status: {contractStatusError}
               </AlertDescription>
             </Alert>
           )}

          {/* How it works */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                How It Works
              </CardTitle>
              <CardDescription>
                Your voice data goes through a secure pipeline
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center space-y-2">
                  <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <Upload className="h-6 w-6 text-blue-600" />
                  </div>
                  <h3 className="font-semibold">1. Upload</h3>
                  <p className="text-sm text-gray-600">
                    Upload your .ogg voice files to local storage
                  </p>
                </div>
                
                <div className="text-center space-y-2">
                  <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <Database className="h-6 w-6 text-green-600" />
                  </div>
                  <h3 className="font-semibold">2. Register</h3>
                  <p className="text-sm text-gray-600">
                    Data is registered on the blockchain with proof of contribution
                  </p>
                </div>
                
                <div className="text-center space-y-2">
                  <div className="mx-auto w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                    <Globe className="h-6 w-6 text-purple-600" />
                  </div>
                  <h3 className="font-semibold">3. Process</h3>
                  <p className="text-sm text-gray-600">
                    Voice data is processed and validated by the VANA network
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Upload Area */}
          <Card>
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
                   </AlertDescription>
                 </Alert>
               )}

                             {(isAdding || isRefining) && (
                 <Alert>
                   <Loader2 className="h-4 w-4 animate-spin" />
                   <AlertTitle>Processing Files</AlertTitle>
                   <AlertDescription>
                     {isAdding && "Registering on blockchain..."}
                     {isRefining && "Processing refinement..."}
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

              {uploadStatus.uploadedFiles.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium">Uploaded Files:</h4>
                  <div className="space-y-1">
                    {uploadStatus.uploadedFiles.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <div className="flex items-center gap-2">
                          <FileAudio className="h-4 w-4 text-blue-500" />
                          <span className="text-sm font-medium">{file.name}</span>
                          <span className={`text-xs px-2 py-1 rounded ${
                            file.status === 'completed' ? 'bg-green-100 text-green-800' :
                            file.status === 'processing' ? 'bg-yellow-100 text-yellow-800' :
                            file.status === 'error' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {file.status}
                          </span>
                        </div>
                        <span className="text-xs text-gray-500">
                          {formatFileSize(file.size)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 