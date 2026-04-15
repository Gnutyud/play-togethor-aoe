import { exec } from "child_process";
import { promisify } from "util";
import { existsSync } from "fs";
import path from "path";
import { app } from "electron";
import { DependencyStatus } from "../../shared/types";
import { GameDetector } from "./GameDetector";
import { getLogger } from "../utils/logger";

const execAsync = promisify(exec);
const logger = getLogger();

/**
 * DependencyManager
 * Checks and manages dependencies: P2P Network (N2N) and AOE I game
 */
export class DependencyManager {
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
   * Check if P2P network tools (N2N) are available
   */
  private async checkP2PNetwork(): Promise<{
    installed: boolean;
    hasDriver: boolean;
    binaryPath: string;
  }> {
    const binDir = app.isPackaged
      ? path.join(process.resourcesPath, "bin", "n2n")
      : path.join(app.getAppPath(), "resources", "bin", "n2n");

    const wintunPath = path.join(binDir, "wintun.dll");
    const edgePath = path.join(binDir, "edge.exe");

    const hasBinaries = existsSync(edgePath) && existsSync(wintunPath);

    // Check for WinTun driver in registry
    let hasDriver = false;
    if (process.platform === "win32") {
      try {
        await execAsync(
          'reg query "HKLM\\SYSTEM\\CurrentControlSet\\Control\\Class\\{4d36e972-e325-11ce-bfc1-08002be10318}" /s /f "Wintun"',
        );
        hasDriver = true;
      } catch (e) {
        hasDriver = false;
      }
    }

    return {
      installed: hasBinaries,
      hasDriver: hasDriver,
      binaryPath: binDir,
    };
  }

  /**
   * Check if AOE I is installed and get its path
   */
  private async checkAoeGame(): Promise<{
    installed: boolean;
    path: string;
    version: string;
  }> {
    const gamePath = await this.gameDetector.detectGamePath();

    if (gamePath) {
      return {
        installed: true,
        path: gamePath,
        version: "1.0",
      };
    }

    return {
      installed: false,
      path: "",
      version: "",
    };
  }
}
