import { ChildProcess } from "child_process";
import path from "path";
import { GameConfig } from "../../shared/types";
import { GameDetector } from "./GameDetector";
import { getLogger } from "../utils/logger";

const logger = getLogger();

/**
 * GameLauncher
 * Launches AOE I game with multiplayer settings
 */
export class GameLauncher {
  private gameDetector = new GameDetector();
  private gameProcess: ChildProcess | null = null;

  /**
   * Launch AOE I game with config
   */
  async launch(
    config: GameConfig
  ): Promise<{ success: boolean; message: string }> {
    logger.info("Launching AOE I game", { config });

    try {
      // Get game path
      let gamePath = config.gamePath || (await this.gameDetector.detectGamePath());

      if (!gamePath) {
        return {
          success: false,
          message: "AOE I game not found. Please set the game path in settings.",
        };
      }

      // If the path is a directory, resolve it to the executable
      const isDirectory = path.extname(gamePath) === "";
      if (isDirectory) {
        logger.info(`Provided path is a directory, searching for executable: ${gamePath}`);
        const resolvedPath = (this.gameDetector as any).findGameExecutable(gamePath);
        if (resolvedPath) {
          gamePath = resolvedPath;
          logger.info(`Resolved directory to executable: ${gamePath}`);
        } else {
          return {
            success: false,
            message: "No valid game executable found in the selected folder. Look for Empires.exe or similar.",
          };
        }
      }

      if (!gamePath) return { success: false, message: "Invalid game path" };

      // Validate game path - Only strict if not manually selected or if we want to be safe
      // But if the user CHOSE this file, we should trust them more
      if (!this.gameDetector.validateGamePath(gamePath)) {
        // If it's a .exe, allow it anyway if it was manually chosen
        const isExe = path.extname(gamePath).toLowerCase() === ".exe";
        if (!isExe) {
          return {
            success: false,
            message: "Invalid game path. Please check the game path in settings.",
          };
        }
        logger.info(`Path ${gamePath} failed strict validation but is an EXE, allowing manual choice.`);
      }

      // Kill existing game process if running
      if (this.gameProcess && !this.gameProcess.killed) {
        logger.info("Killing existing game process");
        this.gameProcess.kill();
        this.gameProcess = null;
      }

      // Build launch arguments
      const args: string[] = [];

      // Add multiplayer/network flag
      // AOE I uses /netplay or similar flags for LAN multiplayer
      if (config.enableMultiplayer) {
        args.push("/netplay");
      }

      // Add window mode if specified
      if (config.windowMode) {
        args.push("/window");
      }

      // Add resolution if specified
      if (config.resolution) {
        args.push(`/res:${config.resolution}`);
      }

      const gameDir = path.dirname(gamePath);
      logger.info(`Launching game: ${gamePath} from CWD: ${gameDir}`, { args });

      // Using Electron's native shell.openPath - the most reliable way to "double-click" a file
      const { shell } = require("electron");
      
      try {
        // Prepare additional args if any (though openPath mostly just opens the file)
        // If args are needed, we might still need a fallback or different method
        // But let's try the cleanest way first
        const errorMessage = await shell.openPath(gamePath);
        
        if (errorMessage) {
          logger.error("shell.openPath error:", errorMessage);
          return {
            success: false,
            message: `Windows Error: ${errorMessage}. Try running as Administrator.`,
          };
        }

        logger.info("Game opened successfully via shell.openPath");
        return {
          success: true,
          message: "Game launched successfully",
        };
      } catch (err: any) {
        logger.error("Native launch failed, attempting fallback:", err);
        // Fallback to a simpler exec if native shell fails
        return new Promise((resolve) => {
          const { exec } = require("child_process");
          exec(`start "" "${gamePath}"`, { cwd: gameDir }, (error: any, _stdout: any, stderr: any) => {
            if (error) {
              resolve({
                success: false,
                message: `Launch Failed: ${error.message}\n${stderr}`,
              });
            } else {
              resolve({ success: true, message: "Launched via fallback" });
            }
          });
        });
      }
    } catch (error: any) {
      logger.error("Fatal launch failure:", error);
      return {
        success: false,
        message: `Fatal Launcher Error: ${error.message}`,
      };
    }
  }

  /**
   * Check if game is currently running
   */
  isGameRunning(): boolean {
    return this.gameProcess !== null && !this.gameProcess.killed;
  }

  /**
   * Kill game process
   */
  killGame(): void {
    if (this.gameProcess && !this.gameProcess.killed) {
      logger.info("Killing game process");
      this.gameProcess.kill();
      this.gameProcess = null;
    }
  }
}
