import { CheckCircle, ExternalLink } from "lucide-react";
import { ContributionSteps } from "./ContributionSteps";
import { ContributionSummary } from "./ContributionSummary";
import { ContributionData, DriveInfo, UserInfo } from "./types";
import { getTransactionUrl } from "../../contracts/chains";

type ContributionSuccessProps = {
  contributionData: ContributionData;
  completedSteps: number[];
  shareUrl?: string;
  userInfo?: UserInfo;
};

export function ContributionSuccess({
  contributionData,
  completedSteps,
  userInfo,
}: ContributionSuccessProps) {
  // Determine how many steps were completed
  const fullyCompleted = completedSteps.includes(5);
  const proofCompleted = completedSteps.includes(4);
  const proofRequested = completedSteps.includes(3);

  return (
    <div className="space-y-4">
      <div className="bg-green-50 p-4 rounded-md flex items-center">
        <CheckCircle className="h-6 w-6 text-green-600 mr-3" />
        <div>
          <h3 className="font-medium text-green-800">
            Contribution Successful!
          </h3>
          <p className="text-sm text-green-700">
            {fullyCompleted
              ? "Your data has been successfully contributed and your reward has been claimed."
              : proofCompleted
                ? "Your data has been successfully contributed and verified by the TEE."
                : proofRequested
                  ? "Your data has been contributed and proof request has bCoeen submitted."
                  : "Your data has been successfully contributed to the blockchain."}
          </p>
        </div>
      </div>

      <div className="space-y-3 bg-slate-50 p-4 rounded-md text-sm">
        <h3 className="font-medium">Contribution Details</h3>

        <div className="grid grid-cols-2 gap-2">
          <div className="text-muted-foreground">File ID</div>
          <div className="font-mono text-xs truncate">
            {contributionData.contributionId || "Processing..."}
          </div>

          <div className="text-muted-foreground">Transaction Hash</div>
          <div className="font-mono text-xs truncate flex items-center">
            <span className="truncate">
              {contributionData.transactionReceipt?.hash || "Pending..."}
            </span>
            {contributionData.transactionReceipt?.hash && (
              <a
                href={getTransactionUrl(
                  contributionData.transactionReceipt.hash,
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 ml-1"
              >
                <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>

          {proofRequested && (
            <>
              <div className="text-muted-foreground">TEE Job ID</div>
              <div className="font-mono text-xs truncate">
                {contributionData.teeJobId || "Processing..."}
              </div>
            </>
          )}

          {fullyCompleted && (
            <>
              <div className="text-muted-foreground">Reward Transaction</div>
              <div className="font-mono text-xs truncate flex items-center">
                <span className="truncate">
                  {contributionData.rewardTxHash || "Pending..."}
                </span>
                {contributionData.rewardTxHash && (
                  <a
                    href={getTransactionUrl(contributionData.rewardTxHash)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 ml-1"
                  >
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {proofCompleted && contributionData.teeProofData && (
        <div className="space-y-3 bg-slate-50 p-4 rounded-md text-sm">
          <h3 className="font-medium">TEE Proof Results</h3>
          <div className="max-h-48 overflow-y-auto bg-slate-100 p-2 rounded-md font-mono text-xs">
            <pre className="whitespace-pre-wrap">
              {JSON.stringify(contributionData.teeProofData, null, 2)}
            </pre>
          </div>
        </div>
      )}

      {/* Stepper UI showing completed steps */}
      <ContributionSteps currentStep={0} completedSteps={completedSteps} />

      {userInfo && (
        <ContributionSummary userInfo={userInfo} isEncrypted={true} />
      )}
    </div>
  );
}
