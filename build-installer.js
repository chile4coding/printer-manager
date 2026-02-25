const fs = require('fs');
const path = require('path');

console.log('Building PrinterManager...');

const appFolder = path.join(__dirname, 'dist', 'PrinterManager-win32-x64');
const exePath = path.join(appFolder, 'PrinterManager.exe');

if (fs.existsSync(exePath)) {
  console.log('✓ Build successful!');
  console.log('');
  console.log('PrinterManager.exe location:');
  console.log(exePath);
  console.log('');
  console.log('File size:', (fs.statSync(exePath).size / (1024*1024)).toFixed(2), 'MB');
  console.log('');
  console.log('To install on another Windows PC:');
  console.log('1. Copy PrinterManager.exe to the target PC');
  console.log('2. Run PrinterManager.exe');
  console.log('3. The app will extract and run');
} else {
  console.error('✗ Build failed - PrinterManager.exe not found');
  process.exit(1);
}
