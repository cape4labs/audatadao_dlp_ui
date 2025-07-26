"use client";

import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { WalletLoginButton } from "./auth/WalletLoginButton";
import { WalletUserProfile } from "./profile/WalletUserProfile";
import { useWalletAuth } from "@/lib/auth/walletAuth";

export default function Home() {
  const { isConnected, disconnect } = useWalletAuth();

  const handleSignOut = () => {
    disconnect();
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

      <main className="flex-1 container mx-auto px-4 py-8 flex flex-col items-center justify-center">
        {isConnected ? (
          <div className="w-full max-w-2xl flex justify-center">
            <WalletUserProfile />
          </div>
        ) : (
          <div className="flex flex-col items-center text-center space-y-8 max-w-2xl">
            <div className="space-y-4">
              <h2 className="text-3xl font-bold tracking-tight">
                VANA Data Liquidity Pool Demo
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-400">
                Connect your wallet to contribute your data to the VANA network. 
                Your data will be encrypted and stored securely on the blockchain.
              </p>
            </div>

            <div className="bg-gray-50 dark:bg-gray-900 p-6 rounded-lg w-full max-w-md space-y-4 text-center">
              <div className="space-y-2">
                <h3 className="font-semibold">How it works:</h3>
                <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  <li>• Connect your EVM wallet</li>
                  <li>• Your data is encrypted client-side</li>
                  <li>• Encrypted data is stored on IPFS</li>
                  <li>• A pointer to your data is registered with VANA</li>
                </ul>
              </div>

              <div className="pt-4 flex justify-center">
                <WalletLoginButton />
              </div>
            </div>
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
