import path from "path";
import { createLogger, format, Logger, transports } from "winston";
// import "winston-daily-rotate-file";

/**
 * Create a logger instance with different transports for different environments.
 *
 * @returns {Logger} Configured Winston logger
 */
const buildLogger = (): Logger => {
  const logDir = path.join(__dirname, "../", "logs");

  const logger = createLogger({
    level: "info", // Log level based on environment
    format: format.combine(
      format.timestamp(),
      format.errors({ stack: true }),
      format.json()
    ),
    transports: [
      new transports.Console(),
      // new transports.DailyRotateFile({
      //   filename: "standard-%DATE%.log",
      //   dirname: logDir,
      //   datePattern: "MM-DD-YYYY",
      //   zippedArchive: true,
      //   maxSize: "20m",
      //   maxFiles: "14d", // Keep logs for 14 days
      // }),
    ],
    defaultMeta: { service: "choose-workers" },
    exitOnError: false,
    exceptionHandlers: [
      new transports.Console(),
      // new transports.DailyRotateFile({
      //   filename: "exceptions-%DATE%.log",
      //   dirname: logDir,
      //   datePattern: "MM-DD-YYYY",
      //   zippedArchive: true,
      //   maxSize: "20m",
      //   maxFiles: "30d", // Keep logs for 30 days
      // }),
    ],
    rejectionHandlers: [
      new transports.Console(),
      // new transports.DailyRotateFile({
      //   filename: "rejections-%DATE%.log",
      //   dirname: logDir,
      //   datePattern: "MM-DD-YYYY",
      //   zippedArchive: true,
      //   maxSize: "20m",
      //   maxFiles: "30d", // Keep logs for 30 days
      // }),
    ],
  });

  return logger;
};

export const logger = buildLogger();
