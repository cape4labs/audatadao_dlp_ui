"use client";

import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { WalletLoginButton } from "./auth/WalletLoginButton";
import { useWalletAuth } from "@/lib/auth/walletAuth";
import { UserOnboarding } from "./components/UserOnboarding";
import { OggFileUpload } from "./contribution/OggFileUpload";
import { ProcessingStatus } from "./contribution/ProcessingStatus";
import { useState } from "react";

export default function Home() {
  const { isConnected, disconnect } = useWalletAuth();
  const [onboardingCompleted, setOnboardingCompleted] = useState(false);
  const [filesUploaded, setFilesUploaded] = useState(false);

  const handleSignOut = () => {
    disconnect();
    setOnboardingCompleted(false);
    setFilesUploaded(false);
  };

  const handleOnboardingComplete = () => {
    setOnboardingCompleted(true);
  };

  const handleFilesUploaded = () => {
    setFilesUploaded(true);
  };

  return (
    <div className="flex flex-col min-h-screen">
      <header className="border-b bg-white dark:bg-black py-4">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <h1 className="text-xl font-bold">VANA DLP Demo</h1>
          {isConnected && (
            <Button
              variant="ghost"
              size="sm"
              className="flex items-center gap-1"
              onClick={handleSignOut}
            >
              <LogOut className="h-4 w-4" />
              <span>Disconnect</span>
            </Button>
          )}
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-8">
        {!isConnected ? (
          <div className="flex flex-col items-center text-center space-y-8 max-w-2xl mx-auto">
            <div className="space-y-4">
              <h2 className="text-3xl font-bold tracking-tight">
                VANA Data Liquidity Pool Demo
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-400">
                Connect your wallet to contribute your voice data to the VANA network. 
                Your data will be encrypted and processed securely.
              </p>
            </div>

            <div className="bg-gray-50 dark:bg-gray-900 p-6 rounded-lg w-full max-w-md space-y-4 text-center">
              <div className="space-y-2">
                <h3 className="font-semibold">How it works:</h3>
                <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  <li>• Connect your EVM wallet</li>
                  <li>• Complete onboarding survey</li>
                  <li>• Upload your voice recordings (.ogg)</li>
                  <li>• Data is processed and registered on blockchain</li>
                </ul>
              </div>

              <div className="pt-4 flex justify-center">
                <WalletLoginButton />
              </div>
            </div>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto space-y-8">
            {/* Onboarding */}
            {!onboardingCompleted && (
              <div className="space-y-4">
                <h2 className="text-2xl font-bold">Welcome! Let's get started</h2>
                <UserOnboarding onComplete={handleOnboardingComplete} />
              </div>
            )}

            {/* File Upload */}
            {onboardingCompleted && !filesUploaded && (
              <div className="space-y-4">
                <h2 className="text-2xl font-bold">Upload Your Voice Data</h2>
                <OggFileUpload onUploadComplete={handleFilesUploaded} />
              </div>
            )}

            {/* Processing Status */}
            {filesUploaded && (
              <div className="space-y-4">
                <ProcessingStatus onComplete={() => {
                  // Можно добавить дополнительную логику после завершения обработки
                  console.log("Processing completed");
                }} />
              </div>
            )}
          </div>
        )}
      </main>

      <footer className="border-t py-6 text-center text-sm text-gray-500 dark:text-gray-400">
        <div className="container mx-auto px-4">
          <p>This app demonstrates VANA DLP integration with wallet authentication</p>
        </div>
      </footer>
    </div>
  );
}
