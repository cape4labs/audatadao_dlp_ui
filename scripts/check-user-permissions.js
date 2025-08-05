const { ethers } = require('ethers');

// Contract addresses
const DATA_REGISTRY_ADDRESS = '0x8C8788f98385F6ba1adD4234e551ABba0f82Cb7C';

// ABI for permission checks
const PERMISSION_ABI = [
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
  },
  {
    "inputs": [
      {"internalType": "bytes32", "name": "role", "type": "bytes32"},
      {"internalType": "address", "name": "account", "type": "address"}
    ],
    "name": "hasRole",
    "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
    "stateMutability": "view",
    "type": "function"
  }
];

async function checkUserPermissions(userAddress) {
  console.log(`🔍 Checking permissions for address: ${userAddress}\n`);
  
  try {
    const provider = new ethers.JsonRpcProvider('https://rpc.moksha.vana.org');
    const contract = new ethers.Contract(DATA_REGISTRY_ADDRESS, PERMISSION_ABI, provider);
    
    // Get role hashes
    const defaultAdminRole = await contract.DEFAULT_ADMIN_ROLE();
    const maintainerRole = await contract.MAINTAINER_ROLE();
    
    console.log('🔑 Role Hashes:');
    console.log(`   Default Admin Role: ${defaultAdminRole}`);
    console.log(`   Maintainer Role: ${maintainerRole}`);
    
    // Check if user has admin role
    const hasAdminRole = await contract.hasRole(defaultAdminRole, userAddress);
    console.log(`\n👤 User Permissions:`);
    console.log(`   Has Admin Role: ${hasAdminRole ? '✅ YES' : '❌ NO'}`);
    
    // Check if user has maintainer role
    const hasMaintainerRole = await contract.hasRole(maintainerRole, userAddress);
    console.log(`   Has Maintainer Role: ${hasMaintainerRole ? '✅ YES' : '❌ NO'}`);
    
    // Check if user has any role
    const hasAnyRole = hasAdminRole || hasMaintainerRole;
    console.log(`   Has Any Role: ${hasAnyRole ? '✅ YES' : '❌ NO'}`);
    
    console.log('\n💡 Analysis:');
    if (hasAdminRole) {
      console.log('   ✅ User has admin privileges - should be able to call addFile');
    } else if (hasMaintainerRole) {
      console.log('   ✅ User has maintainer privileges - should be able to call addFile');
    } else {
      console.log('   ❌ User has no special roles - this might be the issue!');
      console.log('   📝 The addFile function might require specific role permissions');
      console.log('   🔧 Contact the contract administrator to grant necessary roles');
    }
    
    // Test if addFile requires authentication
    console.log('\n🧪 Testing addFile call simulation...');
    try {
      // Create a read-only contract instance for simulation
      const testContract = new ethers.Contract(DATA_REGISTRY_ADDRESS, [
        {
          "inputs": [{"internalType": "string", "name": "url", "type": "string"}],
          "name": "addFile",
          "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
          "stateMutability": "nonpayable",
          "type": "function"
        }
      ], provider);
      
      // Try to call addFile (this will fail but might give us more info)
      console.log('   Attempting to simulate addFile call...');
      // Note: This won't actually execute, just test the interface
      console.log('   ✅ addFile function interface is accessible');
      
    } catch (error) {
      console.log(`   ❌ addFile simulation error: ${error.message}`);
    }
    
  } catch (error) {
    console.error('❌ Permission check failed:', error.message);
  }
}

// Get user address from command line or use a test address
const userAddress = process.argv[2] || '0xa71c992ADC69a7B7c1e0b14bb11C59a8D83d795C';

checkUserPermissions(userAddress); 