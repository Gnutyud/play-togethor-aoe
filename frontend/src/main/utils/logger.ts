/**
 * Simple file logger - uses ONLY Node.js built-in modules.
 * No external dependencies = no "module not found" errors ever.
 */

import fs from "fs";
import path from "path";
import os from "os";
import { app } from "electron";

type LogLevel = "debug" | "info" | "warn" | "error";

class SimpleLogger {
  private logDir: string;
  private logFile: string;
  private errorFile: string;
  private isDev: boolean;

  constructor() {
    this.isDev = process.env.NODE_ENV === "development";

    // Use temp dir until app is ready (early startup)
    this.logDir = path.join(os.tmpdir(), "aoe-launcher-logs");
    this.logFile = path.join(this.logDir, "combined.log");
    this.errorFile = path.join(this.logDir, "error.log");

    // Update paths once app is ready
    try {
      if (app?.isReady()) {
        this.logDir = app.getPath("logs");
        this.logFile = path.join(this.logDir, "combined.log");
        this.errorFile = path.join(this.logDir, "error.log");
      }
    } catch {
      // app not ready yet, use tmp dir
    }

    // Ensure log directory exists
    try {
      fs.mkdirSync(this.logDir, { recursive: true });
    } catch {
      // ignore
    }
  }

  private format(level: LogLevel, message: string, ...args: unknown[]): string {
    const timestamp = new Date().toISOString().replace("T", " ").substring(0, 19);
    const extra = args.length > 0
      ? " " + args.map((a) =>
          a instanceof Error
            ? a.stack || a.message
            : typeof a === "object"
            ? JSON.stringify(a)
            : String(a)
        ).join(" ")
      : "";
    return `[${timestamp}] [${level.toUpperCase().padEnd(5)}] ${message}${extra}`;
  }

  private write(level: LogLevel, line: string): void {
    // Always write to combined log
    try {
      fs.appendFileSync(this.logFile, line + "\n", "utf8");
    } catch { /* ignore write errors */ }

    // Also write errors to error log
    if (level === "error") {
      try {
        fs.appendFileSync(this.errorFile, line + "\n", "utf8");
      } catch { /* ignore */ }
    }

    // In dev, also print to console
    if (this.isDev) {
      const colors: Record<LogLevel, string> = {
        debug: "\x1b[36m",
        info: "\x1b[32m",
        warn: "\x1b[33m",
        error: "\x1b[31m",
      };
      console.log(colors[level] + line + "\x1b[0m");
    }
  }

  debug(message: string, ...args: unknown[]): void {
    if (this.isDev) {
      this.write("debug", this.format("debug", message, ...args));
    }
  }

  info(message: string, ...args: unknown[]): void {
    this.write("info", this.format("info", message, ...args));
  }

  warn(message: string, ...args: unknown[]): void {
    this.write("warn", this.format("warn", message, ...args));
  }

  error(message: string, ...args: unknown[]): void {
    this.write("error", this.format("error", message, ...args));
  }
}

let loggerInstance: SimpleLogger | null = null;

export function initializeLogger(): SimpleLogger {
  if (!loggerInstance) {
    loggerInstance = new SimpleLogger();
  }
  return loggerInstance;
}

export function getLogger(): SimpleLogger {
  if (!loggerInstance) {
    loggerInstance = new SimpleLogger();
  }
  return loggerInstance;
}
