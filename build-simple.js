const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const archiver = require('archiver');

console.log('Building Printer Manager...');

// Step 1: Package with electron-builder (without signing)
const builder = spawn('npx', ['electron-builder', '--publish', 'never', '--win', 'dir'], {
  cwd: __dirname,
  stdio: 'inherit',
  shell: true,
  env: { ...process.env, CSC_IDENTITY_AUTO_DISCOVERY: 'false' }
});

builder.on('close', (code) => {
  if (code !== 0) {
    console.error('Build failed');
    process.exit(1);
  }
  console.log('Build complete!');
  console.log('Installer available in: dist/');
});
