"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileAudio, User, Wallet, Calendar, Download, RefreshCw, AlertCircle } from "lucide-react";
import { useWalletAuth } from "@/lib/auth/walletAuth";
import { useLocalStorage } from "./contribution/hooks/useLocalStorage";
import { Navigation } from "./components/Navigation";
import { UserOnboarding } from "./components/UserOnboarding";
import { toast } from "sonner";
import { WalletLoginButton } from "./auth/WalletLoginButton";

interface LocalFile {
  id: string;
  name: string;
  size: number;
  type: string;
  lastModified: number;
  status: 'pending' | 'processing' | 'completed' | 'error';
  uploadedAt: string;
  fileHash?: string;
}

interface OnboardingData {
  country: string;
  birthMonth: string;
  birthYear: string;
  isItRelated: boolean;
}

export default function Home() {
  const { user } = useWalletAuth();
  const { getFilesFromLocalStorage, getFileFromLocalStorage, removeFileFromLocalStorage } = useLocalStorage();
  const [files, setFiles] = useState<LocalFile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [onboardingData, setOnboardingData] = useState<OnboardingData | null>(null);
  const [onboardingLoading, setOnboardingLoading] = useState(true);

  // Загрузка файлов
  const loadFiles = async () => {
    if (!user?.address) return;
    setIsLoading(true);
    try {
      const uploadedFiles = getFilesFromLocalStorage(user.address);
      setFiles(uploadedFiles);
    } catch (error) {
      console.error('Error loading files:', error);
      toast.error('Failed to load uploaded files');
    } finally {
      setIsLoading(false);
    }
  };

  // Загрузка данных опроса
  const loadOnboarding = async () => {
    if (!user?.address) return;
    setOnboardingLoading(true);
    try {
      // Try local storage first
      const localData = localStorage.getItem(`user_onboarding_${user.address}`);
      if (localData) {
        const parsedData = JSON.parse(localData);
        setOnboardingData(parsedData);
        setOnboardingLoading(false);
        return;
      }

      // Fallback to external API
      const res = await fetch(`https://audata.space:8000/api/v1/users/metadata?walletAddress=${user.address}`);
      if (res.ok) {
        const data = await res.json();
        setOnboardingData(data.onboardingData);
      }
    } catch (e) {
      setOnboardingData(null);
    } finally {
      setOnboardingLoading(false);
    }
  };

  useEffect(() => {
    if (user?.address) {
      loadFiles();
      loadOnboarding();
    }
  }, [user?.address]);



  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const downloadFile = (file: LocalFile) => {
    try {
      const localFile = getFileFromLocalStorage(user!.address, file.id);
      if (localFile && localFile.data) {
        // Convert base64 back to blob
        const byteCharacters = atob(localFile.data);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: localFile.type });
        
        // Create download link
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = localFile.name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        
        toast.success('File downloaded successfully');
      }
    } catch (error) {
      console.error('Error downloading file:', error);
      toast.error('Failed to download file');
    }
  };

  const deleteFile = (fileId: string) => {
    try {
      removeFileFromLocalStorage(user!.address, fileId);
      loadFiles(); // Reload files list
      toast.success('File deleted successfully');
    } catch (error) {
      console.error('Error deleting file:', error);
      toast.error('Failed to delete file');
    }
  };

  if (!user?.address) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto space-y-6">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Wallet Required</AlertTitle>
              <AlertDescription>
                Please connect your wallet to view your profile.
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

  if (onboardingLoading) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navigation />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-gray-500">Loading profile...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* User Profile Header */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                User Profile
              </CardTitle>
              <CardDescription>
                Your VANA DLP contribution profile and statistics
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="flex items-center gap-3 p-4 border rounded-lg">
                  <Wallet className="h-5 w-5 text-blue-500" />
                  <div>
                    <p className="text-sm font-medium">Wallet Address</p>
                    <p className="text-xs text-gray-500 font-mono">
                      {user.address.slice(0, 6)}...{user.address.slice(-4)}
              </p>
            </div>
              </div>

                <div className="flex items-center gap-3 p-4 border rounded-lg">
                  <FileAudio className="h-5 w-5 text-green-500" />
                  <div>
                    <p className="text-sm font-medium">Files Uploaded</p>
                    <p className="text-lg font-bold">{files.length}</p>
            </div>
          </div>
                
                <div className="flex items-center gap-3 p-4 border rounded-lg">
                  <Calendar className="h-5 w-5 text-purple-500" />
                  <div>
                    <p className="text-sm font-medium">Member Since</p>
                    <p className="text-xs text-gray-500">
                      {new Date().toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {/* Данные опроса */}
                <div className="flex flex-col gap-2 p-4 border rounded-lg">
                  <p className="text-sm font-medium">Onboarding Data</p>
                  <div className="text-xs text-gray-700">
                    {onboardingData ? (
                      <>
                        <div>Country: <b>{onboardingData.country}</b></div>
                        <div>Birth: <b>{onboardingData.birthMonth} {onboardingData.birthYear}</b></div>
                        <div>IT Related: <b>{onboardingData.isItRelated ? 'Yes' : 'No'}</b></div>
                      </>
                    ) : (
                      <div className="text-gray-500">Not completed yet</div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Uploaded Files */}
          <Card>
                      <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                        <CardTitle className="flex items-center gap-2">
                    <FileAudio className="h-5 w-5" />
                    Uploaded Files
                        </CardTitle>
                        <CardDescription>
                    Your voice data files stored locally
                        </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={loadFiles}
                  disabled={isLoading}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>
                      </CardHeader>
                      <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="h-6 w-6 animate-spin text-blue-500" />
                  <span className="ml-2 text-sm text-gray-600">Loading files...</span>
                </div>
              ) : files.length === 0 ? (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>No Files Found</AlertTitle>
                  <AlertDescription>
                    You haven't uploaded any voice files yet. 
                    Go to the upload page to contribute your voice data.
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-3">
                  {files.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-4 border rounded-lg bg-gray-50"
                    >
                      <div className="flex items-center gap-3">
                        <FileAudio className="h-5 w-5 text-blue-500" />
                        <div>
                          <p className="font-medium text-sm">
                            {file.name}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="secondary" className="text-xs">
                              {formatFileSize(file.size)}
                            </Badge>
                            <span className={`text-xs px-2 py-1 rounded ${
                              file.status === 'completed' ? 'bg-green-100 text-green-800' :
                              file.status === 'processing' ? 'bg-yellow-100 text-yellow-800' :
                              file.status === 'error' ? 'bg-red-100 text-red-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {file.status}
                            </span>
                            <span className="text-xs text-gray-500">
                              {formatDate(file.uploadedAt)}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteFile(file.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
                      </CardContent>
                    </Card>

          {/* Onboarding Form - показываем только если опрос не пройден */}
          {!onboardingData && (
            <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <User className="h-5 w-5" />
                  Complete Your Profile
                        </CardTitle>
                        <CardDescription>
                  Please provide some information to help us personalize your experience
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                <UserOnboarding onComplete={loadOnboarding} />
                      </CardContent>
                    </Card>
        )}
        </div>
      </div>
    </div>
  );
}
