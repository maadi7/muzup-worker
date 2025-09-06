import dotenv from "dotenv";
import cron from "node-cron";
import { logger } from "./utils/logger";
import { MongoDB } from "./utils/mongodb-connection";
import { RedisClient } from "./utils/redis-connection";
import { handleDailyCron } from "./workers/crons/cron.worker";
import { notificationWorker } from "./workers/notifications/notifications.worker";

// Init DotEnv
dotenv.config();

// Init Redis Client
RedisClient.getInstance();

// Init DB Connection
MongoDB.getInstance().connect();

notificationWorker.on("failed", (job, err) => {
  logger.error({
    message: err.message,
    stack: err.stack,
    jobId: job?.id,
    worker: "activityLogWorker",
  });
});

cron.schedule(
  "0 0 * * *",
  () => {
    handleDailyCron();
  },
  {
    name: "every-day",
    recoverMissedExecutions: true,
  }
);
