import {
  DependencyStatus,
  GameConfig,
  RadminVpnConnection,
} from "../shared/types";

export interface ElectronAPI {
  // Dependency Management
  checkDependencies: () => Promise<DependencyStatus>;
  installRadminVpn: () => Promise<{ success: boolean; message: string }>;

  // Game Management
  detectGame: () => Promise<{ found: boolean; path?: string }>;
  selectGamePath: () => Promise<{
    success: boolean;
    path?: string;
    message?: string;
  }>;
  launchGame: (
    config: GameConfig
  ) => Promise<{ success: boolean; message: string }>;

  // Radmin VPN
  connectVpn: (
    connection: RadminVpnConnection
  ) => Promise<{ success: boolean; message: string }>;
  disconnectVpn: () => Promise<{ success: boolean; message: string }>;
  getVpnStatus: () => Promise<RadminVpnConnection | null>;

  // Settings
  getSettings: <K extends keyof any>(key: K) => Promise<any>;
  setSettings: <K extends keyof any>(key: K, value: any) => Promise<void>;

  // Window Controls
  minimizeWindow: () => void;
  maximizeWindow: () => void;
  closeWindow: () => void;
  isMaximized: () => Promise<boolean>;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
