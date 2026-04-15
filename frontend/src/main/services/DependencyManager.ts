import { exec } from "child_process";
import { promisify } from "util";
import { accessSync, constants } from "fs";
import path from "path";
import { app } from "electron";
import { DependencyStatus } from "../../shared/types";
import { GameDetector } from "./GameDetector";
import { getLogger } from "../utils/logger";
import { getStore } from "../config/store";

const execAsync = promisify(exec);
const logger = getLogger();

/**
 * DependencyManager
 * Checks and manages dependencies: P2P Network (N2N) and AOE I game
 */
export class DependencyManager {
  private store = getStore();
  private gameDetector = new GameDetector();

  /**
   * Check all dependencies
   */
  async checkAll(): Promise<DependencyStatus> {
    logger.info("Checking all dependencies");

    const p2pStatus = await this.checkP2PNetwork();
    const gameStatus = await this.checkAoeGame();

    return {
      p2pNetwork: p2pStatus,
      aoeGame: gameStatus,
    };
  }

  /**
   * Check if P2P (N2N) binaries are available and driver is ready
   */
  async checkP2PNetwork(): Promise<{
    installed: boolean;
    hasDriver: boolean;
    binaryPath?: string;
  }> {
    logger.info("Checking P2P Network binaries");

    const binDir = app.isPackaged
      ? path.join(process.resourcesPath, "bin", "n2n")
      : path.join(app.getAppPath(), "resources", "bin", "n2n");

    const edgePath = path.join(binDir, "edge.exe");
    const wintunPath = path.join(binDir, "wintun.dll");

    const hasBinaries = this.fileExists(edgePath) && this.fileExists(wintunPath);
    
    // Check if WinTun driver is likely available (basic check)
    // In production, we might want a more robust check via registry
    let hasDriver = false;
    if (process.platform === "win32") {
        try {
            // Check for WinTun registry key or similar
            await execAsync('reg query "HKLM\\SYSTEM\\CurrentControlSet\\Services\\wintun"');
            hasDriver = true;
        } catch (e) {
            hasDriver = false;
        }
    }

    return {
      installed: hasBinaries,
      hasDriver: hasDriver,
      binaryPath: hasBinaries ? edgePath : undefined,
    };
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
