import { exec, spawn } from "child_process";
import { promisify } from "util";
import path from "path";
import { app } from "electron";
import { RadminVpnConnection } from "../../shared/types";
import { DependencyManager } from "./DependencyManager";
import { getLogger } from "../utils/logger";

const execAsync = promisify(exec);
const logger = getLogger();

/**
 * RadminVpnManager
 * Manages Radmin VPN connections with PowerShell automation
 */
export class RadminVpnManager {
  private dependencyManager = new DependencyManager();
  private currentConnection: RadminVpnConnection | null = null;

  /**
   * Connect to Radmin VPN network (AUTO-CONNECT with PowerShell)
   */
  async connect(
    connection: RadminVpnConnection
  ): Promise<{ success: boolean; message: string }> {
    logger.info("Auto-connecting to Radmin VPN", {
      networkId: connection.networkId,
    });

    try {
      // Check if Radmin VPN is installed
      const radminStatus = await this.dependencyManager.checkRadminVpn();
      if (!radminStatus.installed || !radminStatus.path) {
        return {
          success: false,
          message: "Radmin VPN is not installed. Please install it first.",
        };
      }

      // Disconnect from current network if connected
      if (this.currentConnection) {
        logger.info("Disconnecting from current network first");
        await this.disconnect();
      }

      // AUTO-CONNECT using PowerShell script
      const networkId = connection.networkId || "";
      const password = connection.password || "";

      if (!networkId || !password) {
        return {
          success: false,
          message: "Network ID and Password are required",
        };
      }

      logger.info("Running PowerShell auto-connect script...");
      const result = await this.runPowerShellConnect(networkId, password);

      if (result.success) {
        this.currentConnection = connection;
        logger.info("Successfully connected to Radmin VPN network");

        return {
          success: true,
          message: "Successfully connected to VPN network!",
        };
      } else {
        return {
          success: false,
          message:
            result.error ||
            "Failed to auto-connect. Please connect manually in Radmin VPN.",
        };
      }
    } catch (error: any) {
      logger.error("Failed to connect to Radmin VPN:", error);

      return {
        success: false,
        message: `Auto-connect failed: ${error.message}. Please connect manually.`,
      };
    }
  }

  /**
   * Disconnect from Radmin VPN network (AUTO-DISCONNECT with PowerShell)
   */
  async disconnect(): Promise<{ success: boolean; message: string }> {
    logger.info("Auto-disconnecting from Radmin VPN");

    try {
      if (!this.currentConnection) {
        return {
          success: true,
          message: "Not connected to any network",
        };
      }

      // AUTO-DISCONNECT using PowerShell script
      logger.info("Running PowerShell auto-disconnect script...");
      const result = await this.runPowerShellDisconnect();

      this.currentConnection = null;

      if (result.success) {
        logger.info("Successfully disconnected from Radmin VPN");
        return {
          success: true,
          message: "Successfully disconnected from VPN",
        };
      } else {
        return {
          success: true, // Still clear connection state
          message: "Disconnected (manual verification recommended)",
        };
      }
    } catch (error: any) {
      logger.error("Failed to disconnect from Radmin VPN:", error);
      this.currentConnection = null; // Clear state anyway

      return {
        success: true,
        message: "Disconnected from app (please verify in Radmin VPN)",
      };
    }
  }

  /**
   * Get current connection status
   */
  getConnectionStatus(): RadminVpnConnection | null {
    return this.currentConnection;
  }

  /**
   * Run PowerShell script to auto-connect to Radmin VPN
   */
  private async runPowerShellConnect(
    networkId: string,
    password: string
  ): Promise<{ success: boolean; error?: string }> {
    return new Promise((resolve) => {
      try {
        const scriptPath = app.isPackaged
          ? path.join(process.resourcesPath, "resources", "radmin-connect.ps1")
          : path.join(__dirname, "../../../resources/radmin-connect.ps1");

        logger.info(`Using PowerShell script: ${scriptPath}`);

        // Use spawn with array of arguments to prevent command injection
        const ps = spawn("powershell.exe", [
          "-ExecutionPolicy", "Bypass",
          "-File", scriptPath,
          "-NetworkId", networkId,
          "-Password", password
        ]);

        let stdout = "";
        let stderr = "";

        ps.stdout.on("data", (data: any) => {
          stdout += data.toString();
        });

        ps.stderr.on("data", (data: any) => {
          stderr += data.toString();
        });

        // Set a 15 second timeout
        const timeout = setTimeout(() => {
          ps.kill();
          logger.error("PowerShell connect timed out after 15s");
          resolve({ success: false, error: "Connection timed out. Please check Radmin VPN." });
        }, 15000);

        ps.on("close", (code: number) => {
          clearTimeout(timeout);
          logger.info("PowerShell output:", stdout);

          if (code !== 0 && !stdout.includes("successfully") && !stdout.includes("initiated")) {
            logger.error("PowerShell stderr:", stderr);
            resolve({ 
              success: false, 
              error: stderr.trim() || `Process exited with code ${code}` 
            });
          } else {
            resolve({ success: true });
          }
        });
      } catch (error: any) {
        logger.error("Failed to spawn PowerShell:", error);
        resolve({ success: false, error: error.message });
      }
    });
  }

  /**
   * Run PowerShell script to auto-disconnect from Radmin VPN
   */
  private async runPowerShellDisconnect(): Promise<{
    success: boolean;
    error?: string;
  }> {
    return new Promise((resolve) => {
      try {
        const scriptPath = app.isPackaged
          ? path.join(process.resourcesPath, "resources", "radmin-disconnect.ps1")
          : path.join(__dirname, "../../../resources/radmin-disconnect.ps1");

        const ps = spawn("powershell.exe", [
          "-ExecutionPolicy", "Bypass",
          "-File", scriptPath
        ]);

        // 10 second timeout
        const timeout = setTimeout(() => {
          ps.kill();
          resolve({ success: false, error: "Disconnect timed out" });
        }, 10000);

        ps.on("close", (code: number) => {
          clearTimeout(timeout);
          resolve({ success: code === 0 });
        });
      } catch (error: any) {
        logger.error("Failed to spawn PowerShell (disconnect):", error);
        resolve({ success: false, error: error.message });
      }
    });
  }

  /**
   * Kill Radmin VPN process
   */
  async killRadminVpn(): Promise<void> {
    try {
      await execAsync('taskkill /F /IM "Radmin VPN.exe"');
      logger.info("Radmin VPN process killed");
      this.currentConnection = null;
    } catch (error) {
      logger.error("Failed to kill Radmin VPN process:", error);
    }
  }
}
