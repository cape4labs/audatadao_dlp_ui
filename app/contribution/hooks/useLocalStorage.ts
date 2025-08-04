import { useState } from 'react';
import { toast } from 'sonner';
import { encryptFileWithPGP, DEMO_PUBLIC_KEY } from '@/lib/crypto/encrypt';

interface LocalFile {
  id: string;
  name: string;
  size: number;
  type: string;
  lastModified: number;
  data: string; // base64 encoded file data
  walletAddress: string;
  uploadedAt: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  fileHash?: string;
}

interface LocalStorageResult {
  success: boolean;
  fileId?: string;
  error?: string;
}

export function useLocalStorage() {
  const [isUploading, setIsUploading] = useState(false);

  // Вычисление SHA-256 хеша исходного файла
  const computeFileHash = async (file: File): Promise<string> => {
    const buffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  const saveFileToLocalStorage = async (file: File, walletAddress: string): Promise<LocalStorageResult> => {
    setIsUploading(true);

    try {
      // 1. Считаем хеш исходного файла
      const fileHash = await computeFileHash(file);
      // 2. Шифруем файл
      const encryptedBase64 = await encryptFileWithPGP(file, DEMO_PUBLIC_KEY);

      // Generate unique file ID
      const fileId = `${walletAddress}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const localFile: LocalFile = {
        id: fileId,
        name: file.name,
        size: file.size,
        type: file.type,
        lastModified: file.lastModified,
        data: encryptedBase64, // сохраняем зашифрованный файл
        walletAddress,
        uploadedAt: new Date().toISOString(),
        status: 'pending',
        fileHash, // сохраняем исходный хеш
      };

      // Get existing files from localStorage
      const existingFiles = getFilesFromLocalStorage(walletAddress);
      existingFiles.push(localFile);

      // Save back to localStorage
      localStorage.setItem(`vana_files_${walletAddress}`, JSON.stringify(existingFiles));

      toast.success('File saved to local storage (encrypted)');
      return {
        success: true,
        fileId,
      };
    } catch (error) {
      console.error('Local storage save error:', error);
      toast.error('Failed to save file to local storage');
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    } finally {
      setIsUploading(false);
    }
  };

  const getFilesFromLocalStorage = (walletAddress: string): LocalFile[] => {
    try {
      const filesData = localStorage.getItem(`vana_files_${walletAddress}`);
      return filesData ? JSON.parse(filesData) : [];
    } catch (error) {
      console.error('Error reading files from localStorage:', error);
      return [];
    }
  };

  const updateFileStatus = (walletAddress: string, fileId: string, status: LocalFile['status'], fileHash?: string) => {
    try {
      const files = getFilesFromLocalStorage(walletAddress);
      const fileIndex = files.findIndex(f => f.id === fileId);
      
      if (fileIndex !== -1) {
        files[fileIndex].status = status;
        if (fileHash) {
          files[fileIndex].fileHash = fileHash;
        }
        localStorage.setItem(`vana_files_${walletAddress}`, JSON.stringify(files));
      }
    } catch (error) {
      console.error('Error updating file status:', error);
    }
  };

  const removeFileFromLocalStorage = (walletAddress: string, fileId: string) => {
    try {
      const files = getFilesFromLocalStorage(walletAddress);
      const filteredFiles = files.filter(f => f.id !== fileId);
      localStorage.setItem(`vana_files_${walletAddress}`, JSON.stringify(filteredFiles));
    } catch (error) {
      console.error('Error removing file from localStorage:', error);
    }
  };

  const getFileFromLocalStorage = (walletAddress: string, fileId: string): LocalFile | null => {
    try {
      const files = getFilesFromLocalStorage(walletAddress);
      return files.find(f => f.id === fileId) || null;
    } catch (error) {
      console.error('Error getting file from localStorage:', error);
      return null;
    }
  };

  const generateFileHash = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          const arrayBuffer = e.target.result as ArrayBuffer;
          crypto.subtle.digest('SHA-256', arrayBuffer)
            .then(hashBuffer => {
              const hashArray = Array.from(new Uint8Array(hashBuffer));
              const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
              resolve(hashHex);
            })
            .catch(reject);
        } else {
          reject(new Error('Failed to read file'));
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsArrayBuffer(file);
    });
  };

  return {
    saveFileToLocalStorage,
    getFilesFromLocalStorage,
    updateFileStatus,
    removeFileFromLocalStorage,
    getFileFromLocalStorage,
    generateFileHash,
    isUploading,
  };
} 