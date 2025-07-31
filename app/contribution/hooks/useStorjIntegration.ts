import { useState } from 'react';
import { toast } from 'sonner';

interface StorjUploadResult {
  fileUrl: string;
  fileHash: string;
  success: boolean;
  error?: string;
}

interface StorjConfig {
  accessKey: string;
  secretKey: string;
  bucketName: string;
  endpoint: string;
}

export function useStorjIntegration() {
  const [isUploading, setIsUploading] = useState(false);

  const uploadToStorj = async (file: File, walletAddress: string): Promise<StorjUploadResult> => {
    setIsUploading(true);

    try {
      // Создаем FormData для загрузки
      const formData = new FormData();
      formData.append('file', file);
      formData.append('walletAddress', walletAddress);

      // Отправляем файл на наш API endpoint, который загрузит его в Storj
      const response = await fetch('/api/storj/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      const result = await response.json();

      if (result.success) {
        toast.success('File uploaded to Storj successfully');
        return {
          fileUrl: result.data.fileUrl,
          fileHash: result.data.fileHash,
          success: true,
        };
      } else {
        throw new Error(result.error || 'Upload failed');
      }
    } catch (error) {
      console.error('Storj upload error:', error);
      toast.error('Failed to upload file to Storj');
      return {
        fileUrl: '',
        fileHash: '',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    } finally {
      setIsUploading(false);
    }
  };

  const generateFileHash = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          // Простая хеш-функция для демонстрации
          // В продакшене используйте более надежный алгоритм
          const arrayBuffer = e.target.result as ArrayBuffer;
          const uint8Array = new Uint8Array(arrayBuffer);
          let hash = 0;
          for (let i = 0; i < uint8Array.length; i++) {
            hash = ((hash << 5) - hash) + uint8Array[i];
            hash = hash & hash; // Convert to 32-bit integer
          }
          resolve(hash.toString(16));
        } else {
          reject(new Error('Failed to read file'));
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsArrayBuffer(file);
    });
  };

  return {
    uploadToStorj,
    generateFileHash,
    isUploading,
  };
} 