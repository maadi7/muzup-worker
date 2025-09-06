// socket.ts
/**
 * @fileoverview
 * Singleton class for managing Socket.IO server instance
 */

import { Server } from "socket.io";
import http from "http";
import { logger } from "./logger";
import { RedisClient } from "./redis-connection";

export class SocketServer {
  private static io: Server | null = null;

  /**
   * Initialize Socket.IO server (only once)
   * @param server - HTTP server instance
   */
  public static init(server: http.Server): Server {
    if (!SocketServer.io) {
      SocketServer.io = new Server(server, {
        cors: {
          origin: "*", // change to your frontend domain later
        },
      });
      const redis = RedisClient.getInstance();
      // Listen for client connections
      SocketServer.io.on("connection", (socket) => {
        logger.info(`⚡️ New client connected: ${socket.id}`);
        socket.on("register", async (userId: string) => {
          await redis.set(`socket:${userId}`, socket.id);
        });

        // Example: join user-specific room
        socket.on("join", (userId: string) => {
          socket.join(`user:${userId}`);
          logger.info(`User ${userId} joined their room`);
        });

        // Disconnect
        socket.on("disconnect", () => {
          logger.info(`❌ Client disconnected: ${socket.id}`);
        });
      });

      logger.info("✅ Socket.IO server initialized");
    }

    return SocketServer.io;
  }

  /**
   * Get existing Socket.IO instance
   */
  public static getIO(): Server {
    if (!SocketServer.io) {
      throw new Error("Socket.IO not initialized. Call init() first.");
    }
    return SocketServer.io;
  }

  /**
   * Emit event to a specific user room
   */
  public static emitToUser(userId: string, event: string, data: any) {
    if (!SocketServer.io) return;
    SocketServer.io.to(`user:${userId}`).emit(event, data);
  }
}
