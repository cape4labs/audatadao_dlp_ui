import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate the request body
    const { userAddress, country, birthMonth, birthYear, isItRelated } = body;
    
    if (!userAddress || !country || !birthMonth || !birthYear || isItRelated === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // In a real application, you would save this to a database
    // For now, we'll just log it and return success
    console.log('Onboarding data received:', {
      userAddress,
      country,
      birthMonth,
      birthYear,
      isItRelated,
      submittedAt: new Date().toISOString()
    });

    return NextResponse.json({
      success: true,
      message: 'Onboarding data saved successfully',
      data: {
        userAddress,
        country,
        birthMonth,
        birthYear,
        isItRelated,
        submittedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error processing onboarding data:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
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
    // For now, return empty data since backend is not configured
    return NextResponse.json({ 
      success: true,
      onboardingData: null 
    });

  } catch (error) {
    console.error("Error fetching onboarding data:", error);
    return NextResponse.json(
      { error: "Failed to fetch onboarding data" },
      { status: 500 }
    );
  }
} 