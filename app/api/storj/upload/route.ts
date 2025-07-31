import { NextRequest, NextResponse } from "next/server";
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const walletAddress = formData.get('walletAddress') as string;

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

    // TODO: INTEGRATION WITH STORJ
    // Здесь нужно интегрировать с реальным Storj API
    // 
    // 1. Настройте Storj SDK
    // 2. Создайте bucket если не существует
    // 3. Загрузите файл в Storj
    // 4. Получите URL файла
    //
    // Раскомментируйте код ниже для интеграции:

    // import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
    // 
    // const s3Client = new S3Client({
    //   endpoint: process.env.STORJ_ENDPOINT || 'https://gateway.storjshare.io',
    //   region: 'us-east-1',
    //   credentials: {
    //     accessKeyId: process.env.STORJ_ACCESS_KEY!,
    //     secretAccessKey: process.env.STORJ_SECRET_KEY!,
    //   },
    // });
    //
    // const fileBuffer = await file.arrayBuffer();
    // const fileName = `${walletAddress}_${Date.now()}_${file.name}`;
    //
    // const uploadCommand = new PutObjectCommand({
    //   Bucket: process.env.STORJ_BUCKET_NAME!,
    //   Key: fileName,
    //   Body: Buffer.from(fileBuffer),
    //   ContentType: file.type,
    // });
    //
    // await s3Client.send(uploadCommand);
    //
    // const fileUrl = `https://gateway.storjshare.io/${process.env.STORJ_BUCKET_NAME}/${fileName}`;

    // Временная реализация для демонстрации
    const fileBuffer = await file.arrayBuffer();
    const fileName = `${walletAddress}_${Date.now()}_${file.name}`;
    
    // Генерируем хеш файла
    const fileHash = crypto.createHash('sha256').update(Buffer.from(fileBuffer)).digest('hex');
    
    // Временный URL (замените на реальный Storj URL)
    const fileUrl = `https://gateway.storjshare.io/bucket/${fileName}`;

    const uploadData = {
      fileId: fileName,
      fileName: file.name,
      fileSize: file.size,
      fileHash: fileHash,
      fileUrl: fileUrl,
      walletAddress,
      uploadedAt: new Date().toISOString(),
    };

    console.log('Storj upload data:', uploadData);

    return NextResponse.json({
      success: true,
      message: "File uploaded successfully to Storj",
      data: {
        fileId: uploadData.fileId,
        fileName: file.name,
        fileSize: file.size,
        fileHash: uploadData.fileHash,
        fileUrl: uploadData.fileUrl,
        uploadedAt: uploadData.uploadedAt,
      },
    });

  } catch (error) {
    console.error("Error uploading file to Storj:", error);
    return NextResponse.json(
      { error: "Failed to upload file to Storj" },
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

    // TODO: INTEGRATION WITH STORJ BACKEND
    // Здесь нужно интегрировать с вашим Storj бэкендом для получения списка файлов
    //
    // 1. Создайте эндпоинт на вашем Storj бэкенде для получения списка файлов
    // 2. Раскомментируйте код ниже и замените URL на ваш
    // 3. Добавьте необходимые заголовки авторизации
    // 4. Обработайте ответ от Storj
    //
    // Раскомментируйте и настройте для интеграции с вашим Storj:
    // const storjUrl = process.env.STORJ_API_URL;
    // if (storjUrl) {
    //   const response = await fetch(`${storjUrl}/files?walletAddress=${walletAddress}`, {
    //     headers: {
    //       'Authorization': `Bearer ${process.env.STORJ_API_KEY}`,
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