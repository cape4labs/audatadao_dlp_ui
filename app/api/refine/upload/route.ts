import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const walletAddress = formData.get('walletAddress') as string;
    const fileId = formData.get('fileId') as string;
    const userData = formData.get('userData') ? JSON.parse(formData.get('userData') as string) : null;

    if (!file || !walletAddress || !fileId) {
      return NextResponse.json(
        { error: "Missing required fields: file, walletAddress, and fileId" },
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

    // Создаем метаданные для обработки
    const metadata = {
      fileId,
      fileName: file.name,
      fileSize: file.size,
      walletAddress,
      uploadedAt: new Date().toISOString(),
      fileType: 'audio/ogg',
      userData: userData || null,
    };

    // Имитируем обработку файла (в реальном проекте здесь была бы интеграция с refiner)
    console.log('Processing file:', {
      fileId,
      fileName: file.name,
      fileSize: file.size,
      walletAddress,
      userData: userData ? 'present' : 'not present',
    });

    // Имитируем задержку обработки
    await new Promise(resolve => setTimeout(resolve, 1000));

    return NextResponse.json({
      success: true,
      message: 'File processed successfully',
      data: {
        fileId,
        fileName: file.name,
        fileSize: file.size,
        processedAt: new Date().toISOString(),
        status: 'completed',
      },
    });

  } catch (error) {
    console.error("Error processing file:", error);
    return NextResponse.json(
      { error: "Failed to process file" },
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

    // Возвращаем список обработанных файлов (в реальном проекте это было бы из базы данных)
    return NextResponse.json({
      files: [],
      message: 'No processed files found',
    });

  } catch (error) {
    console.error("Error fetching processed files:", error);
    return NextResponse.json(
      { error: "Failed to fetch processed files" },
      { status: 500 }
    );
  }
} 