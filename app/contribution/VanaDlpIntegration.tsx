"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AlertCircle, Loader2, Upload } from "lucide-react";
import { useAccount } from "wagmi";
import { ContributionSteps } from "./ContributionSteps";
import { useContributionFlow } from "./hooks/useContributionFlow";
import { DriveInfo, UserInfo } from "./types";
import { useWalletAuth } from "@/lib/auth/walletAuth";


/**
 * VanaDlpIntegration component for users to contribute data to VANA's Data Liquidity Pools
 */
export function VanaDlpIntegration() {
  // Para connection
  const { isConnected } = useAccount();
  const { user } = useWalletAuth();
  const {
    isSuccess,
    error,
    currentStep,
    completedSteps,
    contributionData,
    shareUrl,
    isLoading,
    isSigningMessage,
    handleContributeData,
    resetFlow,
  } = useContributionFlow();


    resetFlow();

  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Contribute to Data Liquidity Pools</CardTitle>
        <CardDescription>
          Share your Google account data to earn rewards from VANA Data
          Liquidity Pools
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
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

            {/* Display user data summary */}
            {userInfo && (
              <ContributionSummary
                userInfo={userInfo as UserInfo}
                driveInfo={driveInfo as DriveInfo}
                isEncrypted={false}
              />
            )}

            <Button
              onClick={handleContribute}
              disabled={isLoading || !isConnected || !userInfo}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {currentStep === 1
                    ? "Uploading to Pinata..."
                    : currentStep === 2
                    ? isSigningMessage
                      ? "Signing message..."
                      : "Adding to blockchain..."
                    : currentStep === 3
                    ? "Requesting TEE proof..."
                    : currentStep === 4
                    ? "Processing proof..."
                    : currentStep === 5
                    ? "Claiming reward..."
                    : "Processing..."}
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Contribute Google Data
                </>
              )}
            </Button>

            {!isConnected && (
              <ConnectWalletButton
                isOpen={isOpen}
                openModal={openModal}
                closeModal={closeModal}
              />
            )}

            {!userInfo && (
              <div className="bg-yellow-50 text-yellow-800 p-2 text-xs rounded mt-2">
                Sign in with Google to contribute your data
              </div>
            )}
          </div>
        )}
      </CardContent>
      <CardFooter className="text-xs text-muted-foreground">
        Your data is encrypted and securely stored in your Google Drive. You
        maintain control over who can access it.
      </CardFooter>
    </Card>
  );
)