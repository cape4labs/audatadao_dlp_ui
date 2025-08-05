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

    if (!file.name.toLowerCase().endsWith('.ogg')) {
      return NextResponse.json(
        { error: "Only .ogg audio files are allowed" },
        { status: 400 }
      );
    }

    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "File size exceeds maximum limit of 50MB" },
        { status: 400 }
      );
    }

    // Формируем user-метаданные для refiner
    const user = {
      wallet_address: userData?.walletAddress || walletAddress,
      birth_month: userData?.birthMonth || null,
      birth_year: userData?.birthYear || null,
      occupation: userData?.occupation || null,
      country: userData?.country || null,
      region: userData?.region || null,
    };

    // Формируем payload для refiner
    const refinerPayload = {
      language_code: "ru",
      audio_length: Math.round(file.size / 1024).toString(), // длина в КБ, как строка
      audio_source: "telegram",
      audio_type: "speech",
      user,
    };

    // Готовим form-data для отправки в refiner
    const refinerForm = new FormData();
    refinerForm.append("file", file, file.name);
    refinerForm.append("metadata", JSON.stringify(refinerPayload));

    // Получаем путь к refiner из .env
    const refinerEndpoint = process.env.REFINEMENT_ENDPOINT?.replace(/(^"|"$)/g, "");
    if (!refinerEndpoint) {
      return NextResponse.json(
        { error: "Refiner endpoint is not configured" },
        { status: 500 }
      );
    }

    // Отправляем файл и метаданные в refiner
    const refinerRes = await fetch(`${refinerEndpoint}/upload`, {
      method: "POST",
      body: refinerForm,
    });

    if (!refinerRes.ok) {
      const err = await refinerRes.text();
      return NextResponse.json(
        { error: "Refiner error: " + err },
        { status: 500 }
      );
    }

    const refinerData = await refinerRes.json();

    return NextResponse.json({
      success: true,
      message: 'File processed successfully',
      data: {
        fileId,
        fileName: file.name,
        fileSize: file.size,
        processedAt: new Date().toISOString(),
        status: 'completed',
        refiner: refinerData,
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