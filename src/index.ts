import dotenv from "dotenv";
import cron from "node-cron";
import { logger } from "./utils/logger";
import { MongoDB } from "./utils/mongodb-connection";
import { RedisClient } from "./utils/redis-connection";
import { activityLogWorker } from "./workers/activity-log/activity-log.worker";
import { handleDailyCron } from "./workers/crons/cron.worker";

// Init DotEnv
dotenv.config();

// Init Redis Client
RedisClient.getInstance();

// Init DB Connection
MongoDB.getInstance().connect();

activityLogWorker.on("failed", (job, err) => {
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
    timezone: "America/New_York",
  }
);
