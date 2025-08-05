const { ethers } = require('ethers');

// Contract addresses
const DATA_REGISTRY_ADDRESS = '0x8C8788f98385F6ba1adD4234e551ABba0f82Cb7C';
const DATA_LIQUIDITY_POOL_ADDRESS = '0x0161DFbf70a912668dd1B4365b43c1348e8bD3ab';

// ABI for basic checks
const BASIC_ABI = [
  {
    "inputs": [],
    "name": "paused",
    "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "DEFAULT_ADMIN_ROLE",
    "outputs": [{"internalType": "bytes32", "name": "", "type": "bytes32"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "MAINTAINER_ROLE",
    "outputs": [{"internalType": "bytes32", "name": "", "type": "bytes32"}],
    "stateMutability": "view",
    "type": "function"
  }
];

async function diagnoseIssues() {
  console.log('🔍 Diagnosing Upload Issues...\n');
  
  try {
    // Test different RPC endpoints
    const rpcEndpoints = [
      'https://rpc.moksha.vana.org',
      'https://rpc.vana.org'
    ];
    
    for (const rpcUrl of rpcEndpoints) {
      console.log(`📡 Testing RPC: ${rpcUrl}`);
      
      try {
        const provider = new ethers.JsonRpcProvider(rpcUrl);
        
        // Test basic connectivity
        const blockNumber = await provider.getBlockNumber();
        console.log(`   ✅ Connected - Block: ${blockNumber}`);
        
        // Test contract calls
        const dataRegistry = new ethers.Contract(DATA_REGISTRY_ADDRESS, BASIC_ABI, provider);
        
        // Check pause status
        const isPaused = await dataRegistry.paused();
        console.log(`   📋 DataRegistry Paused: ${isPaused ? 'YES' : 'NO'}`);
        
        // Check roles
        const defaultAdminRole = await dataRegistry.DEFAULT_ADMIN_ROLE();
        const maintainerRole = await dataRegistry.MAINTAINER_ROLE();
        console.log(`   🔑 Default Admin Role: ${defaultAdminRole}`);
        console.log(`   🔑 Maintainer Role: ${maintainerRole}`);
        
        // Test a simple view function
        try {
          const testUrl = "test://example.com";
          const fileId = await dataRegistry.fileIdByUrl(testUrl);
          console.log(`   ✅ fileIdByUrl function works`);
        } catch (error) {
          console.log(`   ⚠️  fileIdByUrl error: ${error.message}`);
        }
        
      } catch (error) {
        console.log(`   ❌ RPC Error: ${error.message}`);
      }
      
      console.log('');
    }
    
    // Test network status
    console.log('🌐 Network Status:');
    try {
      const provider = new ethers.JsonRpcProvider('https://rpc.moksha.vana.org');
      const network = await provider.getNetwork();
      console.log(`   Chain ID: ${network.chainId}`);
      console.log(`   Network Name: ${network.name}`);
      
      // Check gas price
      const gasPrice = await provider.getFeeData();
      console.log(`   Gas Price: ${ethers.formatUnits(gasPrice.gasPrice || 0, 'gwei')} gwei`);
      
    } catch (error) {
      console.log(`   ❌ Network Error: ${error.message}`);
    }
    
    console.log('\n🔧 Recommendations:');
    console.log('1. If RPC endpoints are failing, try switching networks');
    console.log('2. If contract is paused, wait for admin to unpause');
    console.log('3. If roles are missing, contact contract administrator');
    console.log('4. If gas price is too high, wait for network congestion to clear');
    console.log('5. The "circuit breaker" error might be from RPC provider rate limiting');
    
  } catch (error) {
    console.error('❌ Diagnostic failed:', error.message);
  }
}

// Run diagnostics
diagnoseIssues(); 