import { BrowserWindow, ipcMain, dialog, IpcMainInvokeEvent } from "electron";
import { IPC_CHANNELS } from "../../shared/constants";
import { DependencyManager } from "../services/DependencyManager";
import { GameDetector } from "../services/GameDetector";
import { GameLauncher } from "../services/GameLauncher";
import { RadminVpnManager } from "../services/RadminVpnManager";
import { getStore } from "../config/store";
import { getLogger } from "../utils/logger";

const logger = getLogger();

/**
 * Setup all IPC handlers for communication with renderer process
 */
export function setupIpcHandlers(mainWindow: BrowserWindow) {
  const store = getStore();
  const dependencyManager = new DependencyManager();
  const gameDetector = new GameDetector();
  const gameLauncher = new GameLauncher();
  const vpnManager = new RadminVpnManager();

  logger.info("Setting up IPC handlers");

  // ===== Dependency Management =====
  ipcMain.handle(IPC_CHANNELS.DEPENDENCY_CHECK, async () => {
    logger.info("Checking dependencies");
    return await dependencyManager.checkAll();
  });

  ipcMain.handle(IPC_CHANNELS.DEPENDENCY_INSTALL_RADMIN, async () => {
    logger.info("Installing Radmin VPN");
    return await dependencyManager.installRadminVpn();
  });

  // ===== Game Management =====
  ipcMain.handle(IPC_CHANNELS.GAME_DETECT, async () => {
    logger.info("Detecting game installation");
    const path = await gameDetector.detectGamePath();

    if (path) {
      // Save detected path
      store.set("gamePath", path);
      return { found: true, path };
    }

    return { found: false };
  });

  ipcMain.handle(IPC_CHANNELS.GAME_SELECT_PATH, async () => {
    logger.info("Opening game path selection dialog");

    const result = await dialog.showOpenDialog(mainWindow, {
      title: "Select Age of Empires I executable",
      filters: [
        { name: "Executable", extensions: ["exe"] },
        { name: "All Files", extensions: ["*"] },
      ],
      properties: ["openFile"],
    });

    if (!result.canceled && result.filePaths.length > 0) {
      const selectedPath = result.filePaths[0];

      logger.info(`User selected path: ${selectedPath}`);

      // Validate it's a valid game executable
      if (gameDetector.validateGamePath(selectedPath)) {
        store.set("gamePath", selectedPath);
        logger.info(`Game path validated and saved: ${selectedPath}`);
        return { success: true, path: selectedPath };
      } else {
        const fileName = selectedPath.split("\\").pop() || selectedPath;
        logger.warn(`Invalid game path selected: ${selectedPath}`);
        return {
          success: false,
          message: `"${fileName}" is not a valid Age of Empires executable. Please select Empires.exe, EmpiresM.exe, or Empiresx.exe.`,
        };
      }
    }

    return { success: false, message: "No file selected" };
  });

  ipcMain.handle(
    IPC_CHANNELS.GAME_LAUNCH,
    async (_event: IpcMainInvokeEvent, config: any) => {
      logger.info("Launching game", config);

      try {
        await gameLauncher.launch(config);
        return { success: true };
      } catch (error: any) {
        logger.error("Failed to launch game", error);
        return { success: false, error: error.message };
      }
    },
  );

  // ===== Radmin VPN Management =====
  ipcMain.handle(IPC_CHANNELS.VPN_CHECK_STATUS, async () => {
    logger.info("Checking VPN status");
    return vpnManager.getConnectionStatus();
  });

  ipcMain.handle(
    IPC_CHANNELS.VPN_CONNECT,
    async (_event: IpcMainInvokeEvent, connection: any) => {
      logger.info("Connecting to VPN", { networkId: connection.networkId });
      return await vpnManager.connect(connection);
    },
  );

  ipcMain.handle(IPC_CHANNELS.VPN_DISCONNECT, async () => {
    logger.info("Disconnecting from VPN");

    try {
      await vpnManager.disconnect();
      return { success: true };
    } catch (error: any) {
      logger.error("Failed to disconnect from VPN", error);
      return { success: false };
    }
  });

  // ===== Settings =====
  ipcMain.handle(
    IPC_CHANNELS.SETTINGS_GET,
    async (_event: IpcMainInvokeEvent, key: string) => {
      return store.get(key);
    },
  );

  ipcMain.handle(
    IPC_CHANNELS.SETTINGS_SET,
    async (_event: IpcMainInvokeEvent, key: string, value: any) => {
      store.set(key, value);
    },
  );

  // ===== Window Controls =====
  ipcMain.on(IPC_CHANNELS.WINDOW_MINIMIZE, () => {
    mainWindow.minimize();
  });

  ipcMain.on(IPC_CHANNELS.WINDOW_MAXIMIZE, () => {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
  });

  ipcMain.on(IPC_CHANNELS.WINDOW_CLOSE, () => {
    mainWindow.close();
  });

  logger.info("IPC handlers setup complete");
}
