import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { address, chainId, connectedAt, lastActivity } = body;

    // Валидация входных данных
    if (!address || !chainId) {
      return NextResponse.json(
        { error: "Missing required fields: address and chainId" },
        { status: 400 }
      );
    }

                    // TODO: INTEGRATION WITH BACKEND
                // Здесь нужно интегрировать с вашим бэкендом для регистрации кошельков
                // 
                // 1. Создайте эндпоинт на вашем бэкенде для регистрации кошельков
                // 2. Раскомментируйте код ниже и замените URL на ваш
                // 3. Добавьте необходимые заголовки авторизации
                // 4. Обработайте ответ от бэкенда (успех/ошибка)
                //
                // Пример структуры данных для отправки:
                const walletData = {
                  address,
                  chainId,
                  connectedAt: connectedAt || new Date().toISOString(),
                  lastActivity: lastActivity || new Date().toISOString(),
                  registeredAt: new Date().toISOString(),
                };

                // Раскомментируйте и настройте для интеграции с вашим бэкендом:
                // const backendUrl = process.env.BACKEND_API_URL;
                // if (backendUrl) {
                //   const response = await fetch(`${backendUrl}/api/wallets`, {
                //     method: 'POST',
                //     headers: {
                //       'Content-Type': 'application/json',
                //       'Authorization': `Bearer ${process.env.BACKEND_API_KEY}`,
                //     },
                //     body: JSON.stringify(walletData),
                //   });
                //
                //   if (!response.ok) {
                //     throw new Error('Failed to register wallet on backend');
                //   }
                // }

    // Логирование для отладки
    console.log('Wallet registration data:', walletData);

    return NextResponse.json({
      success: true,
      message: "Wallet registered successfully",
      data: walletData,
    });

  } catch (error) {
    console.error("Error registering wallet:", error);
    return NextResponse.json(
      { error: "Failed to register wallet" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get('address');

    if (!address) {
      return NextResponse.json(
        { error: "Address parameter is required" },
        { status: 400 }
      );
    }

                    // TODO: INTEGRATION WITH BACKEND
                // Здесь нужно интегрировать с вашим бэкендом для получения данных о кошельке
                //
                // 1. Создайте эндпоинт на вашем бэкенде для получения данных кошелька
                // 2. Раскомментируйте код ниже и замените URL на ваш
                // 3. Добавьте необходимые заголовки авторизации
                // 4. Обработайте ответ от бэкенда
                //
                // Раскомментируйте и настройте для интеграции с вашим бэкендом:
                // const backendUrl = process.env.BACKEND_API_URL;
                // if (backendUrl) {
                //   const response = await fetch(`${backendUrl}/api/wallets/${address}`, {
                //     headers: {
                //       'Authorization': `Bearer ${process.env.BACKEND_API_KEY}`,
                //     },
                //   });
                //
                //   if (response.ok) {
                //     const walletData = await response.json();
                //     return NextResponse.json(walletData);
                //   }
                // }

    // Временный ответ для демонстрации
    return NextResponse.json({
      address,
      chainId: 14800,
      connectedAt: new Date().toISOString(),
      lastActivity: new Date().toISOString(),
      isRegistered: true,
    });

  } catch (error) {
    console.error("Error fetching wallet data:", error);
    return NextResponse.json(
      { error: "Failed to fetch wallet data" },
      { status: 500 }
    );
  }
} 