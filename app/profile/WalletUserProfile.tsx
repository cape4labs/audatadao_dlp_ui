"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, Wallet, Copy, ExternalLink } from "lucide-react";
import { VanaDlpIntegration } from "../contribution/VanaDlpIntegration";
import { useWalletAuth } from "@/lib/auth/walletAuth";
import { useAccount, useDisconnect } from "wagmi";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { UserOnboarding } from "../components/UserOnboarding";
import { OggFileUpload } from "../contribution/OggFileUpload";
import { useState, useEffect } from "react";

export function WalletUserProfile() {
  const { user, isConnected, disconnect: disconnectWallet } = useWalletAuth();
  const { disconnect } = useDisconnect();
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState<boolean | null>(null);
  const [isLoadingOnboarding, setIsLoadingOnboarding] = useState(true);

  // Проверяем, прошел ли пользователь onboarding
  useEffect(() => {
    const checkOnboardingStatus = async () => {
      if (!user?.address) return;

      try {
        const response = await fetch(`/api/user/onboarding?walletAddress=${user.address}`);
        if (response.ok) {
          const data = await response.json();
          setHasCompletedOnboarding(data.hasCompletedOnboarding);
        }
      } catch (error) {
        console.error("Error checking onboarding status:", error);
        setHasCompletedOnboarding(false);
      } finally {
        setIsLoadingOnboarding(false);
      }
    };

    checkOnboardingStatus();
  }, [user?.address]);

  const handleDisconnect = () => {
    disconnect();
    disconnectWallet();
    toast.success("Wallet disconnected");
  };

  const handleOnboardingComplete = () => {
    setHasCompletedOnboarding(true);
    toast.success("Onboarding completed!");
  };

  const copyAddress = async () => {
    if (user?.address) {
      try {
        await navigator.clipboard.writeText(user.address);
        toast.success("Address copied to clipboard");
      } catch (error) {
        toast.error("Failed to copy address");
      }
    }
  };

  const getBlockExplorerUrl = (address: string) => {
    return `https://moksha.vanascan.io/address/${address}`;
  };

  if (!isConnected || !user) {
    return (
      <Card className="w-full shadow-lg">
        <CardHeader>
          <CardTitle>Not Connected</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>No wallet connected</AlertTitle>
            <AlertDescription>
              Please connect your wallet to view your profile.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  // Показываем onboarding для новых пользователей
  if (isLoadingOnboarding) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (hasCompletedOnboarding === false) {
    return <UserOnboarding onComplete={handleOnboardingComplete} />;
  }

  return (
    <div className="w-full space-y-6">
      {/* Wallet Profile Card */}
      <Card className="w-full">
        <CardHeader className="flex flex-row items-center gap-4">
          <Avatar className="h-16 w-16 border">
            <AvatarFallback className="bg-blue-100 text-blue-600">
              <Wallet className="h-8 w-8" />
            </AvatarFallback>
          </Avatar>
          <div>
            <CardTitle>Wallet Profile</CardTitle>
            <CardDescription className="flex items-center gap-2">
              Connected to VANA Network
              <Badge
                variant="outline"
                className="bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400"
              >
                Active
              </Badge>
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="pt-6 space-y-4">
          <div>
            <h3 className="text-sm font-semibold mb-2">Wallet Address</h3>
            <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <span className="font-mono text-sm flex-1">
                {user.address.slice(0, 6)}...{user.address.slice(-4)}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={copyAddress}
                className="h-8 w-8 p-0"
              >
                <Copy className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => window.open(getBlockExplorerUrl(user.address), '_blank')}
                className="h-8 w-8 p-0"
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold mb-2">Connection Information</h3>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span>Network:</span>
                <span className="font-medium">
                  {user.chainId === 14800 ? "VANA Moksha Testnet" : `Chain ID: ${user.chainId}`}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Connected:</span>
                <span className="font-medium">
                  {user.connectedAt.toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Last Activity:</span>
                <span className="font-medium">
                  {user.lastActivity.toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>

          <div className="pt-4">
            <Button
              variant="destructive"
              onClick={handleDisconnect}
              className="w-full"
            >
              Disconnect Wallet
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* OGG File Upload */}
      <div className="mt-6">
        <OggFileUpload />
      </div>
    </div>
  );
}

function ProfileSkeleton() {
  return (
    <Card className="w-full max-w-md shadow-lg">
      <CardHeader className="flex flex-row items-center gap-4">
        <Skeleton className="h-16 w-16 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-40" />
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-4 w-32" />
          <div className="space-y-2">
            <div className="flex justify-between">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-3 w-20" />
            </div>
            <Skeleton className="h-2 w-full" />
            <div className="flex justify-between">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Skeleton className="h-4 w-32" />
          <div className="space-y-2">
            <div className="flex justify-between">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-3 w-24" />
            </div>
            <div className="flex justify-between">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 