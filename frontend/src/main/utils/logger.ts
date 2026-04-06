import winston from "winston";
import path from "path";
import { app } from "electron";
import os from "os";

let loggerInstance: winston.Logger | null = null;

export function initializeLogger(): winston.Logger {
  if (loggerInstance) {
    return loggerInstance;
  }

  // Use temp dir if app is not ready yet (during development)
  const logDir = app?.isReady()
    ? app.getPath("logs")
    : path.join(os.tmpdir(), "aoe-launcher-logs");

  loggerInstance = winston.createLogger({
    level: process.env.NODE_ENV === "development" ? "debug" : "info",
    format: winston.format.combine(
      winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
      winston.format.errors({ stack: true }),
      winston.format.splat(),
      winston.format.json()
    ),
    transports: [
      // Write all logs to combined.log
      new winston.transports.File({
        filename: path.join(logDir, "combined.log"),
        maxsize: 5242880, // 5MB
        maxFiles: 5,
      }),
      // Write all error logs to error.log
      new winston.transports.File({
        filename: path.join(logDir, "error.log"),
        level: "error",
        maxsize: 5242880,
        maxFiles: 5,
      }),
    ],
  });

  // If we're in development, also log to the console
  if (process.env.NODE_ENV === "development") {
    loggerInstance.add(
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.simple()
        ),
      })
    );
  }

  return loggerInstance;
}

export function getLogger(): winston.Logger {
  if (!loggerInstance) {
    return initializeLogger();
  }
  return loggerInstance;
}
