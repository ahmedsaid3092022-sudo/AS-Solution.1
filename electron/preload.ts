import { contextBridge, ipcRenderer } from 'electron';

export interface ElectronAPI {
  minimizeWindow: () => Promise<void>;
  maximizeWindow: () => Promise<void>;
  closeWindow: () => Promise<void>;
  isMaximized: () => Promise<boolean>;
  getHardwareUUID: () => Promise<string>;
  getDatabasePath: () => Promise<string>;
  readDatabaseFile: () => Promise<string | null>;
  writeDatabaseFile: (content: string) => Promise<{ success: boolean; path?: string; error?: string }>;
}

const electronAPI: ElectronAPI = {
  minimizeWindow: () => ipcRenderer.invoke('window-minimize'),
  maximizeWindow: () => ipcRenderer.invoke('window-maximize'),
  closeWindow: () => ipcRenderer.invoke('window-close'),
  isMaximized: () => ipcRenderer.invoke('window-is-maximized'),
  getHardwareUUID: () => ipcRenderer.invoke('get-hardware-uuid'),
  getDatabasePath: () => ipcRenderer.invoke('get-database-path'),
  readDatabaseFile: () => ipcRenderer.invoke('read-database-file'),
  writeDatabaseFile: (content: string) => ipcRenderer.invoke('write-database-file', content),
};

contextBridge.exposeInMainWorld('electronAPI', electronAPI);
