import { spawn, ChildProcess } from "child_process";
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

      // Validate game path
      if (!this.gameDetector.validateGamePath(gamePath)) {
        return {
          success: false,
          message: "Invalid game path. Please check the game path in settings.",
        };
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

      // Spawn game process
      // On Windows with shell: true, we don't need extra quotes around the path
      this.gameProcess = spawn(gamePath, args, {
        cwd: gameDir,
        detached: true,
        stdio: "ignore",
        shell: true,
      });

      // Unref so parent process can exit independently
      if (this.gameProcess) {
        this.gameProcess.unref();

        this.gameProcess.on("error", (error) => {
          logger.error("Game process error:", error);
        });

        this.gameProcess.on("exit", (code) => {
          logger.info(`Game process exited with code: ${code}`);
          this.gameProcess = null;
        });
      }

      return {
        success: true,
        message: "Game launched successfully",
      };
    } catch (error: any) {
      logger.error("Failed to launch game:", error);

      return {
        success: false,
        message: `Failed to launch game: ${error.message}`,
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
