let socket;
let printers = [];
let backendConnected = false;

// Listen for printers list from main process
function setupIPCListeners() {
  window.electron.onPrintersList((printersList) => {
    console.log('Printers received:', printersList);
    printers = printersList;
    populatePrinterSelect();
  });
}

// Connect to Socket.IO server
function connectSocket() {
  console.log('Attempting to connect to local Socket.IO server at http://localhost:3000');
  
  socket = io('http://localhost:3000', {
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: 5
  });

  socket.on('connect', () => {
    console.log('✓ Connected to Electron server');
    console.log('Socket ID:', socket.id);
    updateConnectionStatus(true);
    showStatus('Connected to Electron server', 'success');
  });

  socket.on('connect_error', (error) => {
    console.error('✗ Socket connection error:', error);
    updateConnectionStatus(false);
    showStatus('Failed to connect to printer service', 'error');
  });

  socket.on('disconnect', () => {
    console.log('✗ Disconnected from server');
    updateConnectionStatus(false);
    showStatus('Disconnected from printer service', 'error');
  });

  socket.on('printer-selected', (data) => {
    showStatus(`Printer selected: ${data.printer}`, 'success');
  });

  socket.on('print-result', (data) => {
    const statusType = data.success ? 'success' : 'error';
    console.log('Print result:', data);
    showStatus(data.message, statusType);
  });
}

function updateConnectionStatus(isConnected) {
  const dot = document.getElementById('connectionDot');
  const status = document.getElementById('connectionStatus');
  
  if (isConnected) {
    dot.classList.add('connected');
    status.textContent = '● Connected';
  } else {
    dot.classList.remove('connected');
    status.textContent = '● Disconnected';
  }
}

function populatePrinterSelect() {
  const select = document.getElementById('printerSelect');
  select.innerHTML = '<option value="">Select a printer...</option>';
  
  if (printers.length === 0) {
    const option = document.createElement('option');
    option.value = '';
    option.textContent = 'No printers found';
    option.disabled = true;
    select.appendChild(option);
    select.disabled = true;
    document.getElementById('testBtn').disabled = true;
    document.getElementById('printerCount').textContent = 'No printers available. Please check your system printer settings.';
    return;
  }
  
  printers.forEach(printer => {
    const option = document.createElement('option');
    option.value = printer.name;
    option.textContent = printer.name;
    select.appendChild(option);
  });
  
  select.disabled = false;
  document.getElementById('testBtn').disabled = false;
  document.getElementById('printerCount').textContent = `${printers.length} printer(s) available`;
  
  // Auto-select last used printer or first available
  autoSelectPrinter();
}

async function autoSelectPrinter() {
  const select = document.getElementById('printerSelect');
  const savedPrinter = localStorage.getItem('selectedPrinter');
  let printerToSelect = null;
  
  // Check if saved printer still exists in available printers
  const printerNames = printers.map(p => p.name);
  
  if (savedPrinter && printerNames.includes(savedPrinter)) {
    // Use saved printer
    printerToSelect = savedPrinter;
    console.log('Auto-selected saved printer:', savedPrinter);
  } else if (printers.length > 0) {
    // Use first available printer
    printerToSelect = printers[0].name;
    localStorage.setItem('selectedPrinter', printerToSelect);
    console.log('Auto-selected first available printer:', printerToSelect);
  }
  
  // Set printer in Electron process AND emit to socket
  if (printerToSelect) {
    try {
      // Sync with Electron main process
      await window.electron.setSelectedPrinter(printerToSelect);
      console.log('Printer synced to main process:', printerToSelect);
    } catch (error) {
      console.error('Failed to sync printer:', error);
    }
    
    select.value = printerToSelect;
    // Emit selection to backend
    socket.emit('select-printer', printerToSelect);
    showStatus(`Printer auto-selected: ${printerToSelect}`, 'success');
  }
}

async function refreshPrinters() {
  // Request fresh printer list without reloading page
  const printerList = document.getElementById('printerSelect');
  printerList.innerHTML = '<option value="">Refreshing...</option>';
  printerList.disabled = true;
  document.getElementById('testBtn').disabled = true;
  
  try {
    const updatedPrinters = await window.electron.requestPrinters();
    console.log('Printers refreshed:', updatedPrinters);
    // The setupIPCListeners will update the UI via the 'printers-list' event
  } catch (error) {
    console.error('Failed to refresh printers:', error);
    printerList.innerHTML = '<option value="">Error loading printers</option>';
    showStatus('Failed to refresh printers', 'error');
  }
}

async function testPrint() {
  console.log('\n=== TEST PRINT CLICKED ===');
  
  const printerSelect = document.getElementById('printerSelect');
  const selectedPrinter = printerSelect.value;
  
  console.log('Selected printer from dropdown:', selectedPrinter);
  
  if (!selectedPrinter) {
    console.error('✗ No printer selected');
    showStatus('Please select a printer first', 'error');
    return;
  }

  // Ensure printer is set in Electron process
  console.log('Setting printer in main process:', selectedPrinter);
  try {
    const result = await window.electron.setSelectedPrinter(selectedPrinter);
    console.log('✓ Printer set result:', result);
  } catch (error) {
    console.error('✗ Failed to set printer:', error);
    showStatus('Failed to set printer', 'error');
    return;
  }

  const testHTML = `
    <html>
      <head>
        <title>Test Print</title>
        <style>
          body { font-family: Arial; margin: 40px; }
          .header { font-size: 24px; font-weight: bold; color: #333; margin-bottom: 20px; }
          .content { font-size: 16px; line-height: 1.6; }
        </style>
      </head>
      <body>
        <div class="header">Test Print Document</div>
        <div class="content">
          <p>This is a test print from the Printer Manager.</p>
          <p>Printer: <strong>${selectedPrinter}</strong></p>
          <p>Time: <strong>${new Date().toLocaleString()}</strong></p>
          <p>If you see this, the printer is working correctly!</p>
        </div>
      </body>
    </html>
  `;

  // Send print request via HTTP POST to local server
  console.log('✓ Sending print request via HTTP POST');
  
  try {
    const response = await fetch('http://localhost:3000/print', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        data: testHTML,
        format: 'html'
      })
    });

    const result = await response.json();
    console.log('✓ Print response:', result);
    
    if (result.success) {
      showStatus('✓ Test print sent to: ' + selectedPrinter, 'success');
    } else {
      showStatus('✗ Print failed: ' + (result.message || 'Unknown error'), 'error');
    }
  } catch (error) {
    console.error('✗ Failed to send print request:', error);
    showStatus('Failed to send print request. Is the printer service running?', 'error');
  }
}

function showStatus(message, type) {
  const statusEl = document.getElementById('status');
  statusEl.textContent = message;
  statusEl.className = 'status ' + type;
  
  if (type !== 'error') {
    setTimeout(() => {
      statusEl.className = 'status';
    }, 4000);
  }
}

function showSettingsStatus(message, type) {
  const statusEl = document.getElementById('settingsStatus');
  statusEl.textContent = message;
  statusEl.className = 'status ' + type;
  
  if (type !== 'error') {
    setTimeout(() => {
      statusEl.className = 'status';
    }, 4000);
  }
}



async function saveBackendUrl() {
  const url = document.getElementById('backendUrl').value.trim();
  
  if (!url) {
    showSettingsStatus('Please enter a backend URL', 'error');
    return;
  }
  
  // Validate URL format
  try {
    new URL(url);
  } catch {
    showSettingsStatus('Invalid URL format', 'error');
    return;
  }
  
  const success = await window.electron.saveConfig({ backendUrl: url });
  if (success) {
    showSettingsStatus('Settings saved successfully. Reconnecting...', 'success');
  } else {
    showSettingsStatus('Failed to save settings', 'error');
  }
}

function testBackendConnection() {
  if (backendConnected) {
    showSettingsStatus('Connected to backend', 'success');
  } else {
    showSettingsStatus('Not connected to backend. Check URL and try again.', 'error');
  }
}

async function enableAutoStart() {
  try {
    await window.electron.setupAutoStart();
    showSettingsStatus('✓ Auto-start enabled. App will start when Windows boots.', 'success');
    checkAutoStartStatus();
  } catch (error) {
    showSettingsStatus('Failed to enable auto-start: ' + error.message, 'error');
  }
}

async function disableAutoStart() {
  try {
    await window.electron.disableAutoStart();
    showSettingsStatus('✓ Auto-start disabled.', 'success');
    checkAutoStartStatus();
  } catch (error) {
    showSettingsStatus('Failed to disable auto-start: ' + error.message, 'error');
  }
}

async function checkAutoStartStatus() {
  try {
    const result = await window.electron.isAutoStartEnabled();
    const statusEl = document.getElementById('autoStartStatus');
    if (result.enabled) {
      statusEl.textContent = '✓ Auto-start is ENABLED - App will run on Windows boot';
      statusEl.style.color = '#4caf50';
    } else {
      statusEl.textContent = '✗ Auto-start is DISABLED';
      statusEl.style.color = '#999';
    }
  } catch (error) {
    console.error('Error checking auto-start status:', error);
  }
}

// Initialize on page load
window.addEventListener('load', async () => {
  setupIPCListeners();
  connectSocket();
  
  // Load and display config
  const config = await window.electron.getConfig();
  document.getElementById('backendUrl').value = config.backendUrl;
  
  // Listen for backend status updates
  window.electron.onBackendStatus((status) => {
    backendConnected = status.connected;
    const statusEl = document.getElementById('backendStatusText');
    
    if (status.connected) {
      statusEl.innerHTML = `<span style="color: #4caf50;">✓ Connected to ${status.url}</span>`;
    } else {
      statusEl.innerHTML = `<span style="color: #f44336;">✗ Disconnected${status.error ? ': ' + status.error : ''}</span>`;
    }
  });
  
  // Check auto-start status
  checkAutoStartStatus();
  
  // Tab switching
  document.querySelectorAll('.tab-button').forEach(button => {
    button.addEventListener('click', () => {
      const tabId = button.getAttribute('data-tab');
      
      // Remove active from all tabs and buttons
      document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
      });
      document.querySelectorAll('.tab-button').forEach(btn => {
        btn.classList.remove('active');
      });
      
      // Add active to clicked button and corresponding tab
      button.classList.add('active');
      document.getElementById(tabId).classList.add('active');
    });
  });
  
  // Printer selection event listener
  document.getElementById('printerSelect').addEventListener('change', async (e) => {
    const printerName = e.target.value;
    if (printerName) {
      // Set in Electron process
      try {
        await window.electron.setSelectedPrinter(printerName);
        console.log('Printer set via UI:', printerName);
      } catch (error) {
        console.error('Failed to set printer:', error);
      }
      
      // Also emit to socket for backend
      socket.emit('select-printer', printerName);
      localStorage.setItem('selectedPrinter', printerName);
      showStatus(`Printer selected: ${printerName}`, 'success');
    }
  });
  
});
