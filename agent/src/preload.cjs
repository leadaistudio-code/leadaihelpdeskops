const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  getStatus: () => ipcRenderer.invoke('get-status'),
  togglePause: () => ipcRenderer.send('toggle-pause'),
  quitApp: () => ipcRenderer.send('quit-app'),
  onStatusUpdate: (callback) => ipcRenderer.on('status-update', (_event, value) => callback(value))
});
