import { useState } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { DataRegistry } from '@/contracts/instances/data-registry';
import { Controller } from '@/contracts/instances/controller';
import { createClient } from '@/contracts/client';
import { toast } from 'sonner';

interface BlockchainData {
  fileHash: string;
  fileUrl: string;
  metadata: string;
  walletAddress: string;
}

export function useBlockchainIntegration() {
  const { address } = useAccount();
  const [isRegistering, setIsRegistering] = useState(false);
  const [transactionHash, setTransactionHash] = useState<string | null>(null);

  const { writeContract, data: hash, isPending, error } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const registerDataOnBlockchain = async (blockchainData: BlockchainData) => {
    if (!address) {
      toast.error('Wallet not connected');
      return;
    }

    setIsRegistering(true);
    setTransactionHash(null);

    try {
      const client = createClient(14800); // Moksha testnet
      const dataRegistry = DataRegistry(client);

      // Подготавливаем данные для регистрации
      const fileHash = blockchainData.fileHash;
      const metadata = blockchainData.metadata;
      const fileUrl = blockchainData.fileUrl;

      // Вызываем контракт для регистрации данных
      writeContract({
        address: dataRegistry.address,
        abi: dataRegistry.abi,
        functionName: 'addRefinement',
        args: [fileHash, metadata, fileUrl],
        account: address,
      });

      toast.success('Transaction submitted to blockchain');
    } catch (error) {
      console.error('Error registering data on blockchain:', error);
      toast.error('Failed to register data on blockchain');
      setIsRegistering(false);
    }
  };

  // Обработка успешной транзакции
  if (isSuccess && hash && !transactionHash) {
    setTransactionHash(hash);
    setIsRegistering(false);
    toast.success('Data successfully registered on blockchain!');
  }

  // Обработка ошибки
  if (error) {
    console.error('Blockchain transaction error:', error);
    toast.error('Blockchain transaction failed');
    setIsRegistering(false);
  }

  return {
    registerDataOnBlockchain,
    isRegistering: isRegistering || isPending || isConfirming,
    transactionHash,
    isSuccess,
    error,
  };
} 