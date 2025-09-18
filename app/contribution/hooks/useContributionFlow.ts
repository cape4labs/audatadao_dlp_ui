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
import { debugLog } from "@/lib/logger";
import {
  SIGN_MESSAGE,
  getDlpPublicKey,
  ProofResult,
  useTeeProof,
} from "./useTeeProof";

const STEPS = {
  UPLOAD_DATA: 1,
  BLOCKCHAIN_REGISTRATION: 2,
  REQUEST_TEE_PROOF: 3,
  PROCESS_PROOF: 4,
  CLAIM_REWARD: 5,
};

export interface FileContributionData extends ContributionData {
  fileId: string;
  fileName: string;
  currentStep: number;
  completedSteps: number[];
  error: string | null;
  isSuccess: boolean;
  shareUrl: string;
}

export function useContributionFlow() {
  const [fileContributions, setFileContributions] = useState<Map<string, FileContributionData>>(new Map());
  const [globalError, setGlobalError] = useState<string | null>(null);

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

  const initializeFileContribution = (fileId: string, fileName: string) => {
    setFileContributions(prev => {
      const newMap = new Map(prev);
      newMap.set(fileId, {
        fileId,
        fileName,
        currentStep: 0,
        completedSteps: [],
        error: null,
        isSuccess: false,
        shareUrl: "",
        contributionId: "",
        encryptedUrl: "",
      });
      return newMap;
    });
  };

  const updateFileContribution = (fileId: string, updates: Partial<FileContributionData>) => {
    setFileContributions(prev => {
      const newMap = new Map(prev);
      const current = newMap.get(fileId);
      if (current) {
        newMap.set(fileId, { ...current, ...updates });
      }
      return newMap;
    });
  };

  const setFileCurrentStep = (fileId: string, step: number) => {
    updateFileContribution(fileId, { currentStep: step });
  };

  const markFileStepComplete = (fileId: string, step: number) => {
    setFileContributions(prev => {
      const newMap = new Map(prev);
      const current = newMap.get(fileId);
      if (current) {
        newMap.set(fileId, {
          ...current,
          completedSteps: [...current.completedSteps, step]
        });
      }
      return newMap;
    });
  };

  const setFileError = (fileId: string, error: string) => {
    updateFileContribution(fileId, { error, isSuccess: false });
  };

  const setFileSuccess = (fileId: string) => {
    updateFileContribution(fileId, { isSuccess: true, error: null });
  };

  const getFileContribution = (fileId: string): FileContributionData | null => {
    return fileContributions.get(fileId) || null;
  };

  const getAllFileContributions = (): FileContributionData[] => {
    return Array.from(fileContributions.values());
  };

  const areAllFilesCompleted = (): boolean => {
    const contributions = Array.from(fileContributions.values());
    return contributions.length > 0 && contributions.every(contrib => 
      contrib.isSuccess || contrib.error !== null
    );
  };

  const hasAnySuccess = (): boolean => {
    return Array.from(fileContributions.values()).some(contrib => contrib.isSuccess);
  };

  const resetFlow = () => {
    setFileContributions(new Map());
    setGlobalError(null);
  };

  const handleContributeData = async (
    fileId: string,
    userAddress: string,
    audio_language: string,
    file: File,
    isConnected: boolean,
  ) => {
    try {
      setGlobalError(null);
      initializeFileContribution(fileId, file.name);

      const signature = await executeSignMessageStep(fileId);
      if (!signature) throw new Error("Signature step failed");

      const duration = await getBlobDuration(file);

      const uploadResult = await executeUploadDataStep(
        fileId,
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

      const { blockchainFileId, txReceipt, encryptedKey } =
        await executeBlockchainRegistrationStep(
          fileId,
          uploadResult,
          signature,
          userAddress,
        );
      if (!blockchainFileId) throw new Error("Blockchain registration step failed");

      updateFileContribution(fileId, {
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
      await executeProofAndRewardSteps(
        fileId,
        blockchainFileId,
        duration,
        userAddress,
        encryptedKey,
        signature,
      );

      setFileSuccess(fileId);
    } catch (error) {
      console.error(`Error contributing data for file ${file.name}:`, error);
      setFileError(
        fileId,
        error instanceof Error
          ? error.message
          : "Failed to process your contribution. Please try again."
      );
    }
  };

  // Step 0: Sign message (pre-step before the visible flow begins)
  const executeSignMessageStep = async (fileId: string): Promise<string | null> => {
    try {
      const signature = await signMessageAsync({ message: SIGN_MESSAGE });
      return signature;
    } catch (signError) {
      console.error("Error signing message:", signError);
      setFileError(
        fileId,
        signError instanceof Error
          ? signError.message
          : "Failed to sign the message. Please try again."
      );
      return null;
    }
  };

  // Step 1: Upload data to Pinata
  const executeUploadDataStep = async (
    fileId: string,
    userAddress: string,
    file: Blob,
    audio_language: string,
    signature: string,
    duration: number,
  ) => {
    setFileCurrentStep(fileId, STEPS.UPLOAD_DATA);

    debugLog("\x1b[31mSIGNATURE\x1b[0m -", signature);

    const uploadResult = await uploadData(
      userAddress,
      audio_language,
      file,
      signature,
      duration,
    );
    if (!uploadResult) {
      setFileError(fileId, "Failed to upload data to Google Drive");
      throw new Error("Upload result step failed");
    }

    updateFileContribution(fileId, { shareUrl: uploadResult.downloadUrl });
    markFileStepComplete(fileId, STEPS.UPLOAD_DATA);
    return uploadResult;
  };

  // Step 2: Register on blockchain
  const executeBlockchainRegistrationStep = async (
    fileId: string,
    uploadResult: UploadResponse,
    signature: string,
    userAddress: string,
  ) => {
    setFileCurrentStep(fileId, STEPS.BLOCKCHAIN_REGISTRATION);

    const publicKey = await getDlpPublicKey();
    const encryptedKey = await encryptWithWalletPublicKey(signature, publicKey);

    const txReceipt = await addFile(
      uploadResult.downloadUrl,
      encryptedKey,
      userAddress,
    );

    debugLog("useContributionFlow 193", txReceipt);

    if (!txReceipt) {
      if (contractError) {
        setFileError(fileId, `Contract error: ${contractError}`);
      } else {
        setFileError(fileId, "Failed to add file to blockchain");
      }
      return { blockchainFileId: null, txReceipt: null, encryptedKey: null };
    }

    const blockchainFileId = extractFileIdFromReceipt(txReceipt);
    markFileStepComplete(fileId, STEPS.BLOCKCHAIN_REGISTRATION);

    return { blockchainFileId, txReceipt, encryptedKey };
  };

  // Steps 3-5: TEE Proof and Reward
  const executeProofAndRewardSteps = async (
    fileId: string,
    blockchainFileId: number,
    audioDuration: number,
    userAddress: string,
    encryptedKey: string,
    signature: string,
  ) => {
    // Step 3: Request TEE Proof
    const proofResult = await executeTeeProofStep(
      fileId,
      blockchainFileId,
      encryptedKey,
      signature,
    );

    if (!proofResult) {
      throw new Error("Proof request step failed");
    }

    // Step 4: Process Proof
    const processResult = await executeProcessProofStep(fileId, proofResult, signature);
    if (!processResult) {
      throw new Error("Refinement step failed");
    }

    // Step 5: Claim Reward
    await executeClaimRewardStep(fileId, blockchainFileId, audioDuration, userAddress);
  };

  // Step 3: Request TEE Proof
  const executeTeeProofStep = async (
    fileId: string,
    blockchainFileId: number,
    encryptedKey: string,
    signature: string,
  ) => {
    setFileCurrentStep(fileId, STEPS.REQUEST_TEE_PROOF);
    const proofResult = await requestContributionProof(
      blockchainFileId,
      encryptedKey,
      signature,
    );

    if (!proofResult) {
      setFileError(fileId, "Failed to request TEE proof");
      return null;
    }

    updateFileContribution(fileId, {
      teeJobId: String(proofResult.jobId),
    });

    markFileStepComplete(fileId, STEPS.REQUEST_TEE_PROOF);
    return proofResult;
  };

  // Step 4: Process Proof
  const executeProcessProofStep = async (
    fileId: string,
    proofResult: ProofResult,
    signature: string,
  ) => {
    setFileCurrentStep(fileId, STEPS.PROCESS_PROOF);

    updateFileContribution(fileId, {
      teeProofData: proofResult.proofData,
    });

    try {
      const refinementResult = await refine({
        file_id: proofResult.fileId,
        encryption_key: signature,
      });

      markFileStepComplete(fileId, STEPS.PROCESS_PROOF);
      return refinementResult;
    } catch (refineError) {
      console.error("Error during data refinement:", refineError);
      setFileError(
        fileId,
        refineError instanceof Error
          ? refineError.message
          : "Failed to process TEE proof"
      );
      return null;
    }
  };

  // Step 5: Claim Reward
  const executeClaimRewardStep = async (
    fileId: string,
    blockchainFileId: number,
    audioDuration: number,
    userAddress: string,
  ) => {
    setFileCurrentStep(fileId, STEPS.CLAIM_REWARD);

    debugLog("contribution/hooks/useContributionFlow.ts 260", blockchainFileId);

    const rewardResult = await requestReward(blockchainFileId);

    debugLog(
      "contribution/hooks/useContributionFlow.ts 262 rewardResult",
      rewardResult,
    );

    if (!rewardResult) {
      setFileError(fileId, "Failed to claim reward");
      return null;
    }

    updateFileContribution(fileId, {
      rewardTxHash: rewardResult?.transactionHash,
    });

    markFileStepComplete(fileId, STEPS.CLAIM_REWARD);

    uploadStatistics(userAddress, audioDuration);

    return rewardResult;
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
    getFileContribution,
    getAllFileContributions,
    
    areAllFilesCompleted,
    hasAnySuccess,
    globalError,
    isLoading,
    isSigningMessage,
    

    handleContributeData,
    resetFlow,

    isSuccess: hasAnySuccess(),
    error: globalError,
    currentStep: 0, 
    completedSteps: [], 
    contributionData: null, 
    shareUrl: "", 
  };
}