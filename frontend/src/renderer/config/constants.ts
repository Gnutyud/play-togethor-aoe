/**
 * Frontend application constants
 */

export const APP_CONFIG = {
  NAME: "AOE Launcher",
  VERSION: "1.0.0",

  // Polling interval for room updates (5 seconds)
  POLLING_INTERVAL: 5000,

  // Heartbeat interval to keep user active in room (30 seconds)
  HEARTBEAT_INTERVAL: 30000,

  // Max players per room
  MAX_PLAYERS: 8,

  // API Configuration
  API_URL: import.meta.env.VITE_API_URL || "https://play-togethor-aoe.vercel.app",

  // Room types
  ROOM_TYPE: {
    DEFAULT: "default",
    CUSTOM: "custom",
  } as const,
};
