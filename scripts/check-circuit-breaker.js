const { ethers } = require('ethers');

// Contract addresses
const DATA_REGISTRY_ADDRESS = '0x8C8788f98385F6ba1adD4234e551ABba0f82Cb7C';

// Extended ABI to check for circuit breaker mechanisms
const EXTENDED_ABI = [
  {
    "inputs": [],
    "name": "paused",
    "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "circuitBreaker",
    "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "emergencyStop",
    "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "isActive",
    "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getStatus",
    "outputs": [{"internalType": "string", "name": "", "type": "string"}],
    "stateMutability": "view",
    "type": "function"
  }
];

async function checkCircuitBreaker() {
  console.log('🔍 Checking Circuit Breaker Status...\n');
  
  try {
    const provider = new ethers.JsonRpcProvider('https://rpc.moksha.vana.org');
    const contract = new ethers.Contract(DATA_REGISTRY_ADDRESS, EXTENDED_ABI, provider);
    
    console.log('📋 Contract Status Checks:');
    
    // Check pause status
    try {
      const isPaused = await contract.paused();
      console.log(`   Paused: ${isPaused ? '❌ YES' : '✅ NO'}`);
    } catch (error) {
      console.log(`   Paused: ⚠️  Function not available`);
    }
    
    // Check circuit breaker
    try {
      const circuitBreaker = await contract.circuitBreaker();
      console.log(`   Circuit Breaker: ${circuitBreaker ? '❌ OPEN' : '✅ CLOSED'}`);
    } catch (error) {
      console.log(`   Circuit Breaker: ⚠️  Function not available`);
    }
    
    // Check emergency stop
    try {
      const emergencyStop = await contract.emergencyStop();
      console.log(`   Emergency Stop: ${emergencyStop ? '❌ ACTIVE' : '✅ INACTIVE'}`);
    } catch (error) {
      console.log(`   Emergency Stop: ⚠️  Function not available`);
    }
    
    // Check if contract is active
    try {
      const isActive = await contract.isActive();
      console.log(`   Is Active: ${isActive ? '✅ YES' : '❌ NO'}`);
    } catch (error) {
      console.log(`   Is Active: ⚠️  Function not available`);
    }
    
    // Check contract status
    try {
      const status = await contract.getStatus();
      console.log(`   Status: ${status}`);
    } catch (error) {
      console.log(`   Status: ⚠️  Function not available`);
    }
    
    // Check network status
    console.log('\n🌐 Network Status:');
    try {
      const blockNumber = await provider.getBlockNumber();
      console.log(`   Current Block: ${blockNumber}`);
      
      const network = await provider.getNetwork();
      console.log(`   Chain ID: ${network.chainId}`);
      console.log(`   Network Name: ${network.name}`);
      
      const gasPrice = await provider.getFeeData();
      console.log(`   Gas Price: ${ethers.formatUnits(gasPrice.gasPrice || 0, 'gwei')} gwei`);
      
    } catch (error) {
      console.log(`   ❌ Network Error: ${error.message}`);
    }
    
    // Check if this is a testnet issue
    console.log('\n🔧 Analysis:');
    console.log('The "circuit breaker is open" error suggests:');
    console.log('1. The contract may have a circuit breaker mechanism that\'s activated');
    console.log('2. This could be a testnet-specific protection mechanism');
    console.log('3. The contract might be in maintenance mode');
    console.log('4. Network-level restrictions might be in place');
    
    console.log('\n💡 Recommendations:');
    console.log('1. Check if this is a testnet with restricted access');
    console.log('2. Contact VANA team about contract status');
    console.log('3. Try using mainnet instead of testnet');
    console.log('4. Check if there are any announcements about contract maintenance');
    
  } catch (error) {
    console.error('❌ Circuit breaker check failed:', error.message);
  }
}

// Run the check
checkCircuitBreaker(); 