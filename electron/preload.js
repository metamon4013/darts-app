const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  getBluetoothDevices: () => ipcRenderer.invoke('get-bluetooth-devices'),
  connectBluetoothDevice: (deviceId) => ipcRenderer.invoke('connect-bluetooth-device', deviceId),
  disconnectBluetoothDevice: (deviceId) => ipcRenderer.invoke('disconnect-bluetooth-device', deviceId),
  onBluetoothData: (callback) => ipcRenderer.on('bluetooth-data', callback),
  removeBluetoothDataListener: (callback) => ipcRenderer.removeListener('bluetooth-data', callback),
  onDeviceError: (callback) => ipcRenderer.on('device-error', callback),
  removeDeviceErrorListener: (callback) => ipcRenderer.removeListener('device-error', callback)
});