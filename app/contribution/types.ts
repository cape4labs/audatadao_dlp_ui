export interface UserInfo {
  id?: string;
  email: string;
  name: string;
  locale?: string;
}

export interface DriveInfo {
  percentUsed: number;
}

export interface ContributionData {
  contributionId?: string;
  encryptedUrl?: string;
  transactionReceipt?: {
    hash: string;
    blockNumber?: number;
  };
  teeJobId?: string;
  proofResult?: any;
  rewardClaimed?: boolean;
  rewardTxHash?: string;
  teeProofData?: any;
} 