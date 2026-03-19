const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const express = require("express");
const http = require("http");
const socketIO = require("socket.io");
const ioClient = require("socket.io-client");
const fs = require("fs");
const { PosPrinter } = require("electron-pos-printer");
const {
  setupAutoStart,
  disableAutoStart,
  isAutoStartEnabled,
} = require("./setup-autostart");

let mainWindow;
let selectedPrinter = null;
let backendSocket;
const configPath = path.join(app.getPath("userData"), "config.json");

const expressApp = express();
const server = http.createServer(expressApp);
const io = socketIO(server, {
  cors: { origin: "*" },
});

// Load config
function loadConfig() {
  try {
    if (fs.existsSync(configPath)) {
      return JSON.parse(fs.readFileSync(configPath, "utf-8"));
    }
  } catch (error) {
    console.error("Error loading config:", error);
  }
  return { backendUrl: "https://abc-api.invexone.com" };
}

// Save config
function saveConfig(config) {
  try {
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    return true;
  } catch (error) {
    console.error("Error saving config:", error);
    return false;
  }
}

let config = loadConfig();

if (require("electron-squirrel-startup")) app.quit();

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 400,
    height: 500,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      enableRemoteModule: false,
      devTools: false,
    },
  });

  mainWindow.loadFile("src/index.html");

  // When user closes the window, hide it instead of quitting
  mainWindow.on("close", (event) => {
    if (!app.isQuitting) {
      event.preventDefault();
      mainWindow.hide();
    }
  });
}

// Prevent multiple instances
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  console.log("Another instance is already running. Exiting.");
  app.quit();
} else {
  app.on("second-instance", () => {
    // User tried to run a second instance, show the first window
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  app.on("ready", () => {
    createWindow();
    startSocketServer();
    connectToBackend();
    loadAvailablePrinters();
  });
}

app.on("window-all-closed", () => {
  // Don't quit on window close - keep running as service
  if (mainWindow) {
    mainWindow.hide();
  }
});

app.on("activate", () => {
  if (mainWindow === null) {
    createWindow();
  }
});

// IPC Handlers
ipcMain.handle("get-config", () => {
  return config;
});

ipcMain.handle("save-config", (event, newConfig) => {
  config = newConfig;
  const success = saveConfig(newConfig);
  if (success) {
    // Reconnect to new backend
    connectToBackend();
  }
  return success;
});

ipcMain.handle("request-printers", async () => {
  try {
    const printers = await mainWindow.webContents.getPrintersAsync();
    console.log("Printers refreshed:", printers.length);
    mainWindow.webContents.send("printers-list", printers);
    return printers;
  } catch (error) {
    console.error("Error refreshing printers:", error);
    return [];
  }
});

ipcMain.handle("set-selected-printer", (event, printerName) => {
  selectedPrinter = printerName;
  console.log("Selected Printer (from UI):", printerName);
  return { success: true, printer: printerName };
});

ipcMain.handle("setup-auto-start", async () => {
  console.log("Setting up auto-start...");
  setupAutoStart(process.execPath);
  return { success: true, message: "Auto-start enabled" };
});

ipcMain.handle("disable-auto-start", async () => {
  console.log("Disabling auto-start...");
  disableAutoStart();
  return { success: true, message: "Auto-start disabled" };
});

ipcMain.handle("is-auto-start-enabled", async () => {
  const enabled = await isAutoStartEnabled();
  return { enabled };
});

ipcMain.handle("quit-app", async () => {
  app.isQuitting = true;
  app.quit();
  return { success: true };
});

async function loadAvailablePrinters() {
  try {
    // Wait for window to be fully loaded
    await new Promise((resolve) => {
      if (mainWindow.webContents.isLoading()) {
        mainWindow.webContents.once("did-finish-load", resolve);
      } else {
        resolve();
      }
    });

    const printers = await mainWindow.webContents.getPrintersAsync();
    console.log("Available Printers:", printers);

    if (printers.length === 0) {
      console.warn(
        "No printers found. Check if printers are installed on your system.",
      );
      mainWindow.webContents.send("printers-list", []);
    } else {
      // Send to renderer
      mainWindow.webContents.send("printers-list", printers);
    }
  } catch (error) {
    console.error("Error getting printers:", error);
    mainWindow.webContents.send("printers-list", []);
  }
}

function connectToBackend() {
  if (backendSocket) {
    backendSocket.disconnect();
  }

  console.log("\n=== Connecting to Backend ===");
  console.log("Backend URL:", config.backendUrl);

  backendSocket = ioClient(config.backendUrl, {
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 10000,
    reconnectionAttempts: 5,
    transports: ["websocket", "polling"],
  });

  backendSocket.on("connect", () => {
    console.log("✓ Connected to backend:", config.backendUrl);
    console.log("Socket ID:", backendSocket.id);
    mainWindow.webContents.send("backend-status", {
      connected: true,
      url: config.backendUrl,
    });
  });

  backendSocket.on("disconnect", () => {
    console.log("✗ Disconnected from backend");
    mainWindow.webContents.send("backend-status", { connected: false });
  });

  backendSocket.on("print", async (data) => {
    console.log("\n✓ RECEIVED PRINT EVENT FROM BACKEND");
    console.log("Data:", data?.data?.data);
    console.log("Currently selected printer:", selectedPrinter);

    if (!selectedPrinter) {
      console.error("✗ Error: No printer selected");
      backendSocket.emit("print-error", { message: "No printer selected" });
      return;
    }

    try {
      await handlePrintRequest(data?.data?.data, data?.data?.format);
      console.log("✓ Print sent successfully");
      backendSocket.emit("print-result", {
        success: true,
        message: "Sent to printer: " + selectedPrinter,
      });
    } catch (error) {
      console.error("✗ Print failed:", error.message);
      backendSocket.emit("print-result", {
        success: false,
        message: "Print failed: " + error.message,
      });
    }
  });

  backendSocket.on("connect_error", (error) => {
    console.error("✗ Backend connection error:", error);
    mainWindow.webContents.send("backend-status", {
      connected: false,
      error: error.toString(),
    });
  });

  backendSocket.on("error", (error) => {
    console.error("✗ Backend socket error:", error);
  });

  // Debug: Log all events
  backendSocket.onAny((event, ...args) => {
    console.log("[Backend Event]", event, args);
  });
}

function startSocketServer() {
  // Express middleware
  expressApp.use(express.json());

  // HTTP endpoint for print requests
  expressApp.post("/print", async (req, res) => {
    console.log("\n=== HTTP PRINT REQUEST RECEIVED ===");
    console.log("Selected Printer:", selectedPrinter);

    const { data, format } = req.body;
    console.log("Request data:", {
      format,
      dataLength: data ? data.length : 0,
    });

    if (!selectedPrinter) {
      console.error("✗ No printer selected");
      return res.json({
        success: false,
        message: "No printer selected. Please select a printer first.",
      });
    }

    try {
      console.log("Calling handlePrintRequest...");
      await handlePrintRequest(data, format);
      console.log("✓ Print request completed successfully");
      res.json({ success: true, message: "Print sent to " + selectedPrinter });
    } catch (error) {
      console.error("✗ Print failed:", error.message);
      res.json({
        success: false,
        message: "Print failed: " + error.message,
      });
    }
  });

  // Socket.IO connection for local browser
  io.on("connection", (socket) => {
    console.log("Local browser connected:", socket.id);

    socket.on("disconnect", () => {
      console.log("Local browser disconnected");
    });
  });

  server.listen(3000, () => {
    console.log("Socket.IO server running on http://localhost:3000");
  });
}

async function handlePrintRequest(data, format = "html") {
  console.log("\n=== HANDLING PRINT REQUEST ===");
  console.log("Format:", format);
  console.log("Printer:", selectedPrinter);

  if (!selectedPrinter) {
    console.error("✗ No printer selected");
    throw new Error("No printer selected");
  }

  try {
    console.log("Sending to printer:", selectedPrinter);
    await printToSelectedPrinter(data, format);
    console.log("✓ Print completed successfully");
  } catch (error) {
    console.error("✗ Print error:", error.message);
    throw error;
  }
}

async function printToSelectedPrinter(data, format = "html") {
  return new Promise(async (resolve, reject) => {
    console.log("\n=== PRINTING TO DEVICE ===");
    console.log("Device Name:", selectedPrinter);
    console.log("Format:", format);

    try {
      let printData = [];

      // Convert data to electron-pos-printer format
      if (format === "html" || format === "text") {
        // Convert HTML/text to POS array format
        printData = [
          {
            type: "text",
            value: data,
            style: {},
          },
        ];
      } else if (format === "url") {
        printData = [
          {
            type: "text",
            value: "hello chile",
            style: { align: "left" },
          },
        ];
      } else if (format === "pdf") {
        // For PDF files
        printData = [
          {
            type: "image",
            path: data,
          },
        ];
      } else if (Array.isArray(data)) {
        // If data is already in POS format (array), use it directly
        printData = data;
      }

      // Verify printer exists using Electron
      const printers = await mainWindow.webContents.getPrintersAsync();
      const printerExists = printers.find((p) => p.name === selectedPrinter);

      if (!printerExists) {
        throw new Error(`Printer "${selectedPrinter}" not found`);
      }
      console.log("this is the data ", printData);

      // Print using electron-pos-printer
      await PosPrinter.print(printData, {
        printerName: selectedPrinter,
        silent: true,
        preview: false,
        margin: "0 0 0 0",
        copies: 1,
        timeOutPerLine: 400,
        pageSize: "80mm", // page size
      });

      console.log("✓✓✓ PRINT SUCCESSFUL ✓✓✓");
      console.log("Print sent to:", selectedPrinter);
      resolve(true);
    } catch (error) {
      console.error("✗✗✗ PRINT FAILED ✗✗✗");
      console.error("Printer:", selectedPrinter);
      console.error("Failure reason:", error);
      console.error("Stack:", error);
      reject(error);
    }
  });
}
