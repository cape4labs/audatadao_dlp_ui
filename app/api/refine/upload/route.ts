import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const walletAddress = formData.get('walletAddress') as string;
    const fileType = formData.get('fileType') as string;

    if (!file || !walletAddress) {
      return NextResponse.json(
        { error: "Missing required fields: file and walletAddress" },
        { status: 400 }
      );
    }

    // Проверяем, что файл имеет правильный тип
    if (fileType !== 'audio/ogg' && !file.name.toLowerCase().endsWith('.ogg')) {
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

    // Создаем уникальный ID для файла
    const fileId = `${walletAddress}_${Date.now()}_${file.name}`;

                    // TODO: INTEGRATION WITH REFINER BACKEND
                // Здесь нужно интегрировать с вашим refiner бэкендом для обработки .ogg файлов
                //
                // 1. Создайте эндпоинт на вашем refiner бэкенде для загрузки файлов
                // 2. Раскомментируйте код ниже и замените URL на ваш
                // 3. Добавьте необходимые заголовки авторизации
                // 4. Обработайте ответ от refiner (успех/ошибка)
                //
                // Структура метаданных для отправки на refiner:
                const uploadData = {
                  fileId,
                  fileName: file.name,
                  fileSize: file.size,
                  fileType: file.type,
                  walletAddress,
                  uploadedAt: new Date().toISOString(),
                };

                // Раскомментируйте и настройте для интеграции с вашим refiner:
                // const refinerUrl = process.env.REFINER_API_URL;
                // if (refinerUrl) {
                //   const refinerFormData = new FormData();
                //   refinerFormData.append('file', file);
                //   refinerFormData.append('metadata', JSON.stringify(uploadData));
                //
                //   const response = await fetch(`${refinerUrl}/upload`, {
                //     method: 'POST',
                //     headers: {
                //       'Authorization': `Bearer ${process.env.REFINER_API_KEY}`,
                //     },
                //     body: refinerFormData,
                //   });
                //
                //   if (!response.ok) {
                //     throw new Error('Failed to upload to refiner');
                //   }
                //
                //   const refinerResult = await response.json();
                //   console.log('Refiner upload result:', refinerResult);
                // }

    // Логирование для отладки
    console.log('File upload data:', uploadData);

    return NextResponse.json({
      success: true,
      message: "File uploaded successfully",
      data: {
        fileId,
        fileName: file.name,
        fileSize: file.size,
        uploadedAt: uploadData.uploadedAt,
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