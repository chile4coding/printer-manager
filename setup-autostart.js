const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const { app } = require('electron');

/**
 * Register app to auto-start on Windows boot
 * Run this once during app initialization or from a settings menu
 */
function setupAutoStart(exePath) {
  const appPath = exePath || process.execPath;
  const appName = 'PrinterManager';
  
  // Windows Registry path for auto-start
  const regPath = `HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run`;
  const regCommand = `reg add "${regPath}" /v "${appName}" /t REG_SZ /d "${appPath}" /f`;

  console.log('Setting up auto-start...');
  console.log('Command:', regCommand);

  exec(regCommand, (error, stdout, stderr) => {
    if (error) {
      console.error('Failed to set auto-start:', error);
      return false;
    }
    console.log('✓ Auto-start enabled for:', appName);
    return true;
  });
}

/**
 * Remove auto-start registration
 */
function disableAutoStart() {
  const appName = 'PrinterManager';
  const regPath = `HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run`;
  const regCommand = `reg delete "${regPath}" /v "${appName}" /f`;

  console.log('Disabling auto-start...');

  exec(regCommand, (error, stdout, stderr) => {
    if (error) {
      console.error('Failed to disable auto-start:', error);
      return false;
    }
    console.log('✓ Auto-start disabled');
    return true;
  });
}

/**
 * Check if app is registered for auto-start
 */
function isAutoStartEnabled() {
  const appName = 'PrinterManager';
  const regPath = `HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run`;
  const regCommand = `reg query "${regPath}" /v "${appName}"`;

  return new Promise((resolve) => {
    exec(regCommand, (error, stdout, stderr) => {
      if (error) {
        resolve(false);
      } else {
        resolve(true);
      }
    });
  });
}

module.exports = {
  setupAutoStart,
  disableAutoStart,
  isAutoStartEnabled,
};
