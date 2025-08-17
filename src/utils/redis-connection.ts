/**
 * @fileoverview
 * This file contains a signleton class for implementation of redis connection
 */

import { Cluster, Redis } from "ioredis";
import { logger } from "./logger";

export class RedisClient {
  private static instance: Cluster | Redis | null = null;

  // Singleton pattern to ensure only one instance of the Redis connection exists
  public static getInstance(): Cluster | Redis {
    if (!RedisClient.instance) {
      RedisClient.instance =
        process.env.REDIS_TLS === "true"
          ? new Redis.Cluster(
              [
                {
                  host: process.env.REDIS_HOST,
                  port: parseInt(process.env.REDIS_PORT ?? "6379") ?? 6379,
                },
              ],
              {
                dnsLookup: (address, callback) => callback(null, address),
                slotsRefreshTimeout: 2000,
                redisOptions: {
                  maxRetriesPerRequest: null,
                  tls: {},
                },
              }
            )
          : new Redis({
              host: process.env.REDIS_HOST,
              port: parseInt(process.env.REDIS_PORT ?? "6379") ?? 6379,
              maxRetriesPerRequest: null,
            });

      RedisClient.instance.on("connect", () => {
        logger.info("Redis Connected!");
      });

      RedisClient.instance.on("error", (err) => {
        logger.error({
          message: err.message,
          stack: err.stack,
          database: "redis",
        });
      });
    }
    return RedisClient.instance;
  }
}
