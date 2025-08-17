import { ActivityActionType } from "@choose-pos/choose-shared";
import { Job, Worker } from "bullmq";
import { QueueNames } from "../../utils/queue-names";
import { RedisClient } from "../../utils/redis-connection";
import {
  logCategoryStatusChange,
  logCloverStatusChange,
  logItemRedemption,
  logItemStatusChange,
  logMenuStatusChange,
  logOnlineOrderingStatusChange,
  logPointsRedemption,
  logRefundOrderAmount,
  logRefundOrderLoyaltyPoints,
  logSquareStatusChange,
  logUserLogin,
  logUserLogout,
  logWebsiteBuilderChanges,
} from "./activity-log.process";

const redisClient = RedisClient.getInstance();

export interface ActivityLogQueueData {
  action: ActivityActionType;
  restaurantId: string;
  userId: string;
  data: any;
}

// Create a worker to process activity log jobs
export const activityLogWorker = new Worker<ActivityLogQueueData>(
  QueueNames.activityLogQueue,
  async (job: Job<ActivityLogQueueData>) => {
    const { action, restaurantId, userId, data: logData } = job.data;
    const status = logData.status;
    switch (action) {
      case ActivityActionType.REFUND_ORDER_LOYALTY_POINTS:
        await logRefundOrderLoyaltyPoints(restaurantId, logData, userId);
        break;
      case ActivityActionType.REFUND_ORDER:
        await logRefundOrderAmount(restaurantId, logData, userId);
        break;
      case ActivityActionType.ONLINE_ORDERING_STATUS:
        await logOnlineOrderingStatusChange(
          restaurantId,
          logData,
          userId,
          status
        );
        break;
      case ActivityActionType.CLOVER_STATUS:
        await logCloverStatusChange(restaurantId, logData, userId, status);
        break;
      case ActivityActionType.USER_LOGIN:
        await logUserLogin(restaurantId, logData, userId);
        break;
      case ActivityActionType.USER_LOGOUT:
        await logUserLogout(restaurantId, logData, userId);
        break;
      case ActivityActionType.MENU_STATUS:
        await logMenuStatusChange(restaurantId, logData, userId, status);
        break;
      case ActivityActionType.CATEGORY_STATUS:
        await logCategoryStatusChange(restaurantId, logData, userId, status);
        break;
      case ActivityActionType.ITEM_STATUS:
        await logItemStatusChange(restaurantId, logData, userId, status);
        break;
      case ActivityActionType.ITEM_REDEMPTION:
        await logItemRedemption(restaurantId, logData, userId);
        break;
      case ActivityActionType.POINTS_REDEMPTION:
        await logPointsRedemption(restaurantId, logData, userId);
        break;
      case ActivityActionType.SQUARE_STATUS:
        await logSquareStatusChange(restaurantId, logData, userId, status);
        break;
      case ActivityActionType.WEBSITE_BUILDER_MODIFIED:
        await logWebsiteBuilderChanges(restaurantId, logData, userId);
        break;
    }
  },
  { connection: redisClient }
);
