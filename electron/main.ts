import { app, BrowserWindow, ipcMain, screen } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';

let mainWindow: BrowserWindow | null = null;

function createWindow(): BrowserWindow {
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width, height } = primaryDisplay.workAreaSize;

  mainWindow = new BrowserWindow({
    width: Math.min(1440, width),
    height: Math.min(900, height),
    minWidth: 1024,
    minHeight: 700,
    frame: false, // Frameless window for DesktopTitleBar.tsx
    titleBarStyle: 'hidden',
    backgroundColor: '#020617', // slate-950
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
      webSecurity: true,
    },
    icon: path.join(__dirname, '../public/icon.png'),
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  const devServerUrl = process.env.VITE_DEV_SERVER_URL || 'http://localhost:3000';
  if (process.env.NODE_ENV === 'development' || process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(devServerUrl);
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  return mainWindow;
}

// Window Management IPC
ipcMain.handle('window-minimize', () => {
  mainWindow?.minimize();
});

ipcMain.handle('window-maximize', () => {
  if (mainWindow?.isMaximized()) {
    mainWindow.unmaximize();
  } else {
    mainWindow?.maximize();
  }
});

ipcMain.handle('window-close', () => {
  mainWindow?.close();
});

ipcMain.handle('window-is-maximized', () => {
  return mainWindow?.isMaximized() || false;
});

// System Hardware Fingerprint & File System Access IPC
ipcMain.handle('get-hardware-uuid', () => {
  try {
    const cpus = os.cpus();
    const cpuModel = cpus[0]?.model || 'GenericCPU';
    const totalMem = os.totalmem();
    const hostname = os.hostname();
    const networkInterfaces = os.networkInterfaces();

    let macAddress = '00:00:00:00:00:00';
    for (const name of Object.keys(networkInterfaces)) {
      const net = networkInterfaces[name];
      if (net) {
        for (const item of net) {
          if (!item.internal && item.mac && item.mac !== '00:00:00:00:00:00') {
            macAddress = item.mac;
            break;
          }
        }
      }
    }

    const rawId = `WIN-${hostname}-${cpuModel}-${totalMem}-${macAddress}`;
    let hash = 0;
    for (let i = 0; i < rawId.length; i++) {
      hash = (hash << 5) - hash + rawId.charCodeAt(i);
      hash |= 0;
    }
    const hex = Math.abs(hash).toString(16).toUpperCase().padStart(10, '0');
    return `HW-WIN-${hex}`;
  } catch (err) {
    return `HW-WIN-FALLBACK-${Date.now()}`;
  }
});

// SQLite File Database Storage IPC
ipcMain.handle('get-database-path', () => {
  const userDataPath = app.getPath('userData');
  return path.join(userDataPath, 'as_solution.db');
});

ipcMain.handle('read-database-file', async () => {
  try {
    const dbPath = path.join(app.getPath('userData'), 'as_solution.db');
    if (fs.existsSync(dbPath)) {
      return fs.readFileSync(dbPath, 'utf-8');
    }
    return null;
  } catch (err) {
    console.error('Error reading DB file in Electron:', err);
    return null;
  }
});

ipcMain.handle('write-database-file', async (_event, content: string) => {
  try {
    const dbPath = path.join(app.getPath('userData'), 'as_solution.db');
    fs.writeFileSync(dbPath, content, 'utf-8');
    return { success: true, path: dbPath };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Write failed' };
  }
});

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
