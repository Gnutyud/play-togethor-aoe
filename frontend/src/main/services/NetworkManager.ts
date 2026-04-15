import { spawn, ChildProcess } from "child_process";
import path from "path";
import { getLogger } from "../utils/logger";
import { app } from "electron";
import crypto from "crypto";

const logger = getLogger();

export interface NetworkStatus {
  connected: boolean;
  virtualIp: string | null;
  community: string | null;
  error?: string;
}

export class NetworkManager {
  private static instance: NetworkManager;
  private edgeProcess: ChildProcess | null = null;
  private status: NetworkStatus = {
    connected: false,
    virtualIp: null,
    community: null,
  };

  private constructor() {}

  public static getInstance(): NetworkManager {
    if (!NetworkManager.instance) {
      NetworkManager.instance = new NetworkManager();
    }
    return NetworkManager.instance;
  }

  /**
   * Generates a deterministic virtual IP for a user (10.26.x.y)
   * This prevents IP conflicts in the same room.
   */
  private generateVirtualIp(userId: string): string {
    const hash = crypto.createHash("md5").update(userId).digest();
    // Use the last two bytes for x and y (skipping 0 and 255 for safety)
    const x = (hash[14] % 253) + 1;
    const y = (hash[15] % 253) + 1;
    return `10.26.${x}.${y}`;
  }

  /**
   * Start the N2N P2P connection
   */
  public async connect(
    userId: string,
    roomId: string,
    roomPassword?: string
  ): Promise<NetworkStatus> {
    if (this.edgeProcess) {
      await this.disconnect();
    }

    const virtualIp = this.generateVirtualIp(userId);
    const community = `aoe_room_${roomId.substring(0, 8)}`;
    const secret = roomPassword || "aoe_default_secret";

    // Path to edge.exe in resources
    const edgePath = app.isPackaged
      ? path.join(process.resourcesPath, "bin", "n2n", "edge.exe")
      : path.join(app.getAppPath(), "resources", "bin", "n2n", "edge.exe");

    // Pool of public supernodes (HK, SG, etc. for Asia speed)
    const supernodes = [
      "n2n.happyn.cn:7777",
      "supernode.ntop.org:7777",
      "n2ntest.net:7777"
    ];

    const args = [
      "-c", community,                // Community name
      "-k", secret,                   // Encryption key
      "-a", virtualIp,                // Virtual IP
      "-l", supernodes[0],            // Primary supernode
      "-f",                           // Run in foreground (for child_process management)
      "-r",                           // Enable packet forwarding/routing
      "-E",                           // Accept multicast (crucial for AoE broadcast)
    ];

    logger.info(`Starting N2N P2P Network: ${community} with IP ${virtualIp}`);

    try {
      this.edgeProcess = spawn(edgePath, args, {
        shell: false,
        windowsHide: true,
      });

      this.edgeProcess.stdout?.on("data", (data) => {
        const output = data.toString();
        if (output.includes("edge_init_tun_device")) {
          logger.info("N2N Virtual Interface Initialized");
        }
        if (output.includes("Registering with supernode")) {
          logger.info("Connecting to P2P mesh...");
        }
      });

      this.edgeProcess.on("error", (err) => {
        logger.error("N2N Process Error:", err);
        this.status.error = err.message;
      });

      this.status = {
        connected: true,
        virtualIp,
        community,
      };

      return this.status;
    } catch (error: any) {
      logger.error("Failed to start N2N Edge:", error);
      return {
        connected: false,
        virtualIp: null,
        community: null,
        error: error.message,
      };
    }
  }

  /**
   * Stop the N2N connection
   */
  public async disconnect(): Promise<void> {
    if (this.edgeProcess) {
      logger.info("Stopping N2N P2P Network...");
      this.edgeProcess.kill("SIGTERM");
      this.edgeProcess = null;
    }
    this.status = {
      connected: false,
      virtualIp: null,
      community: null,
    };
  }

  public getStatus(): NetworkStatus {
    return this.status;
  }
}
