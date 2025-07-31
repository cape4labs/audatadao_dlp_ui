# VANA DLP UI Setup Instructions

## Overview
This application implements a complete pipeline for voice data contribution to the VANA network:
1. Wallet connection (supports multiple EVM wallets)
2. User onboarding survey
3. Voice file upload (.ogg format)
4. Data processing and blockchain registration

## Features Implemented

### ✅ Completed
- **Wallet Authentication**: Support for MetaMask, Coinbase Wallet, and other injected wallets
- **User Onboarding**: Survey collecting user demographics and preferences
- **File Upload**: Drag & drop interface for .ogg audio files
- **Processing Pipeline**: Visual progress tracking with ContributionSteps
- **Backend Integration**: API endpoints for wallet registration and data submission
- **Refiner Integration**: Framework for sending data to VANA's refiner service

### 🔧 Configuration Required
- Backend API integration for user data storage
- Refiner service endpoint configuration
- Storj storage integration for file uploads

## Environment Variables

Create a `.env.local` file with the following variables:

```env
# Backend API Configuration
BACKEND_API_URL=https://your-backend-api.com
BACKEND_API_KEY=your-backend-api-key

# Refiner Configuration
REFINEMENT_ENDPOINT=https://api.refiner.vana.com
REFINER_ID=your-refiner-id
REFINEMENT_ENCRYPTION_KEY=your-encryption-key

# Storj Configuration (for file storage)
STORJ_ACCESS_KEY=your-storj-access-key
STORJ_SECRET_KEY=your-storj-secret-key
STORJ_BUCKET_NAME=your-bucket-name
```

## API Endpoints

### Wallet Registration
- `POST /api/wallet/register` - Register wallet address
- `GET /api/wallet/register?address=<address>` - Get wallet info

### User Onboarding
- `POST /api/user/onboarding` - Submit user survey data
- `GET /api/user/onboarding?walletAddress=<address>` - Get user data

### File Upload & Processing
- `POST /api/refine/upload` - Upload audio file to refiner
- `GET /api/refine/upload?walletAddress=<address>` - Get uploaded files

## User Flow

1. **Landing Page**: User sees app description and wallet connection options
2. **Wallet Connection**: User selects and connects their preferred wallet
3. **Onboarding Survey**: User completes demographic survey (country, birth info, IT background)
4. **File Upload**: User uploads .ogg voice files via drag & drop
5. **Processing**: System shows progress through ContributionSteps:
   - Encrypt & Upload Data
   - Register on Blockchain
   - Request Validation
   - Validate Contribution
   - Receive Attestation
6. **Completion**: User sees success message and contribution details

## Development

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation
```bash
npm install
```

### Development Server
```bash
npm run dev
```

### Build
```bash
npm run build
```

## Integration Points

### Backend Integration
Update the following files to integrate with your backend:
- `app/api/wallet/register/route.ts`
- `app/api/user/onboarding/route.ts`
- `app/api/refine/upload/route.ts`

### Refiner Integration
The refiner integration is configured in `app/api/refine/upload/route.ts`. Update the endpoint URL and authentication to match your refiner service.

### File Storage
Currently configured for Storj but can be adapted for other storage solutions. Update the upload logic in `app/api/refine/upload/route.ts`.

## Supported Wallets
- MetaMask
- Coinbase Wallet
- Any injected wallet (WalletConnect, etc.)

## Blockchain Networks
- Moksha Testnet (Chain ID: 14800)
- VANA Mainnet

## File Requirements
- Format: .ogg audio files only
- Maximum size: 50MB per file
- Multiple files supported

## Security Features
- Client-side wallet authentication
- Encrypted data transmission
- Secure file upload with validation
- Blockchain-based data registration

## Next Steps
1. Configure environment variables
2. Set up backend API endpoints
3. Configure refiner service
4. Set up file storage (Storj or alternative)
5. Test complete user flow
6. Deploy to production

## Troubleshooting

### Wallet Connection Issues
- Ensure MetaMask or other wallet is installed
- Check if wallet is connected to correct network
- Verify wallet permissions

### File Upload Issues
- Ensure files are .ogg format
- Check file size limits
- Verify network connectivity

### Processing Issues
- Check refiner service status
- Verify API endpoint configuration
- Check console for error messages 