const { ethers } = require('ethers');

// Contract addresses
const DATA_REGISTRY_ADDRESS = '0x8C8788f98385F6ba1adD4234e551ABba0f82Cb7C';

// ABI for the paused function
const PAUSED_ABI = [
  {
    "inputs": [],
    "name": "paused",
    "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
    "stateMutability": "view",
    "type": "function"
  }
];

// ABI for the pause/unpause functions
const PAUSE_ABI = [
  {
    "inputs": [],
    "name": "pause",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "unpause",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];

async function checkContractStatus() {
  try {
    // Connect to the network
    const provider = new ethers.JsonRpcProvider('https://rpc.moksha.vana.org');
    
    // Create contract instance
    const contract = new ethers.Contract(DATA_REGISTRY_ADDRESS, PAUSED_ABI, provider);
    
    // Check if contract is paused
    const isPaused = await contract.paused();
    
    console.log('=== Contract Status Check ===');
    console.log(`Contract Address: ${DATA_REGISTRY_ADDRESS}`);
    console.log(`Network: Moksha Testnet (Chain ID: 14800)`);
    console.log(`Paused Status: ${isPaused ? 'PAUSED' : 'ACTIVE'}`);
    
    if (isPaused) {
      console.log('\n⚠️  CONTRACT IS PAUSED ⚠️');
      console.log('The contract is currently paused. Users cannot register files.');
      console.log('\nTo unpause the contract:');
      console.log('1. You need to be the contract owner/admin');
      console.log('2. Call the unpause() function on the contract');
      console.log('3. Use a wallet with admin privileges');
      console.log('\nExample (if you have admin access):');
      console.log('const adminWallet = new ethers.Wallet(PRIVATE_KEY, provider);');
      console.log('const adminContract = new ethers.Contract(ADDRESS, PAUSE_ABI, adminWallet);');
      console.log('await adminContract.unpause();');
    } else {
      console.log('\n✅ CONTRACT IS ACTIVE ✅');
      console.log('The contract is running normally. Users can register files.');
    }
    
  } catch (error) {
    console.error('Error checking contract status:', error.message);
  }
}

// Run the check
checkContractStatus(); 