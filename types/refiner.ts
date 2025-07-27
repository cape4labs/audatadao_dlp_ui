// TODO: REFINER INTEGRATION TYPES
// Типы для интеграции с refiner API
//
// 1. Обновите типы в соответствии с вашим refiner API
// 2. Добавьте дополнительные поля если необходимо
// 3. Используйте эти типы в lib/storj.ts и API routes

export interface RefinerMetadata {
  audio_length: string;
  audio_source: string;
  audio_type: string;
  user: {
    user_id: string;
    age: string;
    country_code: string;
    occupation: string;
    language_code: string;
    region: string;
  };
}

export interface RefinerRequest {
  refiner_id: string;
  audio_url: string;
  metadata: RefinerMetadata;
}

export interface RefinerResponse {
  success: boolean;
  job_id?: string;
  status?: string;
  error?: string;
  result?: any;
}

export interface StorjUploadResult {
  success: boolean;
  fileUrl?: string;
  fileKey?: string;
  error?: string;
}

export interface UserOnboardingData {
  walletAddress: string;
  country: string;
  birthMonth: string;
  birthYear: string;
  isItRelated: boolean;
  submittedAt: string;
} 