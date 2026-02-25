/**
 * This script creates a simple placeholder icon
 * For production, replace with a proper printer icon
 * 
 * To use a custom icon:
 * 1. Get a 256x256 printer PNG image
 * 2. Convert to ICO at https://convertio.co/png-ico/
 * 3. Save as: assets/icon.ico
 * 4. Run: npm run build
 */

const fs = require('fs');
const path = require('path');

console.log('Icon setup guide:');
console.log('================');
console.log('');
console.log('1. Get a printer icon (PNG format)');
console.log('   - Search: flaticon.com, iconmonstr.com, or pixabay.com');
console.log('   - Size: 256x256 pixels minimum');
console.log('');
console.log('2. Convert PNG to ICO format');
console.log('   - Use: https://convertio.co/png-ico/');
console.log('   - Or use ImageMagick: convert printer.png -define icon:auto-resize=256 icon.ico');
console.log('');
console.log('3. Save the ICO file to:');
console.log('   assets/icon.ico');
console.log('');
console.log('4. Run the build:');
console.log('   npm run build');
console.log('');
console.log('The icon will be applied to PrinterManager.exe and shortcuts.');
