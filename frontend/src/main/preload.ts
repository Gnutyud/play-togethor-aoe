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

  async launch(
    config: GameConfig
  ): Promise<{ success: boolean; message: string }> {
    if (process.platform !== "win32") {
      return {
        success: false,
        message: "AOE I game is currently only supported on Windows.",
      };
    }
    return ipcRenderer.invoke(IPC_CHANNELS.GAME_LAUNCH, config);
  },

  // Radmin VPN Management
  checkVpnStatus: (): Promise<RadminVpnConnection> =>
    ipcRenderer.invoke(IPC_CHANNELS.VPN_CHECK_STATUS),

  connectVpn: (
    connection: any
  ): Promise<{ success: boolean; error?: string }> =>
    ipcRenderer.invoke(IPC_CHANNELS.VPN_CONNECT, connection),

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
  // Events
  onRadminStatusChanged: (callback: (payload: { running: boolean }) => void) => {
    const subscription = (_event: any, payload: { running: boolean }) =>
      callback(payload);
    ipcRenderer.on("radmin-status-changed", subscription);
    return () => ipcRenderer.removeListener("radmin-status-changed", subscription);
  },
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
        connection: any
      ) => Promise<{ success: boolean; error?: string }>;
      disconnectVpn: () => Promise<{ success: boolean }>;
      getSettings: <T = any>(key: string) => Promise<T>;
      setSettings: <T = any>(key: string, value: T) => Promise<void>;
      minimizeWindow: () => void;
      maximizeWindow: () => void;
      closeWindow: () => void;
      onRadminStatusChanged: (callback: (payload: { running: boolean }) => void) => () => void;
    };
  }
}
