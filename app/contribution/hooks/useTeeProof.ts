import { createClient } from "@/contracts/client";
import { Controller } from "@/contracts/instances/controller";
import { getEncryptionParameters } from "@/lib/crypto/utils";
import { waitForTransactionReceipt } from "@wagmi/core";
import { useState } from "react";
import { useAccount, useConfig, useWriteContract } from "wagmi";
import { debugLog } from "@/lib/logger";

// Fixed message for signing
export const SIGN_MESSAGE = String(
  process.env.NEXT_PUBLIC_REFINEMENT_ENCRYPTION_KEY,
);
if (!SIGN_MESSAGE) {
  throw new Error("SIGN_MESSAGE is undefined");
}

export type ProofResult = {
  fileId: number;
  jobId: number;
  proofData: any;
  txHash: string;
};

type JobDetails = {
  teeUrl: string;
  teePublicKey: string;
  teeAddress?: string;
};

// Contract return types
interface JobData {
  teeAddress: string;
  [key: string]: unknown;
}

interface TeeData {
  url: string;
  publicKey: string;
  [key: string]: unknown;
}

// Define a proper type for the request body
interface ProofRequestBody {
  job_id: number;
  file_id: number;
  nonce: string;
  proof_url: string;
  encryption_seed: string;
  env_vars: {
    DLP_ID: number;
  };
  validate_permissions: {
    address: string;
    public_key: string;
    iv: string;
    ephemeral_key: string;
  }[];
  encrypted_encryption_key?: string;
  encryption_key?: string;
  teeUrl?: string | null;
}

export const getDlpPublicKey = async (): Promise<string> => {
  const client = createClient();
  const { address: dataLiquidityPoolAddress, abi: dataLiquidityPoolAbi } =
    Controller("DataLiquidityPoolProxy");

  return client.readContract({
    address: dataLiquidityPoolAddress,
    abi: dataLiquidityPoolAbi,
    functionName: "publicKey",
    args: [],
  });
};

export const useTeeProof = () => {
  const { address } = useAccount();
  const config = useConfig();
  const { writeContractAsync, isPending } = useWriteContract();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Create client and read contract directly
  const client = createClient();

  // Use the Controller to get contract info
  const { address: teePoolAddress, abi: teePoolAbi } =
    Controller("TeePoolProxy");

  const { address: dataLiquidityPoolAddress } = Controller(
    "DataLiquidityPoolProxy",
  );

  // Helper to get job IDs for a file from TeePool contract
  const getFileJobIds = async (fileId: number): Promise<number[]> => {
    try {
      const jobIds = (await client.readContract({
        address: teePoolAddress,
        abi: teePoolAbi,
        functionName: "fileJobIds",
        args: [fileId],
      })) as readonly bigint[];

      return Array.from(jobIds).map(Number);
    } catch (err) {
      console.error("Error getting file job IDs:", err);
      throw new Error("Failed to get job IDs for file");
    }
  };

  // Helper to get TEE details for a job
  const getTeeDetails = async (jobId: number): Promise<JobDetails> => {
    try {
      // Create client
      const client = createClient();

      // First get the job details
      const job = (await client.readContract({
        address: teePoolAddress,
        abi: teePoolAbi,
        functionName: "jobs",
        args: [jobId],
      })) as JobData;

      if (!job || !job.teeAddress) {
        throw new Error("Job not found or missing TEE address");
      }

      // Then get the TEE info using the tee address from the job
      const teeInfo = (await client.readContract({
        address: teePoolAddress,
        abi: teePoolAbi,
        functionName: "tees",
        args: [job.teeAddress],
      })) as TeeData;

      if (!teeInfo) {
        throw new Error("TEE information not found");
      }

      return {
        teeUrl: teeInfo.url,
        teePublicKey: teeInfo.publicKey,
        teeAddress: job.teeAddress,
      };
    } catch (err) {
      console.error("Error getting TEE details:", err);
      throw new Error("Failed to get TEE details for job");
    }
  };

  // Request contribution proof from TEE
  const requestContributionProof = async (
    fileId: number,
    encryptionKey: string,
    signature: string,
  ) => {
    setIsProcessing(true);
    setError(null);

    try {
      if (!address) {
        throw new Error("Wallet not connected");
      }

      debugLog("useTeeProof 166 user_address:", address);

      const res = await fetch("/api/proof/tee", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileId, address }),
        credentials: "include",
      });

      if (!res.ok) {
        throw new Error(`Backend error: ${await res.text()}`);
      }

      const contributionProofResult = await res.json();

      debugLog("useTeeProof 32", contributionProofResult);

      const contributionProofReceipt = contributionProofResult.receipt;

      // Get job IDs for the file
      const jobIds = await getFileJobIds(fileId);
      if (jobIds.length === 0) {
        throw new Error("No jobs found for file");
      }

      // Get the latest job ID
      const latestJobId = jobIds[jobIds.length - 1];

      // Get TEE details for the job
      const jobDetails = await getTeeDetails(latestJobId);

      debugLog("jobDetails", jobDetails);

      // Get consistent encryption parameters
      const { ivHex, ephemeralKeyHex } = getEncryptionParameters();

      const proofUrl = process.env.NEXT_PUBLIC_PROOF_URL;
      const dlpId = process.env.NEXT_PUBLIC_DLP_ID;

      // Create the proof request
      const nonce = Date.now().toString();
      const requestBody: ProofRequestBody = {
        job_id: latestJobId,
        file_id: Number(fileId),
        nonce,
        proof_url: String(proofUrl),
        encryption_seed: SIGN_MESSAGE,
        env_vars: {
          DLP_ID: Number(dlpId),
        },
        validate_permissions: [
          {
            address: dataLiquidityPoolAddress,
            public_key: await getDlpPublicKey(),
            iv: ivHex,
            ephemeral_key: ephemeralKeyHex,
          },
        ],
      };

      // If TEE public key is available, add encrypted encryption key
      // if (jobDetails.teePublicKey) {
      //   requestBody.encrypted_encryption_key = encryptionKey;
      // } else {
      //   requestBody.encryption_key = signature;
      // }
      requestBody.encryption_key = signature;

      requestBody.teeUrl = jobDetails.teeUrl;

      // Make direct request to the TEE's RunProof endpoint
      const contributionProofResponse = await fetch(`api/proof`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (!contributionProofResponse.ok) {
        const errorData = await contributionProofResponse.json();

        debugLog(errorData);

        const errorText = errorData?.error ?? "";
        const jsonMatch = errorText.match(/{.*}/s);
        if (!jsonMatch) {
          throw new Error("JSON is not found in errorData.error");
        }

        let parsedError;
        try {
          parsedError = JSON.parse(jsonMatch[0]);
        } catch (e) {
          console.error("JSON parsing error", e);
          throw new Error("Invalid error format");
        }

        const logs = parsedError?.detail?.error?.details?.logs ?? "";
        const match = errorText.match(/score=.*?score_threshold[^}]+/s);
        const extracted = match ? match[0] : null;

        debugLog("Extracted part:", extracted);

        throw new Error(`Audio is not valid \n ${extracted}`);
      }

      const proofData = await contributionProofResponse.json();

      return {
        fileId,
        jobId: latestJobId,
        proofData,
        txHash: contributionProofReceipt.transactionHash,
      };
    } catch (err) {
      console.error("Error in proof process:", err);
      setError("Your audio is not valid");
      throw err;
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    requestContributionProof,
    isProcessing: isProcessing || isPending,
    error,
  };
};
