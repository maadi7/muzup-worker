/**
 * @fileoverview
 * This file contains code to establish a connection to MongoDB database
 */

import { mongoose } from "@typegoose/typegoose";
import { logger } from "./logger";

export class MongoDB {
  private static instance: MongoDB;
  private constructor() {}

  // Singleton pattern to ensure only one instance of the MongoDB connection exists
  public static getInstance(): MongoDB {
    if (!this.instance) {
      this.instance = new MongoDB();
    }
    return this.instance;
  }

  // Method to connect to MongoDB
  public async connect(): Promise<void> {
    try {
      await mongoose.connect(process.env.DB_URI ?? "", {
        maxPoolSize: 10,
      });
    } catch (error: any) {
      logger.error({
        message: error?.message ?? "MongoDB connection failed",
        stack: error?.stack,
        database: "mongodb",
      });
      // process.exit(1); // Exiting the process if connection fails
    }
  }
}
