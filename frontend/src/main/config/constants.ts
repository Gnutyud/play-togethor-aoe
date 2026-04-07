/**
 * Application constants
 */

export const APP_CONFIG = {
  NAME: "AOE Launcher",
  VERSION: "1.0.0",

  // Max players per room
  MAX_PLAYERS: 8,

  // Default room names
  DEFAULT_ROOMS: [
    "Room #1",
    "Room #2",
    "Room #3",
    "Room #4",
    "Room #5",
    "Room #6",
    "Room #7",
    "Room #8",
    "Room #9",
    "Room #10",
  ],

  // Radmin VPN
  RADMIN_VPN_DOWNLOAD_URL: "https://www.radmin-vpn.com/",
  RADMIN_VPN_EXE_NAME: "Radmin.exe",

  // Common Radmin VPN installation paths
  RADMIN_VPN_PATHS: [
    "C:\\Program Files (x86)\\Radmin VPN",
    "C:\\Program Files\\Radmin VPN",
  ],

  // AOE I common installation paths
  AOE_GAME_PATHS: [
    "C:\\Program Files (x86)\\Microsoft Games\\Age of Empires",
    "C:\\Program Files\\Microsoft Games\\Age of Empires",
    "C:\\Program Files (x86)\\Steam\\steamapps\\common\\Age of Empires",
    "C:\\Program Files\\Steam\\steamapps\\common\\Age of Empires",
    "C:\\GOG Games\\Age of Empires",
  ],

  // AOE I executable names
  AOE_EXE_NAMES: [
    "Empires.exe",
    "EmpiresM.exe", // Multiplayer/Modified version
    "Empiresx.exe", // Extended version
    "AoE.exe",
    "empires2.exe",
  ],

  // Heartbeat interval (30 seconds)
  HEARTBEAT_INTERVAL: 30000,

  // Polling interval (5 seconds)
  POLLING_INTERVAL: 5000,
};
