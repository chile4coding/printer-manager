const createWindowsInstaller = require('electron-installer-windows');
const path = require('path');

async function buildInstaller() {
  console.log('Creating Windows installer...\n');

  try {
    const appPath = path.join(__dirname, 'dist', 'PrinterManager-win32-x64');
    const outputPath = path.join(__dirname, 'dist', 'installers');

    console.log('App path:', appPath);
    console.log('Output path:', outputPath);

    const installerConfig = {
      src: appPath,
      dest: outputPath,
      certificateFile: null,
      certificatePassword: null,
      signingHashAlgorithms: ['sha256'],
      name: 'PrinterManager',
      authors: ['Printer Manager'],
      exe: 'PrinterManager.exe',
      setupExe: 'PrinterManagerSetup.exe',
      setupIcon: null,
    };

    console.log('\nBuilding installer...');
    const result = await createWindowsInstaller(installerConfig);
    
    console.log('\n✓ Installer created successfully!');
    console.log('Location:', path.join(outputPath, 'PrinterManagerSetup.exe'));
    console.log('\nYou can now distribute PrinterManagerSetup.exe to users.');
  } catch (error) {
    console.error('\n✗ Installer creation failed:');
    console.error(error.message);
    process.exit(1);
  }
}

buildInstaller();
