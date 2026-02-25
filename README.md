# Printer Manager

A powerful, lightweight Electron-based desktop application that bridges your backend services with system printers. Printer Manager runs as a background service to handle printing tasks silently and efficiently.

## Problem It Solves

Modern web applications often need to print documents, receipts, labels, and reports to physical printers. However, printing from web services directly to local printers is not possible due to browser security restrictions and the complexity of managing printer drivers across different systems.

**Printer Manager solves this by:**

- Providing a lightweight desktop agent that runs on user machines
- Accepting print requests from your backend API via HTTP or WebSocket
- Managing printer discovery and selection
- Handling multiple print formats (HTML, URLs, PDF)
- Running as a background service without requiring user interaction
- Offering user-friendly UI to configure printer preferences
- Supporting Windows auto-start for seamless deployment

## Key Features

✅ **Background Service** - Runs silently without UI unless opened by user  
✅ **Multiple Input Formats** - Print from HTML, URLs, or PDF files  
✅ **Socket.IO Support** - Real-time bidirectional communication with backend  
✅ **HTTP REST API** - Simple POST endpoint for print requests  
✅ **Auto-Start on Boot** - Optional Windows registry auto-start capability  
✅ **Printer Discovery** - Automatically detects all connected printers  
✅ **Configuration Persistence** - Saves backend URL and settings locally  
✅ **Print Optimization** - Bold, sharp, visible text rendering  
✅ **Custom Margins** - Precise control over print layout  
✅ **Error Handling** - Detailed logging and error feedback  
✅ **Single Instance** - Prevents multiple app instances running simultaneously  

## Architecture

```
┌─────────────────────────────────────────────┐
│         Backend Service                     │
│     (Your API Server)                       │
└──────────────┬──────────────────────────────┘
               │ HTTP POST /print
               │ Socket.IO events
               │
┌──────────────▼──────────────────────────────┐
│    Printer Manager (Electron App)           │
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │  Express Server (localhost:3000)    │   │
│  │  - HTTP print endpoint              │   │
│  │  - Socket.IO server                 │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │  Print Handler                      │   │
│  │  - Browser window creation          │   │
│  │  - Content rendering                │   │
│  │  - Printer communication            │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │  UI Window (Optional)               │   │
│  │  - Printer selection                │   │
│  │  - Configuration settings           │   │
│  │  - Backend connection status        │   │
│  └─────────────────────────────────────┘   │
└──────────────┬──────────────────────────────┘
               │
               ├─→ System Printers (Windows)
               └─→ Printer Drivers
```

## Installation

### Prerequisites

- **Node.js** (v14 or higher)
- **npm** (v6 or higher)
- **Windows** (7 or higher) - Currently Windows-focused

### Setup Steps

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd printer
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Run in development mode**
   ```bash
   npm run dev
   ```

4. **Build for production**
   ```bash
   npm run build
   ```

This creates a Windows installer in the `out/` directory.

## Configuration

### Backend URL

The app connects to your backend service. By default, it uses:

```
http://localhost:3000
```

To change the backend URL:

1. Open the Printer Manager UI
2. Go to Settings
3. Enter your backend service URL (e.g., `https://abc-api.invexone.com`)
4. Click Save

The configuration is saved locally in your user data directory.

### Auto-Start on Boot

Enable auto-start so the app launches automatically when Windows boots:

1. Open Printer Manager
2. Check "Enable Auto-Start"
3. The app will now start silently on every boot

To disable, uncheck the same option.

## Usage

### As an End User

1. **Install and Launch**
   - Run the installer
   - Launch Printer Manager from Start Menu or create a shortcut

2. **Configure**
   - Select your preferred printer from the dropdown
   - Verify backend connection status
   - Enable auto-start if desired

3. **Send Print Jobs**
   - Your backend service sends print requests to this app
   - The app prints to the selected printer automatically

### As a Backend Developer

#### Method 1: HTTP REST API

Send a POST request to the local HTTP endpoint:

```javascript
fetch('http://localhost:3000/print', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    data: '<html><body>Hello World</body></html>',
    format: 'html'  // 'html', 'url', or 'pdf'
  })
})
.then(res => res.json())
.then(data => console.log(data));
```

#### Method 2: Socket.IO (Real-time)

Connect to the Socket.IO server:

```javascript
const io = require('socket.io-client');

const socket = io('http://localhost:3000');

socket.on('connect', () => {
  console.log('Connected to Printer Manager');
  
  // Send print request
  socket.emit('print', {
    data: {
      data: '<html><body>Invoice #123</body></html>',
      format: 'html'
    }
  });
});

// Listen for results
socket.on('print-result', (result) => {
  if (result.success) {
    console.log('Print successful:', result.message);
  } else {
    console.error('Print failed:', result.message);
  }
});

socket.on('print-error', (error) => {
  console.error('Print error:', error.message);
});
```

### Print Request Formats

#### HTML Content
```json
{
  "data": "<html><body style='font-weight:bold'>Receipt #12345</body></html>",
  "format": "html"
}
```

#### External URL
```json
{
  "data": "https://example.com/invoice/12345",
  "format": "url"
}
```

#### PDF File
```json
{
  "data": "/path/to/file.pdf",
  "format": "pdf"
}
```

## API Reference

### POST /print

**Description:** Submit a print job

**Request Body:**
```json
{
  "data": "string (HTML content, URL, or file path)",
  "format": "html|url|pdf"
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Print sent to HP LaserJet Pro"
}
```

**Response (Error):**
```json
{
  "success": false,
  "message": "No printer selected. Please select a printer first."
}
```

### Socket.IO Events

#### Server → Client

- `printers-list`: List of available printers
- `backend-status`: Connection status to backend
- `print-result`: Result of print operation
- `print-error`: Error during print operation

#### Client → Server

- `print`: Submit a print job
  ```javascript
  {
    data: {
      data: "content",
      format: "html|url|pdf"
    }
  }
  ```

## Print Customization

The app automatically formats all print output with:

- **Bold text** for maximum visibility
- **Sharp rendering** with antialiasing
- **Custom margins** (minimal top/bottom, zero left/right)
- **Max width constraint** (8 inches) to prevent overflow
- **70% scale factor** for optimal sizing

Modify these settings in the `printToSelectedPrinter()` function in `main.js`.

## Project Structure

```
printer/
├── main.js                    # Main Electron process
├── preload.js                # Preload script for IPC security
├── setup-autostart.js         # Windows auto-start handler
├── src/
│   ├── index.html            # Main UI HTML
│   ├── styles/               # CSS stylesheets
│   └── scripts/              # Frontend JavaScript
├── assets/                   # App icons and assets
├── forge.config.js           # Electron Forge configuration
├── package.json              # Dependencies and scripts
└── README.md                 # This file
```

## Development

### Scripts

```bash
npm run start          # Start in development mode
npm run dev           # Run with debugger on port 5858
npm run package       # Package the app
npm run make          # Create installers
npm run build         # Full build: package + build info + installer
```

### Debugging

Enable debug mode by running:
```bash
npm run dev
```

Chrome DevTools will be available on localhost:5858

### Logging

All operations are logged to the console:
- Connection status
- Printer discovery
- Print requests and results
- Error messages

## Troubleshooting

### "No printer selected" Error
- **Cause:** User hasn't selected a printer in the UI
- **Fix:** Open Printer Manager and select a printer from the dropdown

### App doesn't start on boot
- **Cause:** Auto-start not enabled or registry entry corrupted
- **Fix:** 
  1. Open Printer Manager
  2. Disable auto-start
  3. Re-enable auto-start
  4. Restart Windows

### Backend connection failed
- **Cause:** Wrong backend URL or service not running
- **Fix:**
  1. Verify backend service is running
  2. Check the backend URL in settings
  3. Ensure network connectivity

### Print appears too small/large
- **Cause:** Scale factor or window size mismatch
- **Fix:** Modify `scaleFactor` in `printToSelectedPrinter()` function

### Printer not detected
- **Cause:** Printer driver not installed or printer offline
- **Fix:**
  1. Verify printer is turned on and connected
  2. Install/update printer drivers
  3. Restart Printer Manager

## Configuration Files

### config.json
Located in: `%APPDATA%\PrinterManager\config.json`

```json
{
  "backendUrl": "http://localhost:3000"
}
```

### Windows Registry (Auto-start)
```
HKEY_CURRENT_USER\Software\Microsoft\Windows\CurrentVersion\Run
PrinterManager = "C:\path\to\PrinterManager.exe"
```

## Contributing

Contributions are welcome! To contribute:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Areas for Contribution

- **macOS and Linux support**
- **Additional print formats** (Excel, Word, Images)
- **Print queue management**
- **Printer-specific settings** (paper size, color mode)
- **Enhanced UI** (dark mode, better icons)
- **Printer status monitoring**
- **Print history and logging**
- **Performance optimizations**

## License

MIT License - See LICENSE file for details

## Support

For issues, questions, or suggestions:
1. Check the Troubleshooting section
2. Review existing issues on GitHub
3. Create a new issue with detailed information
4. Include logs and error messages

## Roadmap

- [ ] macOS support
- [ ] Linux support
- [ ] Print queue management UI
- [ ] Print job history
- [ ] Network printer detection
- [ ] Print preview functionality
- [ ] Custom print templates
- [ ] Email integration
- [ ] Cloud storage integration (Google Drive, OneDrive)
- [ ] Mobile app companion
- [ ] Advanced authentication for backend

## Performance Considerations

- **Memory Usage:** Minimal when idle (~50-100MB)
- **CPU Usage:** <1% when idle, spikes only during print jobs
- **Network:** Only communicates with configured backend
- **Startup Time:** <2 seconds
- **Print Time:** Depends on content size and printer speed

## Security

- **IPC Isolation:** Uses context isolation and preload scripts
- **No Admin Rights:** Runs as regular user
- **Local Only:** Doesn't upload data to external services
- **Config Encryption:** User data stored locally, not synced
- **CORS Enabled:** Allows requests from configured origins

## FAQ

**Q: Can I print to multiple printers?**  
A: Currently, only one printer can be selected at a time. Print jobs go to the selected printer.

**Q: Does it work on macOS/Linux?**  
A: Not yet. Windows support is current. Cross-platform support is planned.

**Q: Can I print without selecting a printer?**  
A: No. A printer must be selected before any print job can be processed.

**Q: Is there a file size limit for printing?**  
A: No hard limit, but very large HTML/PDF files may take longer to render.

**Q: Can I customize print styling?**  
A: Yes. Modify the CSS injected in the `printToSelectedPrinter()` function.

**Q: Does it work offline?**  
A: It can print locally without backend connection, but Socket.IO features require connectivity.

---

**Made with ❤️ for seamless printing**
# printer-manager
