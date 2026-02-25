# How to Send Print Data from Client Side

Your Printer Manager Electron app exposes two ways to send print data:

## Option 1: Socket.IO (Real-time, Bidirectional)

### Setup in your web application:

```html
<!-- Add Socket.IO client library -->
<script src="https://cdn.socket.io/4.5.4/socket.io.min.js"></script>

<script>
// Connect to Printer Manager running on localhost:3000
// Use the backend URL you configured in Printer Manager settings
const PRINTER_MANAGER_URL = 'http://localhost:3000'; // or your backend URL

const socket = io(PRINTER_MANAGER_URL);

socket.on('connect', () => {
  console.log('Connected to Printer Manager');
});

socket.on('print-result', (result) => {
  console.log('Print result:', result);
});

// Function to print HTML
function printHTML(htmlContent) {
  socket.emit('print', {
    data: htmlContent,
    format: 'html'
  });
}

// Function to print from URL
function printURL(url) {
  socket.emit('print', {
    data: url,
    format: 'url'
  });
}

// Function to print PDF
function printPDF(pdfFilePath) {
  socket.emit('print', {
    data: pdfFilePath,
    format: 'pdf'
  });
}

// Example: Print a document
document.getElementById('printBtn').addEventListener('click', () => {
  const html = `
    <html>
      <head><title>Invoice</title></head>
      <body>
        <h1>Invoice #123</h1>
        <p>Customer: John Doe</p>
        <p>Amount: $100.00</p>
      </body>
    </html>
  `;
  printHTML(html);
});
</script>
```

## Option 2: HTTP POST (Simple, Stateless)

```javascript
// Send print request via HTTP POST
async function sendPrintRequest(htmlContent) {
  try {
    const response = await fetch('http://localhost:3000/print', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        data: htmlContent,
        format: 'html'
      })
    });
    
    const result = await response.json();
    console.log('Print sent:', result);
  } catch (error) {
    console.error('Print failed:', error);
  }
}
```

## Complete Example - Invoice Printer

```html
<!DOCTYPE html>
<html>
<head>
  <title>Print Invoice</title>
  <style>
    body { font-family: Arial; margin: 20px; }
    button { padding: 10px 20px; cursor: pointer; }
  </style>
</head>
<body>
  <h1>Invoice Printer</h1>
  
  <input type="text" id="invoiceNum" placeholder="Invoice Number">
  <input type="text" id="customerName" placeholder="Customer Name">
  <input type="number" id="amount" placeholder="Amount">
  
  <button onclick="generateAndPrint()">Print Invoice</button>
  
  <script src="https://cdn.socket.io/4.5.4/socket.io.min.js"></script>
  <script>
    const socket = io('http://localhost:3000');
    
    function generateAndPrint() {
      const invoiceNum = document.getElementById('invoiceNum').value;
      const customerName = document.getElementById('customerName').value;
      const amount = document.getElementById('amount').value;
      
      const html = `
        <html>
          <head>
            <title>Invoice</title>
            <style>
              body { font-family: Arial; padding: 40px; }
              .invoice { border: 1px solid #ccc; padding: 20px; }
              .header { font-size: 24px; font-weight: bold; margin-bottom: 20px; }
              .detail { margin: 10px 0; }
            </style>
          </head>
          <body>
            <div class="invoice">
              <div class="header">INVOICE #${invoiceNum}</div>
              <div class="detail">Customer: ${customerName}</div>
              <div class="detail">Amount: $${amount}</div>
              <div class="detail">Date: ${new Date().toLocaleDateString()}</div>
            </div>
          </body>
        </html>
      `;
      
      socket.emit('print', {
        data: html,
        format: 'html'
      });
      
      alert('Sent to printer!');
    }
  </script>
</body>
</html>
```

## Remote Browser to Printer Manager

If your browser is on a **different machine**, configure the backend URL in Printer Manager:

1. In Printer Manager app → Settings tab
2. Enter your backend server URL: `http://your-server:3000`
3. Printer Manager will connect and listen for print requests

Then from your remote browser:

```javascript
// Connect to your backend server (which Printer Manager is listening to)
const socket = io('http://your-backend-server.com');

socket.emit('print', {
  data: '<h1>Hello from remote</h1>',
  format: 'html'
});
```

## Data Formats Supported

### HTML Format
```javascript
socket.emit('print', {
  data: '<html><body><h1>Hello</h1></body></html>',
  format: 'html'
});
```

### URL Format
```javascript
socket.emit('print', {
  data: 'https://example.com',
  format: 'url'
});
```

### PDF Format
```javascript
socket.emit('print', {
  data: '/path/to/file.pdf',
  format: 'pdf'
});
```

## Error Handling

```javascript
socket.on('connect', () => {
  console.log('Connected to Printer Manager');
});

socket.on('disconnect', () => {
  console.error('Disconnected from Printer Manager');
});

socket.on('print-result', (result) => {
  if (result.success) {
    console.log('Print successful:', result.message);
  } else {
    console.error('Print failed:', result.error);
  }
});

socket.on('connect_error', (error) => {
  console.error('Connection error:', error);
});
```

## Network Configuration

### Local Network (Default)
- Browser and Printer Manager on same machine or local network
- URL: `http://localhost:3000` or `http://192.168.x.x:3000`

### Remote Backend Setup
1. Run your backend server (Node.js with Socket.IO)
2. Configure Printer Manager to connect to your backend
3. Browser sends to your backend, which relays to Printer Manager
