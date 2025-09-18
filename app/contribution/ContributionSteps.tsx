// ContributionSteps.tsx
import React from "react";
import {
  CheckCircle,
  Loader2,
  LockKeyhole,
  BlocksIcon,
  Server,
  Award,
  XCircle,
} from "lucide-react";

export type Step = {
  id: number;
  title: string;
  description: string;
  icon: React.ReactNode;
  // Message shown while step is in progress
  statusMessage: string;
  // Optional message shown when signing is in progress
  signingMessage?: string;
};

export type StepStatus = "pending" | "current" | "complete" | "error";

export const contributionSteps: Step[] = [
  {
    id: 1,
    title: "Process file to Pinata",
    description: "Encrypting and processing your file to Pinata",
    icon: <LockKeyhole className="h-5 w-5" />,
    statusMessage: "Uploading file...",
    signingMessage: "Signing message...",
  },
  {
    id: 2,
    title: "Register on Blockchain",
    description: "Recording encrypted data on the VANA network",
    icon: <BlocksIcon className="h-5 w-5" />,
    statusMessage: "Adding to blockchain...",
  },
  {
    id: 3,
    title: "Validate Contribution",
    description: "Proving audios have real value and uniqueness",
    icon: <Server className="h-5 w-5" />,
    statusMessage: "Checking that your audio is valid...",
  },
  {
    id: 4,
    title: "Refine Submitted Data",
    description: "Converting data to libsql format",
    icon: <Server className="h-5 w-5" />,
    statusMessage: "Running refiner...",
  },
  {
    id: 5,
    title: "Receive Attestation",
    description: "Recording validation proof on-chain",
    icon: <Award className="h-5 w-5" />,
    statusMessage: "Recording proof on-chain...",
  },
];

interface ContributionStepsProps {
  currentStep: number;
  completedSteps: number[];
  hasError?: boolean;
  compact?: boolean; // Optional prop for compact display
}

export function ContributionSteps({
  currentStep,
  completedSteps,
  hasError = false,
  compact = false,
}: ContributionStepsProps) {
  const getStepStatus = (stepId: number): StepStatus => {
    if (completedSteps.includes(stepId)) return "complete";
    if (currentStep === stepId) return hasError ? "error" : "current";
    return "pending";
  };

  const renderStatusIcon = (status: StepStatus, stepId: number) => {
    switch (status) {
      case "complete":
        return <CheckCircle className="h-4 w-4" />;
      case "current":
        return <Loader2 className="h-4 w-4 animate-spin" />;
      case "error":
        return <XCircle className="h-4 w-4" />;
      default:
        return <span className="text-xs font-medium">{stepId}</span>;
    }
  };

  const getConnectorHeight = () => {
    if (compact) return "h-6"; // Shorter for compact view
    return "h-8"; // Default height
  };

  return (
    <div className={compact ? "py-2" : "py-4"}>
      {contributionSteps.map((step, i) => {
        const status = getStepStatus(step.id);
        const isLast = i === contributionSteps.length - 1;
        
        return (
          <div key={step.id} className={`flex ${compact ? "mb-2" : "mb-4"} last:mb-0`}>
            {/* Step indicator */}
            <div className="mr-4 flex flex-col items-center">
              <div
                className={`flex items-center justify-center w-8 h-8 rounded-full aspect-square ${
                  status === "complete"
                    ? "bg-green-100 text-green-600"
                    : status === "current"
                      ? "bg-blue-100 text-blue-600"
                      : status === "error"
                        ? "bg-red-100 text-red-600"
                        : "bg-gray-100 text-gray-500"
                }`}
              >
                {renderStatusIcon(status, step.id)}
              </div>
              {/* Connector line (except for last item) */}
              {!isLast && (
                <div className={`w-0.5 bg-gray-200 my-1 ${getConnectorHeight()}`}></div>
              )}
            </div>
            {/* Step content */}
            <div className="flex-1">
              <h3 className={`font-medium ${compact ? "text-xs" : "text-sm"}`}>
                {step.title}
              </h3>
              <p className="text-xs text-muted-foreground">
                {step.description}
              </p>
              {status === "current" && (
                <p className="text-xs text-blue-600 mt-1 flex items-center">
                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                  {step.statusMessage}
                </p>
              )}
              {status === "error" && (
                <p className="text-xs text-red-600 mt-1 flex items-center">
                  <XCircle className="h-3 w-3 mr-1" />
                  Failed
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function getStepMessage(
  stepId: number,
  isSigning: boolean = false,
): string {
  const step = contributionSteps.find((s) => s.id === stepId);

  if (!step) {
    return "Processing...";
  }

  if (isSigning && step.signingMessage) {
    return step.signingMessage;
  }

  return step.statusMessage;
}

export function getStepById(stepId: number): Step | undefined {
  return contributionSteps.find((s) => s.id === stepId);
}