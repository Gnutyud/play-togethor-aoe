import Store from "electron-store";

interface StoreSchema {
  // Setup
  setupCompleted: boolean;

  // Game settings
  gamePath: string;

  // Radmin VPN settings
  radminVpnPath: string;
  radminVpnInstalled: boolean;

  // User preferences
  pollingInterval: number; // milliseconds
  lastRoomJoined: string;

  // Window state
  windowBounds: {
    width: number;
    height: number;
    x: number;
    y: number;
  };
}

let storeInstance: Store<StoreSchema> | null = null;

export function getStore(): Store<StoreSchema> {
  if (!storeInstance) {
    storeInstance = new Store<StoreSchema>({
      defaults: {
        setupCompleted: false,
        gamePath: "",
        radminVpnPath: "",
        radminVpnInstalled: false,
        pollingInterval: 5000, // 5 seconds
        lastRoomJoined: "",
        windowBounds: {
          width: 1200,
          height: 800,
          x: 0,
          y: 0,
        },
      },
    });
  }

  return storeInstance;
}
