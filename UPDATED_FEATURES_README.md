# VANA DLP - Обновленные функции

## Новые функции

### 1. Onboarding для новых пользователей

При первом подключении кошелька пользователи проходят onboarding процесс:

#### Собираемые данные:
- **Страна** - автоматически определяется по геолокации, но можно изменить
- **Месяц рождения** - выбор из списка месяцев
- **Год рождения** - выбор из последних 50 лет
- **Связь с IT** - да/нет вопрос о работе в IT сфере

#### API Endpoints:
- `POST /api/user/onboarding` - отправка данных onboarding
- `GET /api/user/onboarding?walletAddress=...` - проверка статуса onboarding

#### Структура данных:
```typescript
interface OnboardingData {
  walletAddress: string;
  country: string;
  birthMonth: string;
  birthYear: string;
  isItRelated: "yes" | "no";
  submittedAt: string;
}
```

### 2. Загрузка .ogg файлов

Пользователи могут загружать только .ogg аудио файлы:

#### Ограничения:
- Только файлы с расширением .ogg
- Максимальный размер: 50MB
- Drag & drop интерфейс
- Множественная загрузка

#### API Endpoints:
- `POST /api/refine/upload` - загрузка файла на refiner
- `GET /api/refine/upload?walletAddress=...` - список загруженных файлов

#### Структура данных файла:
```typescript
interface FileUploadData {
  fileId: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  walletAddress: string;
  uploadedAt: string;
}
```

## Настройка

### 1. Переменные окружения

Добавьте в `.env.local`:

```env
# Backend API Configuration
BACKEND_API_URL=https://your_backend_api_url_here
BACKEND_API_KEY=your_backend_api_key_here

# Refiner API Configuration
REFINER_API_URL=https://your_refiner_api_url_here
REFINER_API_KEY=your_refiner_api_key_here
```

### 2. Настройка бэкенда для onboarding

В файле `app/api/user/onboarding/route.ts` раскомментируйте и настройте:

```typescript
const backendUrl = process.env.BACKEND_API_URL;
if (backendUrl) {
  const response = await fetch(`${backendUrl}/api/users/onboarding`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.BACKEND_API_KEY}`,
    },
    body: JSON.stringify(onboardingData),
  });
}
```

### 3. Настройка refiner для загрузки файлов

В файле `app/api/refine/upload/route.ts` раскомментируйте и настройте:

```typescript
const refinerUrl = process.env.REFINER_API_URL;
if (refinerUrl) {
  const refinerFormData = new FormData();
  refinerFormData.append('file', file);
  refinerFormData.append('metadata', JSON.stringify(uploadData));
  
  const response = await fetch(`${refinerUrl}/upload`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.REFINER_API_KEY}`,
    },
    body: refinerFormData,
  });
}
```

## Пользовательский опыт

### 1. Подключение кошелька
1. Пользователь подключает кошелек
2. Данные о кошельке автоматически отправляются на бэкенд
3. Проверяется статус onboarding

### 2. Onboarding (для новых пользователей)
1. Показывается форма с вопросами
2. Автоматически определяется страна по геолокации
3. Пользователь заполняет остальные поля
4. Данные отправляются на бэкенд

### 3. Загрузка .ogg файлов
1. Пользователь перетаскивает .ogg файлы в зону загрузки
2. Файлы валидируются (тип и размер)
3. Файлы отправляются на refiner для обработки
4. Показывается статус загрузки и список загруженных файлов

## Безопасность

- Все данные onboarding шифруются при передаче
- Файлы проверяются на тип и размер
- Адрес кошелька используется для идентификации
- Поддерживается только .ogg формат для аудио файлов

## API Спецификации

### Onboarding API

#### POST /api/user/onboarding
```json
{
  "walletAddress": "0x...",
  "country": "United States",
  "birthMonth": "January",
  "birthYear": "1990",
  "isItRelated": "yes"
}
```

#### GET /api/user/onboarding?walletAddress=0x...
```json
{
  "walletAddress": "0x...",
  "hasCompletedOnboarding": true,
  "onboardingData": {
    "country": "United States",
    "birthMonth": "January",
    "birthYear": "1990",
    "isItRelated": "yes"
  }
}
```

### File Upload API

#### POST /api/refine/upload
```form-data
file: [.ogg file]
walletAddress: "0x..."
fileType: "audio/ogg"
```

#### GET /api/refine/upload?walletAddress=0x...
```json
{
  "walletAddress": "0x...",
  "files": [
    {
      "fileId": "0x..._1234567890_audio.ogg",
      "fileName": "audio.ogg",
      "fileSize": 1024000,
      "uploadedAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "totalFiles": 1
}
```

## Дальнейшее развитие

- Добавить поддержку других аудио форматов
- Реализовать прогресс-бар для загрузки больших файлов
- Добавить предварительный просмотр аудио файлов
- Интегрировать с IPFS для децентрализованного хранения
- Добавить систему уведомлений о статусе обработки файлов 