const { app, BrowserWindow, ipcMain } = require('electron');
const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');
const path = require('path');
const isDev = process.env.NODE_ENV === 'development';

let mainWindow;
let connectedDevices = new Map();
let activeSerialConnections = new Map();

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:3000');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../out/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// Get available serial ports (includes Bluetooth serial ports)
ipcMain.handle('get-bluetooth-devices', async () => {
  console.log('Scanning for serial/Bluetooth devices...');
  try {
    const ports = await SerialPort.list();
    console.log('Available ports:', ports);

    const devices = [];

    // Look for Dartsio devices in serial ports
    ports.forEach((port, index) => {
      const deviceName = port.friendlyName || port.productId || `Serial Device ${index + 1}`;
      const isDartsio = deviceName.toLowerCase().includes('dartsio') ||
                       port.manufacturer?.toLowerCase().includes('dartsio') ||
                       port.productId?.toLowerCase().includes('dartsio');

      devices.push({
        id: port.path,
        name: isDartsio ? 'Dartsio' : deviceName,
        connected: activeSerialConnections.has(port.path),
        address: port.path,
        manufacturer: port.manufacturer,
        vendorId: port.vendorId,
        productId: port.productId,
        isDartsio: isDartsio
      });
    });

    // Add any manually connected Bluetooth devices that might not show in serial ports
    connectedDevices.forEach((device, deviceId) => {
      if (!devices.find(d => d.id === deviceId)) {
        devices.push(device);
      }
    });

    console.log(`Found ${devices.length} devices`);
    return devices;
  } catch (error) {
    console.error('Error scanning for devices:', error);
    return [];
  }
});

ipcMain.handle('connect-bluetooth-device', async (event, deviceId) => {
  console.log('Connecting to device:', deviceId);

  try {
    // Check if it's a serial port path (like COM3, /dev/ttyUSB0, etc.)
    if (deviceId.startsWith('COM') || deviceId.startsWith('/dev/')) {
      console.log('Connecting to serial device:', deviceId);

      // Create serial connection
      const port = new SerialPort({
        path: deviceId,
        baudRate: 9600, // Common baudrate, adjust as needed for Dartsio
        autoOpen: false
      });

      const parser = port.pipe(new ReadlineParser({ delimiter: '\n' }));

      // Open the port
      await new Promise((resolve, reject) => {
        port.open((err) => {
          if (err) reject(err);
          else resolve();
        });
      });

      // Store the connection
      activeSerialConnections.set(deviceId, { port, parser });

      connectedDevices.set(deviceId, {
        id: deviceId,
        name: 'Dartsio (Serial)',
        connected: true,
        type: 'serial'
      });

      // Set up data listener
      parser.on('data', (data) => {
        console.log('Received data from Dartsio:', data);
        try {
          // Try to parse as JSON first
          const jsonData = JSON.parse(data);
          event.sender.send('bluetooth-data', {
            deviceId,
            ...jsonData,
            timestamp: Date.now()
          });
        } catch {
          // If not JSON, send raw data
          event.sender.send('bluetooth-data', {
            deviceId,
            rawData: data.trim(),
            timestamp: Date.now()
          });
        }
      });

      // Handle port errors
      port.on('error', (err) => {
        console.error('Serial port error:', err);
        event.sender.send('device-error', { deviceId, error: err.message });
      });

      return { success: true, deviceId, message: 'Connected to serial device' };
    }

    // Handle other device types (legacy mock devices)
    if (deviceId.includes('dartsio')) {
      console.log('Connecting to mock Dartsio device:', deviceId);

      connectedDevices.set(deviceId, {
        id: deviceId,
        name: 'Dartsio (Mock)',
        connected: true,
        type: 'mock'
      });

      // Start simulating dart data for testing purposes
      startDartDataSimulation(event.sender, deviceId);

      return { success: true, deviceId, message: 'Connected to mock Dartsio device' };
    }

    // Handle other device types
    connectedDevices.set(deviceId, {
      id: deviceId,
      connected: true
    });

    return { success: true, deviceId };
  } catch (error) {
    console.error('Error connecting to device:', error);
    return { success: false, deviceId, error: error.message };
  }
});

ipcMain.handle('disconnect-bluetooth-device', async (event, deviceId) => {
  console.log('Disconnecting from device:', deviceId);

  try {
    // Handle serial port disconnection
    if (activeSerialConnections.has(deviceId)) {
      const { port } = activeSerialConnections.get(deviceId);

      await new Promise((resolve) => {
        port.close(() => {
          console.log(`Serial port ${deviceId} closed`);
          resolve();
        });
      });

      activeSerialConnections.delete(deviceId);
    }

    if (connectedDevices.has(deviceId)) {
      connectedDevices.delete(deviceId);
      // Stop any data simulation
      stopDartDataSimulation(deviceId);
    }

    return { success: true, deviceId };
  } catch (error) {
    console.error('Error disconnecting from device:', error);
    return { success: false, deviceId, error: error.message };
  }
});

// Simulate dart data for testing
let simulationIntervals = new Map();

function startDartDataSimulation(webContents, deviceId) {
  // Clear any existing simulation
  stopDartDataSimulation(deviceId);

  // Test data for Dartsio format
  const testDartsioData = [
    'S20', 'S01', 'S18', 'S04', 'S13', 'S06', 'S10', 'S15', 'S02', 'S17',
    'S03', 'S19', 'S07', 'S16', 'S08', 'S11', 'S14', 'S09', 'S12', 'S05',
    'D20', 'D01', 'D18', 'D04', 'D13', 'D06', 'D10', 'D15', 'D02', 'D17',
    'T20', 'T19', 'T18', 'T17', 'T16', 'T15', 'T14', 'T13', 'T12', 'T11',
    'B25', 'B50', 'S00'
  ];

  // Simulate dart hits every 5-10 seconds for testing
  const interval = setInterval(() => {
    if (connectedDevices.has(deviceId)) {
      // Generate random Dartsio data for testing
      const randomData = testDartsioData[Math.floor(Math.random() * testDartsioData.length)];

      const dartData = {
        deviceId,
        rawData: randomData,
        timestamp: Date.now()
      };

      console.log('Sending dart data:', dartData);
      webContents.send('bluetooth-data', dartData);
    }
  }, 6000); // Send data every 6 seconds for testing

  simulationIntervals.set(deviceId, interval);
}

function stopDartDataSimulation(deviceId) {
  if (simulationIntervals.has(deviceId)) {
    clearInterval(simulationIntervals.get(deviceId));
    simulationIntervals.delete(deviceId);
  }
}