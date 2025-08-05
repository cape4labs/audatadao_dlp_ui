"use client";

import { useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ContributionSteps } from "./ContributionSteps";
import { useContributionFlow } from "./hooks/useContributionFlow"; // ваш хук управления шагами
import { toast } from "sonner";

interface ProcessingStatusProps {
  onComplete: () => void;
}

export function ProcessingStatus({ onComplete }: ProcessingStatusProps) {

  // Получаем шаги и статусы из хука (или через пропсы, если flow выше)
  const {
    currentStep,
    completedSteps,
    error,
    isSuccess,
  } = useContributionFlow();

  useEffect(() => {
    if (isSuccess) {
      toast.success("Contribution processed successfully!");
      onComplete();
    }
    if (error) {
      toast.error(error);
    }
  }, [isSuccess, error, onComplete]);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Processing Your Contribution</CardTitle>
        <CardDescription>
          Your voice data is being processed and registered on the VANA network
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ContributionSteps 
          currentStep={currentStep}
          completedSteps={completedSteps}
        />
        
        {isSuccess && (
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <h3 className="text-green-800 font-medium">Processing Complete!</h3>
            <p className="text-green-600 text-sm mt-1">
              Your contribution has been successfully processed and registered on the blockchain.
            </p>
          </div>
        )}
        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <h3 className="text-red-800 font-medium">Processing Error</h3>
            <p className="text-red-600 text-sm mt-1">
              {error}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}