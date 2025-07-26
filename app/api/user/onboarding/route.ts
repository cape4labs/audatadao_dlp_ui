import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { walletAddress, country, birthMonth, birthYear, isItRelated, submittedAt } = body;

    // Валидация входных данных
    if (!walletAddress || !country || !birthMonth || !birthYear || !isItRelated) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const onboardingData = {
      walletAddress,
      country,
      birthMonth,
      birthYear,
      isItRelated,
      submittedAt: submittedAt || new Date().toISOString(),
    };

    // TODO: INTEGRATION WITH BACKEND
    // Здесь нужно интегрировать с вашим бэкендом для сохранения данных onboarding
    //
    // 1. Создайте эндпоинт на вашем бэкенде для сохранения данных onboarding
    // 2. Раскомментируйте код ниже и замените URL на ваш
    // 3. Добавьте необходимые заголовки авторизации
    // 4. Обработайте ответ от бэкенда (успех/ошибка)
    //
    // Раскомментируйте и настройте для интеграции с вашим бэкендом:
    // const backendUrl = process.env.BACKEND_API_URL;
    // if (backendUrl) {
    //   const response = await fetch(`${backendUrl}/api/users/onboarding`, {
    //     method: 'POST',
    //     headers: {
    //       'Content-Type': 'application/json',
    //       'Authorization': `Bearer ${process.env.BACKEND_API_KEY}`,
    //     },
    //     body: JSON.stringify(onboardingData),
    //   });
    //   
    //   if (!response.ok) {
    //     throw new Error('Failed to submit onboarding data to backend');
    //   }
    // }

    // Логирование для отладки
    console.log('User onboarding data:', onboardingData);

    return NextResponse.json({
      success: true,
      message: "Onboarding data submitted successfully",
      data: onboardingData,
    });

  } catch (error) {
    console.error("Error submitting onboarding data:", error);
    return NextResponse.json(
      { error: "Failed to submit onboarding data" },
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

    // TODO: INTEGRATION WITH BACKEND
    // Здесь нужно интегрировать с вашим бэкендом для получения данных onboarding
    //
    // 1. Создайте эндпоинт на вашем бэкенде для получения данных onboarding
    // 2. Раскомментируйте код ниже и замените URL на ваш
    // 3. Добавьте необходимые заголовки авторизации
    // 4. Обработайте ответ от бэкенда
    //
    // Раскомментируйте и настройте для интеграции с вашим бэкендом:
    // const backendUrl = process.env.BACKEND_API_URL;
    // if (backendUrl) {
    //   const response = await fetch(`${backendUrl}/api/users/onboarding/${walletAddress}`, {
    //     headers: {
    //       'Authorization': `Bearer ${process.env.BACKEND_API_KEY}`,
    //     },
    //   });
    //   
    //   if (response.ok) {
    //     const onboardingData = await response.json();
    //     return NextResponse.json(onboardingData);
    //   }
    // }

    // Временный ответ для демонстрации
    return NextResponse.json({
      walletAddress,
      hasCompletedOnboarding: false,
      onboardingData: null,
    });

  } catch (error) {
    console.error("Error fetching onboarding data:", error);
    return NextResponse.json(
      { error: "Failed to fetch onboarding data" },
      { status: 500 }
    );
  }
} 