import { app, BrowserWindow, dialog } from "electron";
import path from "path";
import { setupIpcHandlers } from "./ipc/handlers";
import { initializeLogger } from "./utils/logger";
import { radminInstaller } from "./services/RadminInstaller";
import {
  createSplashWindow,
  closeSplashWindow,
  updateSplashProgress,
  updateSplashStatus,
} from "./windows/splash";

const logger = initializeLogger();

// Handle creating/removing shortcuts on Windows when installing/uninstalling
if (require("electron-squirrel-startup")) {
  app.quit();
}

let mainWindow: BrowserWindow | null = null;

const createWindow = () => {
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    title: "AOE Launcher",
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false, // Disabled for now - preload needs to require local modules
      preload: path.join(__dirname, "preload.js"),
    },
    autoHideMenuBar: true,
    backgroundColor: "#1a1a1a",
  });

  // Load the app
  if (process.env.NODE_ENV === "development") {
    mainWindow.loadURL("http://localhost:5173");
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, "../renderer/index.html"));
  }

  // Setup IPC handlers
  setupIpcHandlers(mainWindow);

  mainWindow.on("closed", () => {
    mainWindow = null;
  });

  logger.info("Main window created");
};

/**
 * Check and auto-install Radmin VPN if needed
 */
const checkAndInstallRadmin = async (): Promise<boolean> => {
  try {
    logger.info("Checking Radmin VPN installation status");

    // Check if already installed
    const isInstalled = await radminInstaller.isInstalled();
    if (isInstalled) {
      logger.info("Radmin VPN already installed, skipping installation");
      return true;
    }

    logger.info("Radmin VPN not found, starting auto-install");

    // Check if installer exists
    if (!radminInstaller.installerExists()) {
      logger.error("Radmin VPN installer not found in resources");
      await dialog.showMessageBox({
        type: "error",
        title: "Installation Error",
        message: "Radmin VPN installer not found",
        detail:
          "The Radmin VPN installer is missing from the application. Please reinstall the AOE Launcher.",
        buttons: ["Exit"],
      });
      return false;
    }

    // Show splash screen
    createSplashWindow();
    updateSplashStatus("Installing Radmin VPN...");
    updateSplashProgress(0);

    // Run silent installation
    const installResult = await radminInstaller.runSilentInstall((percent) => {
      updateSplashProgress(percent);
    });

    // Close splash screen
    closeSplashWindow();

    if (!installResult.success) {
      logger.error("Radmin VPN installation failed", installResult.error);

      const result = await dialog.showMessageBox({
        type: "error",
        title: "Installation Failed",
        message: "Failed to install Radmin VPN",
        detail:
          installResult.error ||
          "An unknown error occurred during installation. You may need to install Radmin VPN manually.",
        buttons: ["Retry", "Continue Anyway", "Exit"],
        defaultId: 0,
        cancelId: 2,
      });

      if (result.response === 0) {
        // Retry
        return await checkAndInstallRadmin();
      } else if (result.response === 1) {
        // Continue anyway
        logger.warn("User chose to continue without Radmin VPN");
        return true;
      } else {
        // Exit
        return false;
      }
    }

    logger.info("Radmin VPN installation completed successfully");
    return true;
  } catch (error) {
    logger.error("Unexpected error during Radmin VPN check/install", error);

    const result = await dialog.showMessageBox({
      type: "error",
      title: "Unexpected Error",
      message: "An unexpected error occurred",
      detail:
        "Failed to check or install Radmin VPN. You can try again or continue anyway.",
      buttons: ["Retry", "Continue Anyway", "Exit"],
      defaultId: 0,
      cancelId: 2,
    });

    if (result.response === 0) {
      return await checkAndInstallRadmin();
    } else if (result.response === 1) {
      return true;
    } else {
      return false;
    }
  }
};

// This method will be called when Electron has finished initialization
app.whenReady().then(async () => {
  logger.info("Application ready, checking dependencies");

  // Check and install Radmin VPN if needed
  const radminReady = await checkAndInstallRadmin();

  if (!radminReady) {
    logger.error(
      "Radmin VPN installation failed or cancelled, exiting application"
    );
    app.quit();
    return;
  }

  // Create main window after Radmin check
  createWindow();

  app.on("activate", () => {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });

  logger.info("Application initialization complete");
});

// Quit when all windows are closed, except on macOS
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

// Handle cleanup on quit
app.on("before-quit", async () => {
  logger.info("Application quitting, performing cleanup...");

  // TODO: Disconnect from VPN if connected
  // TODO: Leave room if in a room

  logger.info("Cleanup complete");
});

// Handle uncaught exceptions
process.on("uncaughtException", (error: Error) => {
  logger.error("Uncaught exception:", error);
});

process.on(
  "unhandledRejection",
  (reason: unknown, promise: Promise<unknown>) => {
    logger.error("Unhandled Rejection at:", promise, "reason:", reason);
  }
);
