declare module 'electron' {
  export const app: {
    getPath: (name: string) => string;
    whenReady: () => Promise<void>;
    on: (event: string, callback: (...args: any[]) => void) => void;
    quit: () => void;
  };

  export class BrowserWindow {
    constructor(options?: any);
    once(event: 'ready-to-show', callback: () => void): void;
    loadURL(url: string): Promise<void>;
    loadFile(filePath: string): Promise<void>;
    on(event: string, callback: (...args: any[]) => void): void;
    show(): void;
    minimize(): void;
    maximize(): void;
    unmaximize(): void;
    isMaximized(): boolean;
    close(): void;
    webContents: {
      openDevTools(options?: any): void;
    };
    static getAllWindows(): BrowserWindow[];
  }

  export const ipcMain: {
    handle(channel: string, listener: (event: any, ...args: any[]) => any): void;
  };

  export const ipcRenderer: {
    invoke(channel: string, ...args: any[]): Promise<any>;
  };

  export const contextBridge: {
    exposeInMainWorld(apiKey: string, api: any): void;
  };

  export const screen: {
    getPrimaryDisplay(): {
      workAreaSize: { width: number; height: number };
    };
  };
}
