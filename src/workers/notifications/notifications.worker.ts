import { Job, Worker } from "bullmq";
import { RedisClient } from "../../utils/redis-connection";
import { QueueNames } from "../../utils/queue-names";
import {
  NotificationEntityType,
  NotificationModel,
  NotificationType,
} from "../../models/notification/notification.schema";
import { SocketServer } from "../../utils/socket";

const redisClient = RedisClient.getInstance();

export interface NotificationQueueData {
  type: NotificationType;
  entityType: NotificationEntityType;
  entityId?: string;
  receiver: string;
  sender: string;
  metadata?: Record<string, any>;
}

// Create a worker to process activity log jobs
export const notificationWorker = new Worker<NotificationQueueData>(
  QueueNames.notificationQueue,
  async (job: Job<NotificationQueueData>) => {
    const { entityType, receiver, sender, type, entityId, metadata } = job.data;

    try {
      const notification = await NotificationModel.create({
        sender: sender,
        receiver: receiver,
        dedupeKey: `${type}:${sender}:${receiver}:${entityId}`,
        entityId: entityId,
        entityType: entityType,
        type: type,
        isRead: false,
        metadata: metadata,
      });

      const receiverSocketId = await redisClient.get(`socket:${receiver}`);
      if (receiverSocketId) {
        SocketServer.getIO().to(receiverSocketId).emit("notification", {
          notification,
        });
      }
    } catch (error) {
      console.log(error);
    }
  },
  { connection: redisClient }
);
