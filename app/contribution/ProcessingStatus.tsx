"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ContributionSteps } from "./ContributionSteps";
import { useWalletAuth } from "@/lib/auth/walletAuth";
import { toast } from "sonner";

interface ProcessingStatusProps {
  onComplete: () => void;
}

export function ProcessingStatus({ onComplete }: ProcessingStatusProps) {
  const { user } = useWalletAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [isProcessing, setIsProcessing] = useState(true);

  useEffect(() => {
    if (!user?.address) return;

    const processSteps = async () => {
      try {
        // Шаг 1: Регистрация в блокчейне
        setCurrentStep(2);
        await new Promise(resolve => setTimeout(resolve, 2000)); // Симуляция
        setCompletedSteps([1, 2]);

        // Шаг 2: Запрос валидации
        setCurrentStep(3);
        await new Promise(resolve => setTimeout(resolve, 3000)); // Симуляция
        setCompletedSteps([1, 2, 3]);

        // Шаг 3: Валидация вложения
        setCurrentStep(4);
        await new Promise(resolve => setTimeout(resolve, 4000)); // Симуляция
        setCompletedSteps([1, 2, 3, 4]);

        // Шаг 4: Получение аттестации
        setCurrentStep(5);
        await new Promise(resolve => setTimeout(resolve, 2000)); // Симуляция
        setCompletedSteps([1, 2, 3, 4, 5]);

        setIsProcessing(false);
        toast.success("Contribution processed successfully!");
        onComplete();
      } catch (error) {
        console.error("Processing error:", error);
        toast.error("Failed to process contribution");
      }
    };

    processSteps();
  }, [user?.address, onComplete]);

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
        
        {!isProcessing && (
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <h3 className="text-green-800 font-medium">Processing Complete!</h3>
            <p className="text-green-600 text-sm mt-1">
              Your contribution has been successfully processed and registered on the blockchain.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 