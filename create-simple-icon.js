const fs = require('fs');
const path = require('path');

// Create assets folder if it doesn't exist
const assetsDir = path.join(__dirname, 'assets');
if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir, { recursive: true });
}

// Create a minimal valid ICO file (16x16 ICO)
const createIcon = () => {
  // ICO file structure for a single 16x16 image
  const iconData = Buffer.concat([
    // ICONHEADER (6 bytes)
    Buffer.from([0x00, 0x00]), // idReserved (must be 0)
    Buffer.from([0x01, 0x00]), // idType (1 = ICO)
    Buffer.from([0x01, 0x00]), // idCount (1 image)
    
    // ICONDIRENTRY (16 bytes)
    Buffer.from([
      0x10,       // bWidth (16)
      0x10,       // bHeight (16)
      0x00,       // bColorCount (0 = no palette)
      0x00,       // bReserved
      0x01, 0x00, // wPlanes
      0x20, 0x00, // wBitCount (32-bit)
      0x88, 0x00, 0x00, 0x00, // dwBytesInRes (136 bytes)
      0x16, 0x00, 0x00, 0x00  // dwOffset (22 bytes from start)
    ]),
    
    // BITMAPINFOHEADER (40 bytes)
    Buffer.from([
      0x28, 0x00, 0x00, 0x00, // biSize
      0x10, 0x00, 0x00, 0x00, // biWidth (16)
      0x20, 0x00, 0x00, 0x00, // biHeight (32 = 16*2)
      0x01, 0x00,             // biPlanes
      0x20, 0x00,             // biBitCount (32-bit)
      0x00, 0x00, 0x00, 0x00, // biCompression (none)
      0x00, 0x00, 0x00, 0x00, // biSizeImage
      0x00, 0x00, 0x00, 0x00, // biXPelsPerMeter
      0x00, 0x00, 0x00, 0x00, // biYPelsPerMeter
      0x00, 0x00, 0x00, 0x00, // biClrUsed
      0x00, 0x00, 0x00, 0x00  // biClrImportant
    ]),
    
    // Pixel data (16x16 = 256 pixels, 4 bytes each = 1024 bytes)
    // Create a simple black and white printer icon
    Buffer.alloc(1024, 0xFF) // Fill with white (0xFFFFFFFF in little-endian = FF FF FF FF)
  ]);
  
  // Draw a simple printer shape
  const view = new DataView(iconData.buffer, iconData.byteOffset, iconData.length);
  const startOffset = 22 + 40; // Header + BitmapInfo
  
  // Draw black pixels for printer shape
  const blackPixel = 0xFF000000; // BGRA format: opaque black
  
  // Simple printer: draw a rectangle and some lines
  for (let y = 2; y < 14; y++) {
    for (let x = 2; x < 14; x++) {
      const pixelIndex = (y * 16 + x) * 4;
      
      // Outline
      if ((y === 2 || y === 13) && (x >= 2 && x <= 13)) {
        view.setUint32(startOffset + pixelIndex, blackPixel, true);
      } else if ((x === 2 || x === 13) && (y >= 2 && y <= 13)) {
        view.setUint32(startOffset + pixelIndex, blackPixel, true);
      }
      // Paper lines
      else if (y >= 5 && y <= 11 && x >= 4 && x <= 12) {
        if ((y === 5 || y === 7 || y === 9 || y === 11) && (x % 2 === 0)) {
          view.setUint32(startOffset + pixelIndex, blackPixel, true);
        }
      }
    }
  }
  
  return iconData;
};

try {
  const iconBuffer = createIcon();
  const iconPath = path.join(assetsDir, 'icon.ico');
  
  fs.writeFileSync(iconPath, iconBuffer);
  console.log('✓ Printer icon created successfully!');
  console.log('Location:', iconPath);
  console.log('File size:', iconBuffer.length, 'bytes');
  console.log('');
  console.log('To add this icon to your shortcut:');
  console.log('1. Right-click the PrinterManager shortcut');
  console.log('2. Select "Properties"');
  console.log('3. Click "Change Icon" button');
  console.log('4. Browse to: assets\\icon.ico');
  console.log('5. Click OK');
} catch (error) {
  console.error('Error creating icon:', error.message);
  console.error('Stack:', error.stack);
}
