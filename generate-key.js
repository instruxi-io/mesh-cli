const crypto = require('crypto');

// Generate a random private key (32 bytes)
const privateKey = crypto.randomBytes(32).toString('hex');
const publicKey = `0x${privateKey.slice(-40)}`; // This is just a mock public key for demonstration

console.log('Generated Keys:');
console.log(`Private Key: ${privateKey}`);
console.log(`Public Key (Address): ${publicKey}`);
console.log('\nExport commands:');
console.log(`export PRIVATE_KEY=${privateKey}`);
console.log(`export PUBLIC_KEY=${publicKey}`);
