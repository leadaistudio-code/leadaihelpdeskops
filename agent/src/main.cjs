const { app, BrowserWindow, Tray, Menu, ipcMain, shell } = require('electron');
const path = require('path');
const telemetry = require('./telemetry.cjs');

let tray = null;
let win = null;
let isPaused = false;
let currentStatus = "Starting...";
let isOk = false;

function createWindow() {
  win = new BrowserWindow({
    width: 320,
    height: 480,
    show: false,
    frame: false,
    resizable: false,
    transparent: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  win.loadFile(path.join(__dirname, 'ui', 'index.html'));

  win.on('blur', () => {
    if (!win.webContents.isDevToolsOpened()) {
      win.hide();
    }
  });
}

function createTray() {
  const iconPath = path.join(__dirname, '..', 'assets', 'icon.ico');
  tray = new Tray(iconPath);
  tray.setToolTip('Lead AI Solution - DEX Agent');

  tray.on('click', (event, bounds) => {
    const { x, y } = bounds;
    const { height, width } = win.getBounds();
    
    if (win.isVisible()) {
      win.hide();
    } else {
      const yPosition = process.platform === 'darwin' ? y : y - height;
      win.setBounds({
        x: x - width / 2,
        y: yPosition,
        height,
        width
      });
      win.show();
      win.focus();
    }
  });

  updateMenu();
}

function updateMenu() {
  if (!tray) return;
  const contextMenu = Menu.buildFromTemplate([
    { label: `Status: ${isOk ? '🟢' : '🔴'} ${currentStatus}`, enabled: false },
    { type: 'separator' },
    { label: 'Open Server Dashboard', click: () => {
        const { server } = telemetry.resolveConfig();
        if (server) shell.openExternal(server);
    }},
    { label: 'View Logs', click: () => { shell.openExternal(telemetry.LOG_FILE); } },
    { label: isPaused ? 'Resume reporting' : 'Pause reporting', click: () => {
        isPaused = !isPaused;
        updateMenu();
    }},
    { type: 'separator' },
    { label: 'Quit', click: () => { app.isQuiting = true; app.quit(); } }
  ]);
  tray.setContextMenu(contextMenu);
}

app.whenReady().then(() => {
  createWindow();
  createTray();

  const { server, token, interval } = telemetry.resolveConfig();
  if (!server || !token) {
    currentStatus = "Missing config (server/token).";
    updateMenu();
    return;
  }

  // Start the background telemetry loop
  telemetry.reportForever(server, token, interval, () => isPaused, (text, ok) => {
    currentStatus = text;
    isOk = ok;
    updateMenu();
    if (win && !win.isDestroyed()) {
      win.webContents.send('status-update', { text, ok, paused: isPaused, server });
    }
  }).catch(e => {
    console.error(e);
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// IPC handlers for the UI
ipcMain.handle('get-status', () => {
  const { server } = telemetry.resolveConfig();
  return {
    text: currentStatus,
    ok: isOk,
    paused: isPaused,
    server
  };
});

ipcMain.on('toggle-pause', () => {
  isPaused = !isPaused;
  updateMenu();
  if (win && !win.isDestroyed()) {
    const { server } = telemetry.resolveConfig();
    win.webContents.send('status-update', { text: currentStatus, ok: isOk, paused: isPaused, server });
  }
});

ipcMain.on('quit-app', () => {
  app.isQuiting = true;
  app.quit();
});
