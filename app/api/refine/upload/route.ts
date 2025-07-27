import { NextRequest, NextResponse } from "next/server";
import { uploadAudioToStorj, createRefinerMetadata } from "@/lib/storj";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const walletAddress = formData.get('walletAddress') as string;
    const userData = formData.get('userData') ? JSON.parse(formData.get('userData') as string) : null;

    if (!file || !walletAddress) {
      return NextResponse.json(
        { error: "Missing required fields: file and walletAddress" },
        { status: 400 }
      );
    }

    // Проверяем, что файл имеет правильный тип
    if (!file.name.toLowerCase().endsWith('.ogg')) {
      return NextResponse.json(
        { error: "Only .ogg audio files are allowed" },
        { status: 400 }
      );
    }

    // Проверяем размер файла (максимум 50MB)
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "File size exceeds maximum limit of 50MB" },
        { status: 400 }
      );
    }

    // TODO: INTEGRATION WITH STORJ AND REFINER
    // 
    // 1. Загружаем файл в Storj
    // 2. Получаем URL файла из Storj
    // 3. Создаем метаданные для refiner
    // 4. Отправляем метаданные в refiner
    //
    // Раскомментируйте код ниже для интеграции:

    // // Шаг 1: Загружаем файл в Storj
    // const storjResult = await uploadAudioToStorj(file, walletAddress);
    // if (!storjResult.success) {
    //   throw new Error(`Failed to upload to Storj: ${storjResult.error}`);
    // }

    // // Шаг 2: Создаем метаданные для refiner
    // const metadata = createRefinerMetadata(
    //   file, 
    //   walletAddress, 
    //   storjResult.fileUrl!, 
    //   userData
    // );

    // // Шаг 3: Отправляем метаданные в refiner
    // const refinerUrl = process.env.REFINEMENT_ENDPOINT;
    // const refinerId = process.env.REFINER_ID;
    // const encryptionKey = process.env.REFINEMENT_ENCRYPTION_KEY;

    // if (refinerUrl && refinerId && encryptionKey) {
    //   const refinerResponse = await fetch(`${refinerUrl}/refine`, {
    //     method: 'POST',
    //     headers: {
    //       'Content-Type': 'application/json',
    //       'Authorization': `Bearer ${encryptionKey}`,
    //     },
    //     body: JSON.stringify({
    //       refiner_id: refinerId,
    //       audio_url: storjResult.fileUrl,
    //       metadata: metadata,
    //     }),
    //   });

    //   if (!refinerResponse.ok) {
    //     throw new Error('Failed to send to refiner');
    //   }

    //   const refinerResult = await refinerResponse.json();
    //   console.log('Refiner result:', refinerResult);
    // }

    // Временные данные для демонстрации
    const uploadData = {
      fileId: `${walletAddress}_${Date.now()}_${file.name}`,
      fileName: file.name,
      fileSize: file.size,
      walletAddress,
      uploadedAt: new Date().toISOString(),
      storjUrl: 'https://gateway.storjshare.io/bucket/audio/file.ogg', // Пример URL
      metadata: {
        audio_length: Math.floor(file.size / 16000).toString(),
        audio_source: 'web_upload',
        audio_type: 'speech',
        user: {
          user_id: walletAddress,
          age: '25',
          country_code: 'en',
          occupation: 'Developer',
          language_code: 'en',
          region: 'Unknown',
        },
      },
    };

    console.log('File upload data:', uploadData);

    return NextResponse.json({
      success: true,
      message: "File uploaded successfully to Storj and sent to refiner",
      data: {
        fileId: uploadData.fileId,
        fileName: file.name,
        fileSize: file.size,
        uploadedAt: uploadData.uploadedAt,
        storjUrl: uploadData.storjUrl,
        metadata: uploadData.metadata,
      },
    });

  } catch (error) {
    console.error("Error uploading file:", error);
    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const walletAddress = searchParams.get('walletAddress');

    if (!walletAddress) {
      return NextResponse.json(
        { error: "Wallet address parameter is required" },
        { status: 400 }
      );
    }

                    // TODO: INTEGRATION WITH REFINER BACKEND
                // Здесь нужно интегрировать с вашим refiner бэкендом для получения списка файлов
                //
                // 1. Создайте эндпоинт на вашем refiner бэкенде для получения списка файлов
                // 2. Раскомментируйте код ниже и замените URL на ваш
                // 3. Добавьте необходимые заголовки авторизации
                // 4. Обработайте ответ от refiner
                //
                // Раскомментируйте и настройте для интеграции с вашим refiner:
                // const refinerUrl = process.env.REFINER_API_URL;
                // if (refinerUrl) {
                //   const response = await fetch(`${refinerUrl}/files?walletAddress=${walletAddress}`, {
                //     headers: {
                //       'Authorization': `Bearer ${process.env.REFINER_API_KEY}`,
                //     },
                //   });
                //
                //   if (response.ok) {
                //     const files = await response.json();
                //     return NextResponse.json(files);
                //   }
                // }

    // Временный ответ для демонстрации
    return NextResponse.json({
      walletAddress,
      files: [],
      totalFiles: 0,
    });

  } catch (error) {
    console.error("Error fetching uploaded files:", error);
    return NextResponse.json(
      { error: "Failed to fetch uploaded files" },
      { status: 500 }
    );
  }
} 