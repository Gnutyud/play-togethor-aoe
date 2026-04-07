import { exec } from "child_process";
import { promisify } from "util";
import { accessSync, constants } from "fs";
import path from "path";
import { shell } from "electron";
import { DependencyStatus } from "../../shared/types";
import { APP_CONFIG } from "../config/constants";
import { GameDetector } from "./GameDetector";
import { getLogger } from "../utils/logger";
import { getStore } from "../config/store";

const execAsync = promisify(exec);
const logger = getLogger();

/**
 * DependencyManager
 * Checks and manages dependencies: Radmin VPN and AOE I game
 */
export class DependencyManager {
  private store = getStore();
  private gameDetector = new GameDetector();

  /**
   * Check all dependencies
   */
  async checkAll(): Promise<DependencyStatus> {
    logger.info("Checking all dependencies");

    const radminStatus = await this.checkRadminVpn();
    const gameStatus = await this.checkAoeGame();

    return {
      radminVpn: radminStatus,
      aoeGame: gameStatus,
    };
  }

  /**
   * Check if Radmin VPN is installed
   */
  async checkRadminVpn(): Promise<{
    installed: boolean;
    path?: string;
    version?: string;
  }> {
    logger.info("Checking Radmin VPN installation");

    // Check if we have a saved path
    const savedPath = this.store.get("radminVpnPath");
    if (savedPath && this.fileExists(savedPath)) {
      return {
        installed: true,
        path: savedPath,
      };
    }

    // Try common installation paths
    for (const basePath of APP_CONFIG.RADMIN_VPN_PATHS) {
      const exePath = path.join(basePath, APP_CONFIG.RADMIN_VPN_EXE_NAME);

      if (this.fileExists(exePath)) {
        this.store.set("radminVpnPath", exePath);
        this.store.set("radminVpnInstalled", true);

        logger.info(`Found Radmin VPN at: ${exePath}`);

        return {
          installed: true,
          path: exePath,
        };
      }
    }

    // Try to find via registry (Windows)
    try {
      const registryPath = await this.findRadminInRegistry();
      if (registryPath) {
        this.store.set("radminVpnPath", registryPath);
        this.store.set("radminVpnInstalled", true);

        return {
          installed: true,
          path: registryPath,
        };
      }
    } catch (error) {
      logger.error("Error checking registry for Radmin VPN", error);
    }

    logger.warn("Radmin VPN not found");
    this.store.set("radminVpnInstalled", false);

    return { installed: false };
  }

  /**
   * Check if AOE I game is installed
   */
  async checkAoeGame(): Promise<{
    installed: boolean;
    path?: string;
    version?: string;
  }> {
    logger.info("Checking AOE I installation");

    const gamePath = await this.gameDetector.detectGamePath();

    if (gamePath) {
      return {
        installed: true,
        path: gamePath,
      };
    }

    return { installed: false };
  }

  /**
   * Guide user to install Radmin VPN
   * Opens download page in browser
   */
  async installRadminVpn(): Promise<{ success: boolean; message: string }> {
    logger.info("Opening Radmin VPN download page");

    try {
      await shell.openExternal(APP_CONFIG.RADMIN_VPN_DOWNLOAD_URL);

      return {
        success: true,
        message:
          "Opened Radmin VPN download page. Please install and restart the app.",
      };
    } catch (error: any) {
      logger.error("Failed to open Radmin VPN download page", error);

      return {
        success: false,
        message: `Failed to open download page: ${error.message}`,
      };
    }
  }

  /**
   * Find Radmin VPN in Windows Registry
   */
  private async findRadminInRegistry(): Promise<string | null> {
    try {
      // Try to query registry for Radmin VPN installation path
      const { stdout } = await execAsync(
        'reg query "HKLM\\SOFTWARE\\Radmin VPN" /v InstallPath'
      );

      // Parse the output to get the path
      const match = stdout.match(/InstallPath\s+REG_SZ\s+(.+)/);
      if (match && match[1]) {
        const installPath = match[1].trim();
        const exePath = path.join(installPath, APP_CONFIG.RADMIN_VPN_EXE_NAME);

        if (this.fileExists(exePath)) {
          logger.info(`Found Radmin VPN via registry: ${exePath}`);
          return exePath;
        }
      }
    } catch (error) {
      // Registry key not found or query failed
      logger.debug("Radmin VPN not found in registry");
    }

    return null;
  }

  /**
   * Check if a process is currently running
   */
  async isProcessRunning(exeName: string): Promise<boolean> {
    try {
      const { stdout } = await execAsync(`tasklist /FI "IMAGENAME eq ${exeName}" /NH`);
      return stdout.toLowerCase().includes(exeName.toLowerCase());
    } catch (error) {
      return false;
    }
  }

  /**
   * Ensure Radmin VPN is running, start if not
   */
  async ensureRadminRunning(): Promise<boolean> {
    const isRunning = await this.isProcessRunning(APP_CONFIG.RADMIN_VPN_EXE_NAME);
    if (isRunning) return true;

    const radmin = await this.checkRadminVpn();
    if (radmin.installed && radmin.path) {
      logger.info("Radmin VPN not running, attempting to start...");
      try {
        await execAsync(`start "" "${radmin.path}"`);
        return true;
      } catch (error) {
        logger.error("Failed to start Radmin VPN", error);
        return false;
      }
    }
    return false;
  }

  /**
   * Check if file exists and is accessible
   */
  private fileExists(filePath: string): boolean {
    try {
      accessSync(filePath, constants.F_OK);
      return true;
    } catch {
      return false;
    }
  }
}
