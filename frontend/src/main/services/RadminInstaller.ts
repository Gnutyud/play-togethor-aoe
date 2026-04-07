import { exec } from "child_process";
import { promisify } from "util";
import { app } from "electron";
import path from "path";
import { accessSync, constants } from "fs";
import { getLogger } from "../utils/logger";

const execAsync = promisify(exec);
const logger = getLogger();

/**
 * RadminInstaller
 * Handles silent installation of Radmin VPN from bundled installer
 */
export class RadminInstaller {
  private static readonly INSTALLER_FILENAME = "Radmin_VPN_2.0.4899.9.exe";
  private static readonly INSTALL_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes
  private static readonly PROGRESS_CHECK_INTERVAL_MS = 2000; // 2 seconds

  /**
   * Get the path to the bundled Radmin VPN installer
   */
  private getInstallerPath(): string {
    if (app.isPackaged) {
      // Production: installer is directly in resources folder
      return path.join(
        process.resourcesPath,
        RadminInstaller.INSTALLER_FILENAME
      );
    } else {
      // Development: installer is in project resources folder
      // From dist/main/main/services/ we need to go up 4 levels to reach project root
      return path.join(
        __dirname,
        "../../../..",
        "resources",
        RadminInstaller.INSTALLER_FILENAME
      );
    }
  }

  /**
   * Check if the bundled installer exists
   */
  installerExists(): boolean {
    try {
      const installerPath = this.getInstallerPath();
      accessSync(installerPath, constants.F_OK | constants.R_OK);
      logger.info(`Found Radmin VPN installer at: ${installerPath}`);
      return true;
    } catch (error) {
      logger.error("Radmin VPN installer not found in resources", error);
      return false;
    }
  }

  /**
   * Check if Radmin VPN is already installed
   * Checks common installation paths
   */
  async isInstalled(): Promise<boolean> {
    if (process.platform !== "win32") return true;
    logger.info("Checking if Radmin VPN is already installed");

    const commonPaths = [
      "C:\\Program Files (x86)\\Radmin VPN\\RvpnGui.exe",
      "C:\\Program Files\\Radmin VPN\\RvpnGui.exe",
      "C:\\Program Files (x86)\\Radmin VPN\\Radmin.exe",
      "C:\\Program Files\\Radmin VPN\\Radmin.exe",
      "C:\\Program Files (x86)\\Radmin VPN\\RadminVPN.exe",
      "C:\\Program Files\\Radmin VPN\\RadminVPN.exe",
    ];

    for (const exePath of commonPaths) {
      if (this.fileExists(exePath)) {
        logger.info(`Radmin VPN already installed at: ${exePath}`);
        return true;
      }
    }

    if (await this.findRadminInRegistry()) {
      return true;
    }

    logger.info("Radmin VPN not installed");
    return false;
  }

  private async findRadminInRegistry(): Promise<string | null> {
    const registryKeys = [
      'HKLM\\SOFTWARE\\Radmin VPN',
      'HKLM\\SOFTWARE\\WOW6432Node\\Radmin VPN'
    ];

    const exeNames = ["RvpnGui.exe", "Radmin.exe", "RadminVPN.exe"];

    for (const key of registryKeys) {
      try {
        // Try to query registry for Radmin VPN installation path
        const { stdout } = await execAsync(
          `reg query "${key}" /v InstallPath`
        );

        // Parse the output to get the path
        const match = stdout.match(/InstallPath\s+REG_SZ\s+(.+)/);
        if (match && match[1]) {
          const installPath = match[1].trim();

          for (const exeName of exeNames) {
            const exePath = path.join(installPath, exeName);
            if (this.fileExists(exePath)) {
              logger.info(`Found Radmin VPN via registry (${key}): ${exePath}`);
              return exePath;
            }
          }
        }
      } catch (error) {
        // Registry key not found or query failed
      }
    }
    return null;
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

  /**
   * Run silent installation of Radmin VPN
   * @param onProgress Optional callback for progress updates (0-100)
   * @returns Promise resolving to success status
   */
  async runSilentInstall(onProgress?: (percent: number) => void): Promise<{
    success: boolean;
    error?: string;
  }> {
    logger.info("Starting Radmin VPN silent installation");

    // Check if installer exists
    if (!this.installerExists()) {
      const error = "Radmin VPN installer not found in application resources";
      logger.error(error);
      return { success: false, error };
    }

    // Check if already installed
    if (await this.isInstalled()) {
      logger.info("Radmin VPN already installed, skipping installation");
      return { success: true };
    }

    const installerPath = this.getInstallerPath();

    try {
      // Start installation with /S flag (NSIS silent install)
      logger.info(`Executing: "${installerPath}" /S`);

      // Report initial progress
      if (onProgress) onProgress(10);

      // Execute installer asynchronously (doesn't block)
      const installProcess = execAsync(`"${installerPath}" /S`, {
        timeout: RadminInstaller.INSTALL_TIMEOUT_MS,
      });

      // Poll for installation completion
      const startTime = Date.now();
      let progressPercent = 10;

      const checkInterval = setInterval(async () => {
        const elapsed = Date.now() - startTime;
        const elapsedPercent = Math.min(
          80,
          (elapsed / RadminInstaller.INSTALL_TIMEOUT_MS) * 100
        );
        progressPercent = Math.max(progressPercent, elapsedPercent);

        // Check if installed
        if (await this.isInstalled()) {
          clearInterval(checkInterval);
          if (onProgress) onProgress(100);
          logger.info("Radmin VPN installation detected as complete");
        } else {
          if (onProgress) onProgress(progressPercent);
        }
      }, RadminInstaller.PROGRESS_CHECK_INTERVAL_MS);

      // Wait for installer to complete
      await installProcess;
      clearInterval(checkInterval);

      // Final verification
      if (await this.isInstalled()) {
        logger.info("Radmin VPN installation completed successfully");
        if (onProgress) onProgress(100);
        return { success: true };
      } else {
        throw new Error("Installation completed but Radmin VPN not detected");
      }
    } catch (error: any) {
      logger.error("Radmin VPN installation failed", error);

      let errorMessage = "Installation failed";
      if (error.message?.includes("timeout")) {
        errorMessage = "Installation timed out after 5 minutes";
      } else if (error.code === "ENOENT") {
        errorMessage = "Installer file not found";
      } else if (error.stderr) {
        errorMessage = `Installation error: ${error.stderr}`;
      }

      return { success: false, error: errorMessage };
    }
  }

  /**
   * Retry installation with user confirmation
   */
  async retryInstall(onProgress?: (percent: number) => void): Promise<{
    success: boolean;
    error?: string;
  }> {
    logger.info("Retrying Radmin VPN installation");
    return this.runSilentInstall(onProgress);
  }
}

// Export singleton instance
export const radminInstaller = new RadminInstaller();
