import { useState } from "react";
import { useSignMessage, useAccount, useWalletClient } from "wagmi";
import { getWalletPublicKey, getPublicKeyFromAddress } from "@/lib/crypto/wallet";
import { ContributionData, DriveInfo, UserInfo } from "../types";
import { extractFileIdFromReceipt } from "../utils/fileUtils";
import { useAddFile } from "./useAddFile";
import { useDataRefinement } from "./useDataRefinement";
import { useLocalFileUpload, LocalUploadResponse } from "./useLocalFileUpload";
import { useRewardClaim } from "./useRewardClaim";
import {
  getDlpPublicKey,
  ProofResult,
  SIGN_MESSAGE,
  useTeeProof,
} from "./useTeeProof";
import { Download } from "lucide-react";
import { formatVanaFileId } from "@/lib/crypto/utils";

// Steps aligned with ContributionSteps component (1-based indexing)
const STEPS = {
  PROCESS_LOCAL_FILE: 1,
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

  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();
  const { signMessageAsync, isPending: isSigningMessage } = useSignMessage();
  const { processLocalFile, isUploading } = useLocalFileUpload();
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
    userInfo: UserInfo,
    fileData: File | string,
    driveInfo: DriveInfo,
    isConnected: boolean
  ) => {
    if (!userInfo) {
      setError("Unable to access user information. Please try again.");
      return;
    }

    try {
      setError(null);

      // Step 0: Sign message
      const signature = await executeSignMessageStep();
      if (!signature) return;

      // Step 1: Get wallet public key
      let walletPublicKey: string;
      try {
        if (walletClient) {
          walletPublicKey = await getWalletPublicKey(walletClient);
        } else if (address) {
          walletPublicKey = getPublicKeyFromAddress(address);
        } else {
          setError("Wallet not connected");
          return;
        }
      } catch (error) {
        setError("Failed to get wallet public key");
        return;
      }

      // Step 2: Локальное шифрование и загрузка в Pinata
      const localFileResult = await processLocalFile(
        userInfo,
        walletPublicKey,
        fileData,
      );
      if (!localFileResult) return;

      // Отправляем зашифрованный файл на сервер (Pinata)
      const formData = new FormData();
      formData.append('file', await fetch(localFileResult.downloadUrl).then(r => r.blob()));
      formData.append('walletAddress', userInfo.id!);

      const uploadResponse = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      if (!uploadResponse.ok) {
        setError("Failed to upload file to Pinata");
        return;
      }
      const uploadResult = await uploadResponse.json();

      if (!isConnected) {
        setError("Wallet connection required to register on blockchain");
        return;
      }

      // Step 3: Register on blockchain
      const { fileId, txReceipt } =
        await executeBlockchainRegistrationStep({
          downloadUrl: uploadResult.data.pinataUrl,
          fileId: uploadResult.data.fileId,
          fileHash: uploadResult.data.fileHash,
          fileName: uploadResult.data.fileName,
          fileSize: uploadResult.data.fileSize,
        }, signature);
      if (!fileId) return;

      // Update contribution data
      updateContributionData({
        contributionId: fileId,
        encryptedUrl: uploadResult.data.pinataUrl,
        transactionReceipt: {
          hash: txReceipt.transactionHash,
          blockNumber: Number(txReceipt.blockNumber),
        },
      });

      // Step 4: TEE Proof and Reward
      const fileIdNum = typeof fileId === 'string' ? parseInt(fileId, 10) : fileId;
      await executeProofAndRewardSteps(fileIdNum, signature);

      setIsSuccess(true);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Failed to process your contribution. Please try again."
      );
    }
  };

  // Step 0: Sign message
  const executeSignMessageStep = async (): Promise<string | undefined> => {
    try {
      const signature = await signMessageAsync({ message: SIGN_MESSAGE });
      return signature;
    } catch (signError) {
      setError("Failed to sign the message. Please try again.");
      return undefined;
    }
  };

  // Step 1: Upload and encrypt file (Pinata)
  const executeUploadDataStep = async (
    userInfo: UserInfo,
    walletPublicKey: string,
    fileData: File | string,
    driveInfo: DriveInfo
  ) => {
    setCurrentStep(STEPS.PROCESS_LOCAL_FILE);

    const formData = new FormData();
    formData.append('file', fileData as File);
    formData.append('walletAddress', userInfo.id!);

    const uploadResponse = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });

    if (!uploadResponse.ok) {
      setError("Failed to upload file to Pinata");
      return null;
    }

    const uploadResult = await uploadResponse.json();

    setShareUrl(uploadResult.data.pinataUrl);
    markStepComplete(STEPS.PROCESS_LOCAL_FILE);

    return {
      downloadUrl: uploadResult.data.pinataUrl,
      fileHash: uploadResult.data.fileHash,
      fileName: uploadResult.data.fileName,
      fileSize: uploadResult.data.fileSize,
      fileId: uploadResult.data.fileId,
    };
  };

  // Step 2: Register on blockchain
  const executeBlockchainRegistrationStep = async (
    uploadResult: LocalUploadResponse,
    signature: string
  ) => {
    setCurrentStep(STEPS.BLOCKCHAIN_REGISTRATION);

    const txReceipt = await addFile(uploadResult.downloadUrl);

    if (!txReceipt) {
      if (contractError) {
        setError(`Contract error: ${contractError}`);
      } else {
        setError("Failed to add file to blockchain");
      }
      return { fileId: null, txReceipt: null };
    }

    const fileId = extractFileIdFromReceipt(txReceipt);
    markStepComplete(STEPS.BLOCKCHAIN_REGISTRATION);

    return { fileId, txReceipt };
  };

  // Step 3-5: TEE Proof and Reward
  const executeProofAndRewardSteps = async (
    fileId: number,
    signature: string
  ) => {
    try {
      // Step 3: Request TEE Proof
      const proofResult = await executeTeeProofStep(
        fileId,
        signature,
        signature // encryptionKey и signature одинаковы, если нет отдельного ключа
      );

      // Step 4: Process Proof
      await executeProcessProofStep(proofResult, signature);

      // Step 5: Claim Reward
      await executeClaimRewardStep(fileId);
    } catch (proofErr) {
      setError(
        proofErr instanceof Error
          ? proofErr.message
          : "Failed to process TEE proof or claim reward"
      );
    }
  };

  // Step 3: Request TEE Proof
  const executeTeeProofStep = async (
    fileId: number,
    encryptionKey: string,
    signature: string
  ) => {
    setCurrentStep(STEPS.REQUEST_TEE_PROOF);
    const proofResult = await requestContributionProof(
      fileId,
      encryptionKey,
      signature
    );

    updateContributionData({
      teeJobId: proofResult.jobId.toString(),
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
      proofResult: proofResult.proofData,
    });

    try {
      const refinementResult = await refine({
        file_id: proofResult.fileId,
        encryption_key: signature,
      });

      markStepComplete(STEPS.PROCESS_PROOF);

      return refinementResult;
    } catch (refineError) {
      throw refineError;
    }
  };

  // Step 5: Claim Reward
  const executeClaimRewardStep = async (fileId: number) => {
    setCurrentStep(STEPS.CLAIM_REWARD);
    const rewardResult = await requestReward(fileId);

    updateContributionData({
      rewardClaimed: true,
    });

    markStepComplete(STEPS.CLAIM_REWARD);
    return rewardResult;
  };

  // Helpers
  const markStepComplete = (step: number) => {
    setCompletedSteps((prev: number[]) => [...prev, step]);
  };

  const updateContributionData = (newData: Partial<ContributionData>) => {
    setContributionData((prev: ContributionData | null) => {
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
