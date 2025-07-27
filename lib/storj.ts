import AWS from 'aws-sdk';
import { RefinerMetadata, StorjUploadResult } from '@/types/refiner';

// TODO: INTEGRATION WITH STORJ
// Конфигурация для работы с Storj (совместим с AWS S3)
// 
// 1. Настройте переменные окружения в .env.local:
//    STORJ_ACCESS_KEY=your_storj_access_key
//    STORJ_SECRET_KEY=your_storj_secret_key
//
// 2. Создайте bucket в Storj для хранения аудио файлов
// 3. Настройте CORS для bucket если необходимо
// 4. Обновите endpoint URL на ваш Storj endpoint

const s3 = new AWS.S3({
  accessKeyId: process.env.STORJ_ACCESS_KEY,
  secretAccessKey: process.env.STORJ_SECRET_KEY,
  endpoint: 'https://gateway.storjshare.io/', // Storj gateway endpoint
  s3ForcePathStyle: true, // Необходимо для Storj
  signatureVersion: 'v4',
  region: 'us-east-1', // Любой регион для Storj
});

const BUCKET_NAME = 'my-bucket'; // Замените на ваш bucket

/**
 * Загружает аудио файл в Storj
 * @param file - Аудио файл для загрузки
 * @param walletAddress - Адрес кошелька пользователя
 * @returns Результат загрузки с URL файла
 */
export async function uploadAudioToStorj(
  file: File,
  walletAddress: string
): Promise<StorjUploadResult> {
  try {
    // Создаем уникальный ключ для файла
    const fileKey = `audio/${walletAddress}/${Date.now()}_${file.name}`;
    
    // Конвертируем файл в Buffer
    const fileBuffer = await file.arrayBuffer();
    
    // Загружаем файл в Storj
    const uploadParams = {
      Bucket: BUCKET_NAME,
      Key: fileKey,
      Body: Buffer.from(fileBuffer),
      ContentType: file.type,
      Metadata: {
        'wallet-address': walletAddress,
        'original-filename': file.name,
        'upload-timestamp': new Date().toISOString(),
      },
    };

    const result = await s3.upload(uploadParams).promise();
    
    // Формируем URL для доступа к файлу
    const fileUrl = `https://gateway.storjshare.io/${BUCKET_NAME}/${fileKey}`;
    
    return {
      success: true,
      fileUrl,
      fileKey,
    };
  } catch (error) {
    console.error('Error uploading to Storj:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Создает метаданные для refiner на основе загруженного файла
 * @param file - Аудио файл
 * @param walletAddress - Адрес кошелька
 * @param fileUrl - URL файла в Storj
 * @param userData - Данные пользователя из onboarding
 * @returns Метаданные для refiner
 */
export function createRefinerMetadata(
  file: File,
  walletAddress: string,
  fileUrl: string,
  userData?: {
    country?: string;
    birthYear?: string;
    isItRelated?: boolean;
  }
): RefinerMetadata {
  // Вычисляем длительность аудио (в секундах)
  // В реальном приложении нужно использовать Web Audio API для получения длительности
  const audioLength = Math.floor(file.size / 16000).toString(); // Примерная оценка
  
  // Определяем возраст на основе года рождения
  const currentYear = new Date().getFullYear();
  const age = userData?.birthYear 
    ? (currentYear - parseInt(userData.birthYear)).toString()
    : '25'; // Значение по умолчанию
  
  // Определяем страну
  const countryCode = userData?.country?.toLowerCase() === 'russia' ? 'ru' : 'en';
  
  // Определяем профессию
  const occupation = userData?.isItRelated ? 'Developer' : 'Other';
  
  return {
    audio_length: audioLength,
    audio_source: 'web_upload',
    audio_type: 'speech',
    user: {
      user_id: walletAddress,
      age,
      country_code: countryCode,
      occupation,
      language_code: countryCode,
      region: userData?.country || 'Unknown',
    },
  };
}

/**
 * Удаляет файл из Storj (если необходимо)
 * @param fileKey - Ключ файла в Storj
 * @returns Результат удаления
 */
export async function deleteAudioFromStorj(fileKey: string): Promise<boolean> {
  try {
    await s3.deleteObject({
      Bucket: BUCKET_NAME,
      Key: fileKey,
    }).promise();
    
    return true;
  } catch (error) {
    console.error('Error deleting from Storj:', error);
    return false;
  }
} 