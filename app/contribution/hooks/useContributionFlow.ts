import { encryptWithWalletPublicKey } from "@/lib/crypto/utils";
import { useState } from "react";
import { useSignMessage } from "wagmi";
import { ContributionData, DriveInfo, UserInfo } from "../types";
import { extractFileIdFromReceipt } from "../utils/fileUtils";
import { useAddFile } from "./useAddFile";
import { useDataRefinement } from "./useDataRefinement";
import { useDataUpload } from "./useDataUpload";
import { useRewardClaim } from "./useRewardClaim";
import { useStatisticsUpload } from "./useStatisticsUpload";
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
  const { uploadStatistics } = useStatisticsUpload();

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
    audio_language: string,
    file: Blob,
    isConnected: boolean,
  ) => {
    try {
      setError(null);

      // Execute steps in sequence
      const signature = await executeSignMessageStep();
      if (!signature) throw new Error("Signature step failed");

      const duration = await getBlobDuration(file);

      const uploadResult = await executeUploadDataStep(
        userAddress,
        file,
        audio_language,
        signature,
        duration,
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
        },
      });

      // Process proof and reward in sequence
      const proof = await executeProofAndRewardSteps(
        fileId,
        duration,
        userAddress,
        encryptedKey,
        signature,
      );

      setIsSuccess(true);
    } catch (error) {
      console.error("Error contributing data:", error);
      setError(
        error instanceof Error
          ? error.message
          : "Failed to process your contribution. Please try again.",
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
          : "Failed to sign the message. Please try again.",
      );
      return null;
    }
  };

  // Step 1: Upload data to Pinata
  const executeUploadDataStep = async (
    userAddress: string,
    file: Blob,
    audio_language: string,
    signature: string,
    duration: number,
  ) => {
    setCurrentStep(STEPS.UPLOAD_DATA);

    console.log("\x1b[31mSIGNATURE\x1b[0m -", signature);

    const uploadResult = await uploadData(
      userAddress,
      audio_language,
      file,
      signature,
      duration,
    );
    if (!uploadResult) {
      setError("Failed to upload data to Google Drive");
      throw new Error("Upload result step failed");
    }

    setShareUrl(uploadResult.downloadUrl);
    markStepComplete(STEPS.UPLOAD_DATA);
    return uploadResult;
  };

  // Step 2: Register on blockchain
  const executeBlockchainRegistrationStep = async (
    uploadResult: UploadResponse,
    signature: string,
  ) => {
    setCurrentStep(STEPS.BLOCKCHAIN_REGISTRATION);

    const publicKey = await getDlpPublicKey();
    const encryptedKey = await encryptWithWalletPublicKey(signature, publicKey);

    const txReceipt = await addFile(uploadResult.downloadUrl, encryptedKey);

    if (!txReceipt) {
      if (contractError) {
        setError(`Contract error: ${contractError}`);
        setIsSuccess(false);
        return { fileId: null, txReceipt: null, encryptedKey: null };
      } else {
        setError("Failed to add file to blockchain");
        setIsSuccess(false);
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
    audioDuration: number,
    userAddress: string,
    encryptedKey: string,
    signature: string,
  ) => {
    // Step 3: Request TEE Proof
    const proofResult = await executeTeeProofStep(
      fileId,
      encryptedKey,
      signature,
    );

    if (!proofResult) {
      setIsSuccess(false)
      throw new Error("Proof request step failed");
    }

    // Step 4: Process Proof
    const err = await executeProcessProofStep(fileId, proofResult, signature);
    if (!err) {
      setIsSuccess(false)
      throw new Error("Refine step failed");
    }
    // Step 5: Claim Reward
    await executeClaimRewardStep(fileId, audioDuration, userAddress);
  };

  // Step 3: Request TEE Proof
  const executeTeeProofStep = async (
    fileId: number,
    encryptedKey: string,
    signature: string,
  ) => {
    setCurrentStep(STEPS.REQUEST_TEE_PROOF);
    const proofResult = await requestContributionProof(
      fileId,
      encryptedKey,
      signature,
    );

    if (!proofResult) {
      setError("Failed to request TEE proof");
      setIsSuccess(false);
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
    fileId: number,
    proofResult: ProofResult,
    signature: string,
  ) => {
    setCurrentStep(STEPS.PROCESS_PROOF);

    updateContributionData({
      teeProofData: proofResult.proofData,
    });

    try {
      const refinementResult = await refine({
        file_id: fileId,
        encryption_key: signature,
      });

      markStepComplete(STEPS.PROCESS_PROOF);

      return refinementResult;
    } catch (refineError) {
      console.error("Error during data refinement:", refineError);
      
      setError(
        refineError instanceof Error
          ? refineError.message
          : "Failed to process TEE proof or claim reward",
      );
      setIsSuccess(false);
      return error;
    }
  };

  // Step 5: Claim Reward
  const executeClaimRewardStep = async (
    fileId: number,
    audioDuration: number,
    userAddress: string,
  ) => {
    setCurrentStep(STEPS.CLAIM_REWARD);
    console.log("contribution/hooks/useContributionFlow.ts 260", fileId);
    const rewardResult = await requestReward(fileId);
    console.log(
      "contribution/hooks/useContributionFlow.ts 262 rewardResull",
      rewardResult,
    );

    if (!rewardResult) {
      setError("Failed to claim reward");
      return null;
    }

    updateContributionData({
      rewardTxHash: rewardResult?.transactionHash,
    });

    markStepComplete(STEPS.CLAIM_REWARD);

    // Upload statistics to the database in the end of the contribution
    uploadStatistics(userAddress, audioDuration);

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

  const getBlobDuration = (blob: Blob): Promise<number> => {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(blob);
      const audio = document.createElement("audio");
      audio.src = url;
      audio.addEventListener("loadedmetadata", () => {
        URL.revokeObjectURL(url);
        resolve(audio.duration); // в секундах
      });
      audio.addEventListener("error", (e) => {
        URL.revokeObjectURL(url);
        reject(e);
      });
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
