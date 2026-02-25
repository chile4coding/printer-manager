const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  onPrintersList: (callback) => {
    ipcRenderer.on('printers-list', (event, printers) => {
      callback(printers);
    });
  },
  onBackendStatus: (callback) => {
    ipcRenderer.on('backend-status', (event, status) => {
      callback(status);
    });
  },
  requestPrinters: () => ipcRenderer.invoke('request-printers'),
  setSelectedPrinter: (printerName) => ipcRenderer.invoke('set-selected-printer', printerName),
  setupAutoStart: () => ipcRenderer.invoke('setup-auto-start'),
  disableAutoStart: () => ipcRenderer.invoke('disable-auto-start'),
  isAutoStartEnabled: () => ipcRenderer.invoke('is-auto-start-enabled'),
  getConfig: () => ipcRenderer.invoke('get-config'),
  saveConfig: (config) => ipcRenderer.invoke('save-config', config)
});
