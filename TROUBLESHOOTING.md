# Troubleshooting Guide

This guide helps you resolve common issues with the VANA DLP UI.

## Common Issues

### 1. Contract Circuit Breaker Error (Testnet Restriction)

**Error Message:**
```
ContractFunctionExecutionError: The contract function "addFile" reverted with the following reason: Execution prevented because the circuit breaker is open
```

**Cause:** The Moksha testnet contracts have circuit breaker protections that prevent write operations. This is a testnet-specific restriction, not a user permission issue.

**Solutions:**

#### Option A: Development Mode (Current Solution)
The application now runs in development mode where:
- Files are uploaded to Pinata IPFS (real URLs instead of local storage)
- Blockchain registration is optional (skipped if contract is restricted)
- Refinement processing follows the official VANA template flow
- This allows testing the UI and file upload functionality

#### Option B: Use Mainnet
Switch to VANA mainnet (Chain ID: 1480) instead of testnet:
```env
NEXT_PUBLIC_CHAIN_ID=1480
NEXT_PUBLIC_RPC_URL=https://rpc.vana.org
```

#### Option C: Contact VANA Team
Contact the VANA team to:
- Get access to unrestricted testnet contracts
- Get proper refiner service endpoints
- Understand the correct deployment flow

### 2. Refiner Upload Error

**Error Message:**
```
Error: Refiner upload failed: Internal Server Error
```

**Cause:** Missing or incorrect environment configuration.

**Solution:**

1. Create a `.env.local` file in your project root:

```env
# Refiner API Configuration
REFINEMENT_ENDPOINT=https://your_refiner_api_url_here

# Blockchain Configuration
NEXT_PUBLIC_RPC_URL=https://rpc.moksha.vana.org
NEXT_PUBLIC_MAINNET_RPC_URL=https://rpc.vana.org
NEXT_PUBLIC_CHAIN_ID=14800
```

2. Replace `https://your_refiner_api_url_here` with the actual refiner service URL
3. Restart your development server:

```bash
npm run dev
```

### 3. Environment Variables Not Loading

**Symptoms:**
- API calls failing with 500 errors
- Missing configuration errors

**Solution:**

1. Ensure `.env.local` file exists in project root
2. Check that environment variables are properly named
3. Restart the development server
4. Clear browser cache and reload

### 4. Wallet Connection Issues

**Symptoms:**
- Wallet not connecting
- Transaction failures
- Network errors
- `ConnectorNotConnectedError` errors

**Solutions:**

1. **Check Network Configuration:**
   - Ensure you're connected to the correct network (Moksha Testnet)
   - Add network manually if needed:
     - Chain ID: 14800
     - RPC URL: https://rpc.moksha.vana.org

2. **Check Wallet Permissions:**
   - Ensure wallet has permission to connect
   - Check if wallet is locked
   - Try disconnecting and reconnecting

3. **Check Account Balance:**
   - Ensure wallet has sufficient native tokens for gas fees

4. **Fix ConnectorNotConnectedError:**
   - Refresh the page and reconnect your wallet
   - Ensure the wallet is properly connected before attempting uploads
   - Check that the wallet connection status shows "Connected" in the UI
   - If using MetaMask, try switching networks and switching back

## Development Setup

### Prerequisites

1. **Node.js** (v18 or higher)
2. **npm** or **yarn**
3. **Wallet** (MetaMask, Coinbase Wallet, etc.)

### Environment Setup

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd dlp-ui-audata
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Create environment file:**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your configuration
   ```

4. **Start development server:**
   ```bash
   npm run dev
   ```

### Required Environment Variables

```env
# Refiner API Configuration
REFINEMENT_ENDPOINT=https://your_refiner_api_url_here
REFINER_ID=your_refiner_id_here
REFINEMENT_API_VERSION=v1

# Blockchain Configuration
NEXT_PUBLIC_RPC_URL=https://rpc.moksha.vana.org
NEXT_PUBLIC_MAINNET_RPC_URL=https://rpc.vana.org
NEXT_PUBLIC_CHAIN_ID=14800

# Required: Pinata IPFS (for file storage)
PINATA_API_KEY=your_pinata_api_key_here
PINATA_API_SECRET=your_pinata_api_secret_here

# Optional: Additional services
STORJ_ACCESS_KEY=your_storj_access_key_here
STORJ_SECRET_KEY=your_storj_secret_key_here
```

## Getting Help

If you're still experiencing issues:

1. **Check the browser console** for detailed error messages
2. **Check the network tab** for failed API calls
3. **Review the logs** in your terminal
4. **Contact your team** with the specific error messages and steps to reproduce

## Contract Addresses

- **DataRegistryProxy:** `0x8C8788f98385F6ba1adD4234e551ABba0f82Cb7C`
- **TeePoolProxy:** `0xE8EC6BD73b23Ad40E6B9a6f4bD343FAc411bD99A`
- **DataLiquidityPoolProxy:** `0x0161DFbf70a912668dd1B4365b43c1348e8bD3ab`

## Network Information

- **Testnet:** Moksha (Chain ID: 14800)
- **Mainnet:** VANA (Chain ID: 1480)
- **RPC URL:** https://rpc.moksha.vana.org 