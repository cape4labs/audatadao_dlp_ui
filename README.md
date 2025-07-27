# VANA DLP UI Template

A Next.js application for VANA Data Liquidity Pool integration with wallet authentication, user onboarding, and audio file uploads.

## Features

- **Wallet Authentication**: Connect EVM wallets (MetaMask, Coinbase Wallet)
- **User Onboarding**: Collect user information (country, birth date, IT-related status)
- **Audio File Upload**: Upload .ogg files to refiner backend
- **IPFS Storage**: Encrypted data storage on blockchain
- **Modern UI**: Built with Tailwind CSS and Radix UI components

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Authentication**: Wagmi, Viem, Zustand
- **UI**: Tailwind CSS, Radix UI, Lucide React
- **File Upload**: react-dropzone
- **Notifications**: Sonner
- **Blockchain**: VANA Network integration

## Getting Started

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Set up environment variables**:
   ```bash
   cp env.example .env.local
   ```
   Then edit `.env.local` with your configuration.

3. **Run the development server**:
   ```bash
   npm run dev
   ```

4. **Open your browser** and navigate to `http://localhost:3000`

## Environment Variables

Create a `.env.local` file with the following variables:

```env
# Backend API Configuration
BACKEND_API_URL=https://your_backend_api_url_here
BACKEND_API_KEY=your_backend_api_key_here

# Refiner API Configuration (для загрузки .ogg файлов)
REFINER_API_URL=https://your_refiner_api_url_here
REFINER_API_KEY=your_refiner_api_key_here
```

## API Endpoints

### Wallet Registration
- `POST /api/wallet/register` - Register wallet connection
- `GET /api/wallet/register?address={address}` - Get wallet data

### User Onboarding
- `POST /api/user/onboarding` - Submit onboarding data
- `GET /api/user/onboarding?walletAddress={address}` - Get onboarding status

### File Upload
- `POST /api/refine/upload` - Upload .ogg files to refiner
- `GET /api/refine/upload?walletAddress={address}` - Get uploaded files

## Project Structure

```
├── app/
│   ├── api/                    # API routes
│   │   ├── wallet/            # Wallet registration
│   │   ├── user/              # User onboarding
│   │   └── refine/            # File upload to refiner
│   ├── auth/                  # Authentication components
│   ├── components/            # UI components
│   ├── contribution/          # File upload components
│   ├── profile/              # User profile components
│   └── providers/            # React providers
├── components/               # Shared UI components
├── lib/                     # Utilities and configurations
├── contracts/               # Blockchain contract addresses
└── types/                   # TypeScript type definitions
```

## User Flow

1. **Connect Wallet**: User connects their EVM wallet
2. **Onboarding**: New users complete onboarding survey
3. **File Upload**: Users upload .ogg audio files
4. **Processing**: Files are sent to refiner backend
5. **Storage**: Encrypted data stored on IPFS

## TODO: Backend Integration

### Required Backend Endpoints

#### 1. Wallet Registration
Create endpoint: `POST /api/wallets`
- Accepts: `{ address, chainId, connectedAt, lastActivity }`
- Returns: `{ success: true, walletId }`

#### 2. User Onboarding
Create endpoint: `POST /api/users/onboarding`
- Accepts: `{ walletAddress, country, birthMonth, birthYear, isItRelated }`
- Returns: `{ success: true, onboardingId }`

### Storj Integration

#### 1. Storj Setup
- Create Storj account and bucket
- Configure environment variables:
  ```env
  STORJ_ACCESS_KEY=your_storj_access_key
  STORJ_SECRET_KEY=your_storj_secret_key
  ```
- Update bucket name in `lib/storj.ts`

#### 2. Refiner Integration
- Configure refiner endpoint:
  ```env
  REFINER_ID=144
  REFINEMENT_ENDPOINT=https://your_refiner_endpoint
  REFINEMENT_ENCRYPTION_KEY=your_encryption_key
  ```
- Uncomment integration code in `app/api/refine/upload/route.ts`

### Integration Steps

1. **Update environment variables** in `.env.local`
2. **Configure Storj bucket** and credentials
3. **Uncomment integration code** in API routes
4. **Test file upload flow** with Storj and refiner
5. **Handle errors** appropriately
6. **Add authentication** if required

### File Upload Flow

1. **User uploads .ogg file** → Frontend
2. **File uploaded to Storj** → Backend API
3. **Metadata created** → User data + file info
4. **Metadata sent to refiner** → Refiner processes audio
5. **Result returned** → Success/error response

## Development

### Adding New Features
- Create components in `app/components/`
- Add API routes in `app/api/`
- Update types in `types/` directory
- Test with development server

### Backend Integration
- Configure environment variables
- Implement API endpoints on your backend
- Update fetch calls in API routes
- Test integration thoroughly

## Deployment

1. **Build the application**:
   ```bash
   npm run build
   ```

2. **Deploy to your preferred platform** (Vercel, Netlify, etc.)

3. **Configure environment variables** on your deployment platform

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.
