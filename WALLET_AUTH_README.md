# VANA DLP Wallet Authentication

Этот проект был обновлен для использования аутентификации через кошелек вместо Google OAuth.

## Основные изменения

### 1. Удалена Google OAuth аутентификация
- Удалены зависимости NextAuth.js
- Удалены Google API интеграции
- Удалены компоненты для работы с Google Drive

### 2. Добавлена аутентификация через кошелек
- Используется Wagmi для подключения кошельков
- Данные о кошельке сохраняются в Zustand store
- Автоматическая отправка данных на бэкенд при подключении

### 3. Новые компоненты
- `WalletLoginButton` - кнопка подключения кошелька
- `WalletUserProfile` - профиль пользователя с информацией о кошельке
- `useWalletAuth` - хук для управления состоянием аутентификации

### 4. API маршруты
- `/api/wallet/register` - регистрация кошелька на бэкенде
- `/api/wallet/register?address=...` - получение данных о кошельке

## Настройка

### 1. Переменные окружения
Скопируйте `env.example` в `.env.local` и заполните необходимые переменные:

```env
# VANA Blockchain Configuration
NEXT_PUBLIC_CHAIN_ID=14800
NEXT_PUBLIC_RPC_URL=https://rpc.moksha.vana.org
NEXT_PUBLIC_DLP_CONTRACT_ADDRESS=0x0161DFbf70a912668dd1B4365b43c1348e8bD3ab

# Backend API Configuration
BACKEND_API_URL=https://your_backend_api_url_here
BACKEND_API_KEY=your_backend_api_key_here
```

### 2. Настройка бэкенда
В файле `app/api/wallet/register/route.ts` раскомментируйте и настройте отправку данных на ваш бэкенд:

```typescript
const backendUrl = process.env.BACKEND_API_URL;
if (backendUrl) {
  const response = await fetch(`${backendUrl}/api/wallets`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.BACKEND_API_KEY}`,
    },
    body: JSON.stringify(walletData),
  });
}
```

## Структура данных кошелька

При подключении кошелька сохраняются следующие данные:

```typescript
interface WalletUser {
  address: Address;        // Адрес кошелька
  chainId: number;         // ID сети (14800 для Moksha testnet)
  connectedAt: Date;       // Время подключения
  lastActivity: Date;      // Последняя активность
}
```

## API Endpoints

### POST /api/wallet/register
Регистрирует новый кошелек на бэкенде.

**Request Body:**
```json
{
  "address": "0x...",
  "chainId": 14800,
  "connectedAt": "2024-01-01T00:00:00.000Z",
  "lastActivity": "2024-01-01T00:00:00.000Z"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Wallet registered successfully",
  "data": {
    "address": "0x...",
    "chainId": 14800,
    "connectedAt": "2024-01-01T00:00:00.000Z",
    "lastActivity": "2024-01-01T00:00:00.000Z",
    "registeredAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### GET /api/wallet/register?address=0x...
Получает данные о кошельке с бэкенда.

**Response:**
```json
{
  "address": "0x...",
  "chainId": 14800,
  "connectedAt": "2024-01-01T00:00:00.000Z",
  "lastActivity": "2024-01-01T00:00:00.000Z",
  "isRegistered": true
}
```

## Использование

### Подключение кошелька
```typescript
import { useWalletAuth } from '@/lib/auth/walletAuth';

const { connect, isConnected, user } = useWalletAuth();

// Кошелек автоматически подключается при выборе в модальном окне
```

### Получение данных пользователя
```typescript
const { user, isConnected } = useWalletAuth();

if (isConnected && user) {
  console.log('Wallet address:', user.address);
  console.log('Chain ID:', user.chainId);
  console.log('Connected at:', user.connectedAt);
}
```

### Отключение кошелька
```typescript
const { disconnect } = useWalletAuth();

const handleDisconnect = () => {
  disconnect();
};
```

## Безопасность

- Все данные о кошельке сохраняются локально в localStorage
- При подключении данные автоматически отправляются на бэкенд
- Адрес кошелька используется для идентификации пользователя
- Поддерживается работа с несколькими сетями (Moksha testnet, VANA mainnet)

## Миграция с Google OAuth

Если у вас есть существующие пользователи с Google OAuth, вам нужно будет:

1. Создать систему миграции данных
2. Связать Google аккаунты с адресами кошельков
3. Обновить бэкенд для поддержки новой системы аутентификации

## Дальнейшее развитие

- Добавить поддержку подписи сообщений для дополнительной безопасности
- Реализовать систему ролей и разрешений
- Добавить поддержку мульти-кошельков
- Интегрировать с другими блокчейн-сетями 