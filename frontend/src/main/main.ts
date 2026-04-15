import { app, BrowserWindow, dialog } from "electron";
import path from "path";
import { setupIpcHandlers } from "./ipc/handlers";
import { initializeLogger } from "./utils/logger";
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
    // Multi-path strategy for robustness
    const indexPaths = [
      path.join(__dirname, "..", "..", "renderer", "index.html"),
      path.join(__dirname, "..", "renderer", "index.html"),
      path.join(__dirname, "..", "..", "..", "renderer", "index.html"),
      path.join(__dirname, "index.html"),
    ];

    let loaded = false;
    for (const p of indexPaths) {
      try {
        if (mainWindow) {
          mainWindow.loadFile(p);
          logger.info(`Successfully loaded UI from: ${p}`);
          loaded = true;
          break;
        }
      } catch (e) {
        logger.debug(`Tried UI path ${p}, failed.`);
      }
    }

    if (!loaded) {
      logger.error("COULD NOT FIND index.html in any known location!");
    }
  }

  // Setup IPC handlers
  if (mainWindow) {
    setupIpcHandlers(mainWindow);

    mainWindow.on("closed", () => {
      mainWindow = null;
    });
  }

  logger.info("Main window created");
};

// Removed Radmin auto-install logic

// This method will be called when Electron has finished initialization
app.whenReady().then(async () => {
  logger.info("Application ready");
  
  // Create main window directly
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
  },
);
