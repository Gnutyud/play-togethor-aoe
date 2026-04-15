import { exec } from "child_process";
import { promisify } from "util";
import { accessSync, constants, readdirSync } from "fs";
import path from "path";
import { APP_CONFIG } from "../config/constants";
import { getLogger } from "../utils/logger";
import { getStore } from "../config/store";

const execAsync = promisify(exec);
const logger = getLogger();

/**
 * GameDetector
 * Auto-detects AOE I installation path
 */
export class GameDetector {
  private store = getStore();

  /**
   * Detect AOE I game path
   * Tries saved path, common paths, and registry
   */
  async detectGamePath(): Promise<string | null> {
    logger.info("Detecting AOE I game path");

    // 1. Check saved path
    const savedPath = this.store.get("gamePath");
    if (savedPath && this.isValidGamePath(savedPath)) {
      logger.info(`Using saved game path: ${savedPath}`);
      return savedPath;
    }

    // 2. Try common installation paths
    for (const basePath of APP_CONFIG.AOE_GAME_PATHS) {
      if (this.fileExists(basePath)) {
        const gamePath = this.findGameExecutable(basePath);
        if (gamePath) {
          this.store.set("gamePath", gamePath);
          logger.info(`Found game at common path: ${gamePath}`);
          return gamePath;
        }
      }
    }

    // 3. Try Steam registry
    const steamPath = await this.findGameInSteamRegistry();
    if (steamPath) {
      this.store.set("gamePath", steamPath);
      logger.info(`Found game via Steam registry: ${steamPath}`);
      return steamPath;
    }

    // 4. Try GOG registry
    const gogPath = await this.findGameInGogRegistry();
    if (gogPath) {
      this.store.set("gamePath", gogPath);
      logger.info(`Found game via GOG registry: ${gogPath}`);
      return gogPath;
    }

    logger.warn("AOE I game not found");
    return null;
  }

  /**
   * Validate a custom game path provided by user
   */
  validateGamePath(customPath: string): boolean {
    return this.isValidGamePath(customPath);
  }

  /**
   * Set and save custom game path
   */
  setGamePath(gamePath: string): boolean {
    if (this.isValidGamePath(gamePath)) {
      this.store.set("gamePath", gamePath);
      logger.info(`Game path set to: ${gamePath}`);
      return true;
    }

    logger.error(`Invalid game path: ${gamePath}`);
    return false;
  }

  /**
   * Check if path is a valid AOE I game path
   */
  private isValidGamePath(gamePath: string): boolean {
    logger.debug(`Validating game path: ${gamePath}`);

    if (!this.fileExists(gamePath)) {
      logger.debug(`Path does not exist: ${gamePath}`);
      return false;
    }

    // Check if it's a directory or executable
    const isDirectory = path.extname(gamePath) === "";

    if (isDirectory) {
      // Find executable in directory
      logger.debug(`Path is a directory, searching for executable...`);
      const exePath = this.findGameExecutable(gamePath);
      if (exePath) {
        logger.debug(`Found executable in directory: ${exePath}`);
      } else {
        logger.debug(`No valid executable found in directory`);
      }
      return exePath !== null;
    } else {
      // Check if it's one of the known executables
      const fileName = path.basename(gamePath);
      const isValid = APP_CONFIG.AOE_EXE_NAMES.includes(fileName);
      logger.debug(
        `Checking executable: ${fileName}, Valid: ${isValid}, Allowed names: ${APP_CONFIG.AOE_EXE_NAMES.join(
          ", "
        )}`
      );
      return isValid;
    }
  }

  /**
   * Find game executable in a directory
   */
  public findGameExecutable(dirPath: string): string | null {
    try {
      const files = readdirSync(dirPath);

      for (const exeName of APP_CONFIG.AOE_EXE_NAMES) {
        if (files.includes(exeName)) {
          const fullPath = path.join(dirPath, exeName);
          if (this.fileExists(fullPath)) {
            return fullPath;
          }
        }
      }
    } catch (error) {
      logger.debug(`Error reading directory ${dirPath}:`, error);
    }

    return null;
  }

  /**
   * Find game in Steam registry
   */
  private async findGameInSteamRegistry(): Promise<string | null> {
    try {
      // Query Steam installation path
      const { stdout } = await execAsync(
        'reg query "HKLM\\SOFTWARE\\WOW6432Node\\Valve\\Steam" /v InstallPath'
      );

      const match = stdout.match(/InstallPath\s+REG_SZ\s+(.+)/);
      if (match && match[1]) {
        const steamPath = match[1].trim();

        // Common Steam library paths
        const libraryPaths = [
          path.join(steamPath, "steamapps", "common", "Age of Empires"),
          path.join(steamPath, "steamapps", "common", "AgeOfEmpires"),
          path.join(
            steamPath,
            "steamapps",
            "common",
            "Age of Empires Definitive Edition"
          ),
        ];

        for (const libPath of libraryPaths) {
          const gamePath = this.findGameExecutable(libPath);
          if (gamePath) {
            return gamePath;
          }
        }
      }
    } catch (error) {
      logger.debug("Steam registry query failed:", error);
    }

    return null;
  }

  /**
   * Find game in GOG registry
   */
  private async findGameInGogRegistry(): Promise<string | null> {
    try {
      // Query GOG Galaxy for Age of Empires
      const { stdout } = await execAsync(
        'reg query "HKLM\\SOFTWARE\\WOW6432Node\\GOG.com\\Games" /s /f "Age of Empires"'
      );

      // Parse output for installation path
      const match = stdout.match(/Path\s+REG_SZ\s+(.+)/);
      if (match && match[1]) {
        const gogPath = match[1].trim();
        const gamePath = this.findGameExecutable(gogPath);
        if (gamePath) {
          return gamePath;
        }
      }
    } catch (error) {
      logger.debug("GOG registry query failed:", error);
    }

    return null;
  }

  /**
   * Check if file/directory exists
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
