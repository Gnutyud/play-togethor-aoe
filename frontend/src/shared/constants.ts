/**
 * IPC Channel names for communication between main and renderer processes
 */

export const IPC_CHANNELS = {
  // Dependency Management
  DEPENDENCY_CHECK: "dependency:check",
  DEPENDENCY_INSTALL_RADMIN: "dependency:installRadmin",
  RADMIN_INSTALL_PROGRESS: "radmin:installProgress",
  RADMIN_INSTALL_STATUS: "radmin:installStatus",

  // Game Management
  GAME_DETECT: "game:detect",
  GAME_SELECT_PATH: "game:selectPath",
  GAME_LAUNCH: "game:launch",

  // Radmin VPN Management
  VPN_CHECK_STATUS: "vpn:checkStatus",
  VPN_CONNECT: "vpn:connect",
  VPN_DISCONNECT: "vpn:disconnect",

  // Settings
  SETTINGS_GET: "settings:get",
  SETTINGS_SET: "settings:set",

  // Window Controls
  WINDOW_MINIMIZE: "window:minimize",
  WINDOW_MAXIMIZE: "window:maximize",
  WINDOW_CLOSE: "window:close",
} as const;

export type IpcChannel = (typeof IPC_CHANNELS)[keyof typeof IPC_CHANNELS];
