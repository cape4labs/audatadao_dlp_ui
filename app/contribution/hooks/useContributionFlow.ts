import { encryptWithWalletPublicKey } from "@/lib/crypto/utils";
import { useState } from "react";
import { useSignMessage } from "wagmi";
import { ContributionData, DriveInfo, UserInfo } from "../types";
import { extractFileIdFromReceipt } from "../utils/fileUtils";
import { useAddFile } from "./useAddFile";
import { useDataRefinement } from "./useDataRefinement";
import { useDataUpload } from "./useDataUpload";
import { useRewardClaim } from "./useRewardClaim";
import { UploadResponse } from "./useDataUpload";
import {
  getDlpPublicKey,
  ProofResult,
  SIGN_MESSAGE,
  useTeeProof,
} from "./useTeeProof";

// Steps aligned with ContributionSteps component (1-based indexing)
const STEPS = {
  UPLOAD_DATA: 1,
  BLOCKCHAIN_REGISTRATION: 2,
  REQUEST_TEE_PROOF: 3,
  PROCESS_PROOF: 4,
  CLAIM_REWARD: 5,
};

export function useContributionFlow() {
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<number>(0); // Start at 0 (not yet started)
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [contributionData, setContributionData] =
    useState<ContributionData | null>(null);
  const [shareUrl, setShareUrl] = useState<string>("");

  const { signMessageAsync, isPending: isSigningMessage } = useSignMessage();
  const { uploadData, isUploading } = useDataUpload();
  const { addFile, isAdding, contractError } = useAddFile();
  const { requestContributionProof, isProcessing } = useTeeProof();
  const { requestReward, isClaiming } = useRewardClaim();
  const { refine, isLoading: isRefining } = useDataRefinement();

  const isLoading =
    isUploading ||
    isAdding ||
    isProcessing ||
    isClaiming ||
    isSigningMessage ||
    isRefining;

  const resetFlow = () => {
    setIsSuccess(false);
    setError(null);
    setCurrentStep(0); // Reset to not started
    setCompletedSteps([]);
    setContributionData(null);
    setShareUrl("");
  };

  const handleContributeData = async (
    userAddress: string,
    file: Blob,
    isConnected: boolean,
  ) => {
    try {
      setError(null);

      // Execute steps in sequence
      const signature = await executeSignMessageStep();
      if (!signature) throw new Error("Signature step failed");

      const uploadResult = await executeUploadDataStep(
        userAddress,
        file,
        signature,
      );
      if (!uploadResult) throw new Error("Upload step failed");

      if (!isConnected) {
        throw new Error("Wallet connection required to register on blockchain");
      }

      const { fileId, txReceipt, encryptedKey } =
        await executeBlockchainRegistrationStep(uploadResult, signature);
      if (!fileId) throw new Error("Blockchain registration step failed");

      // Update contribution data with blockchain information
      updateContributionData({
        contributionId: uploadResult.vanaFileId,
        encryptedUrl: uploadResult.downloadUrl,
        transactionReceipt: {
          hash: txReceipt.transactionHash,
          blockNumber: txReceipt.blockNumber
            ? Number(txReceipt.blockNumber)
            : undefined,
        }
      });

      // Process proof and reward in sequence
      await executeProofAndRewardSteps(fileId, encryptedKey, signature);

      setIsSuccess(true);
    } catch (error) {
      console.error("Error contributing data:", error);
      setError(
        error instanceof Error
          ? error.message
          : "Failed to process your contribution. Please try again."
      );
    }
  };

  // Step 0: Sign message (pre-step before the visible flow begins)
  const executeSignMessageStep = async (): Promise<string | null> => {
    try {
      const signature = await signMessageAsync({ message: SIGN_MESSAGE });
      return signature;
    } catch (signError) {
      console.error("Error signing message:", signError);
      setError(
        signError instanceof Error
          ? signError.message
          : "Failed to sign the message. Please try again."
      );
      return null;
    }
  };

  // Step 1: Upload data to Pinata
  const executeUploadDataStep = async (
    userAddress: string,
    file: Blob,
    signature: string
  ) => {
    setCurrentStep(STEPS.UPLOAD_DATA);

    const uploadResult = await uploadData(userAddress, file, signature);
    if (!uploadResult) {
      setError("Failed to upload data to Google Drive");
      return null;
    }

    setShareUrl(uploadResult.downloadUrl);
    markStepComplete(STEPS.UPLOAD_DATA);
    return uploadResult;
  };

  // Step 2: Register on blockchain
  const executeBlockchainRegistrationStep = async (
    uploadResult: UploadResponse,
    signature: string
  ) => {
    setCurrentStep(STEPS.BLOCKCHAIN_REGISTRATION);

    const publicKey = await getDlpPublicKey();
    const encryptedKey = await encryptWithWalletPublicKey(signature, publicKey);

    const txReceipt = await addFile(uploadResult.downloadUrl, encryptedKey);

    if (!txReceipt) {
      if (contractError) {
        setError(`Contract error: ${contractError}`);
      } else {
        setError("Failed to add file to blockchain");
      }
      return { fileId: null, txReceipt: null, encryptedKey: null };
    }

    const fileId = extractFileIdFromReceipt(txReceipt);
    markStepComplete(STEPS.BLOCKCHAIN_REGISTRATION);

    return { fileId, txReceipt, encryptedKey };
  };

  // Steps 3-5: TEE Proof and Reward
  const executeProofAndRewardSteps = async (
    fileId: number,
    encryptedKey: string,
    signature: string
  ) => {
    // Step 3: Request TEE Proof
    const proofResult = await executeTeeProofStep(
      fileId,
      encryptedKey,
      signature
    );

    if (!proofResult) {
      // Ошибка уже установлена внутри executeTeeProofStep
      return;
    }

    // Step 4: Process Proof
    await executeProcessProofStep(proofResult, signature);

    // Step 5: Claim Reward
    await executeClaimRewardStep(fileId);
  };

  // Step 3: Request TEE Proof
  const executeTeeProofStep = async (
    fileId: number,
    encryptedKey: string,
    signature: string
  ) => {
    setCurrentStep(STEPS.REQUEST_TEE_PROOF);
    const proofResult = await requestContributionProof(
      fileId,
      encryptedKey,
      signature
    );

    if (!proofResult) {
      setError("Failed to request TEE proof");
      return null;
    }

    updateContributionData({
      teeJobId: String(proofResult.jobId),
    });

    markStepComplete(STEPS.REQUEST_TEE_PROOF);
    return proofResult;
  };

  // Step 4: Process Proof
  const executeProcessProofStep = async (
    proofResult: ProofResult,
    signature: string
  ) => {
    setCurrentStep(STEPS.PROCESS_PROOF);

    updateContributionData({
      teeProofData: proofResult.proofData,
    });

    try {
      const refinementResult = await refine({
        file_id: proofResult.fileId,
        encryption_key: signature,
      });

      markStepComplete(STEPS.PROCESS_PROOF);

      return refinementResult;
    } catch (refineError) {
      console.error("Error during data refinement:", refineError);
      setError(
        refineError instanceof Error
          ? refineError.message
          : "Failed to process TEE proof or claim reward"
      );
      return null;
    }
  };

  // Step 5: Claim Reward
  const executeClaimRewardStep = async (fileId: number) => {
    setCurrentStep(STEPS.CLAIM_REWARD);
    console.log(fileId);
    const rewardResult = await requestReward(fileId);
    console.log(rewardResult);

    if (!rewardResult) {
      setError("Failed to claim reward");
      return null;
    }

    data = updateContributionData({
      rewardTxHash: rewardResult?.transactionHash,
    });
    console.log(data);

    markStepComplete(STEPS.CLAIM_REWARD);
    return rewardResult;
  };

  // Helper functions
  const markStepComplete = (step: number) => {
    setCompletedSteps((prev) => [...prev, step]);
  };

  const updateContributionData = (newData: Partial<ContributionData>) => {
    setContributionData((prev) => {
      if (!prev) return newData as ContributionData;
      return { ...prev, ...newData };
    });
  };

  return {
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
  };
}
