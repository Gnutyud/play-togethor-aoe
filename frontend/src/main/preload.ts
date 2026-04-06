import { contextBridge, ipcRenderer } from "electron";
import { IPC_CHANNELS } from "../shared/constants";
import type {
  DependencyStatus,
  GameConfig,
  RadminVpnConnection,
} from "../shared/types";

/**
 * Preload script that exposes a safe API to the renderer process
 * using contextBridge
 */

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld("electronAPI", {
  // Dependency Management
  checkDependencies: (): Promise<DependencyStatus> =>
    ipcRenderer.invoke(IPC_CHANNELS.DEPENDENCY_CHECK),

  installRadminVpn: (): Promise<{ success: boolean; message: string }> =>
    ipcRenderer.invoke(IPC_CHANNELS.DEPENDENCY_INSTALL_RADMIN),

  // Game Management
  detectGame: (): Promise<{ found: boolean; path?: string }> =>
    ipcRenderer.invoke(IPC_CHANNELS.GAME_DETECT),

  selectGamePath: (): Promise<{ success: boolean; path?: string }> =>
    ipcRenderer.invoke(IPC_CHANNELS.GAME_SELECT_PATH),

  launchGame: (
    config: GameConfig
  ): Promise<{ success: boolean; error?: string }> =>
    ipcRenderer.invoke(IPC_CHANNELS.GAME_LAUNCH, config),

  // Radmin VPN Management
  checkVpnStatus: (): Promise<RadminVpnConnection> =>
    ipcRenderer.invoke(IPC_CHANNELS.VPN_CHECK_STATUS),

  connectVpn: (
    networkId: string,
    password: string
  ): Promise<{ success: boolean; error?: string }> =>
    ipcRenderer.invoke(IPC_CHANNELS.VPN_CONNECT, networkId, password),

  disconnectVpn: (): Promise<{ success: boolean }> =>
    ipcRenderer.invoke(IPC_CHANNELS.VPN_DISCONNECT),

  // Settings
  getSettings: <T = any>(key: string): Promise<T> =>
    ipcRenderer.invoke(IPC_CHANNELS.SETTINGS_GET, key),

  setSettings: <T = any>(key: string, value: T): Promise<void> =>
    ipcRenderer.invoke(IPC_CHANNELS.SETTINGS_SET, key, value),

  // Window Controls
  minimizeWindow: () => ipcRenderer.send(IPC_CHANNELS.WINDOW_MINIMIZE),
  maximizeWindow: () => ipcRenderer.send(IPC_CHANNELS.WINDOW_MAXIMIZE),
  closeWindow: () => ipcRenderer.send(IPC_CHANNELS.WINDOW_CLOSE),
});

// Type declaration for window.electronAPI
declare global {
  interface Window {
    electronAPI: {
      checkDependencies: () => Promise<DependencyStatus>;
      installRadminVpn: () => Promise<{ success: boolean; message: string }>;
      detectGame: () => Promise<{ found: boolean; path?: string }>;
      selectGamePath: () => Promise<{ success: boolean; path?: string }>;
      launchGame: (
        config: GameConfig
      ) => Promise<{ success: boolean; error?: string }>;
      checkVpnStatus: () => Promise<RadminVpnConnection>;
      connectVpn: (
        networkId: string,
        password: string
      ) => Promise<{ success: boolean; error?: string }>;
      disconnectVpn: () => Promise<{ success: boolean }>;
      getSettings: <T = any>(key: string) => Promise<T>;
      setSettings: <T = any>(key: string, value: T) => Promise<void>;
      minimizeWindow: () => void;
      maximizeWindow: () => void;
      closeWindow: () => void;
    };
  }
}
