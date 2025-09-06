import { Worker, Job } from "bullmq";
import { RedisClient } from "../../utils/redis-connection";
import { QueueNames } from "../../utils/queue-names";
import { ConversationModel } from "../../models/conversations/conversations.schema";
import {
  MessageModel,
  MessageStatusEnum,
} from "../../models/message/message.schema";
import { SocketServer } from "../../utils/socket";

const redis = RedisClient.getInstance();

interface MessageQueueData {
  messageId: string;
  senderId: string;
  receiverId: string;
}

export const messageWorker = new Worker<MessageQueueData>(
  QueueNames.chatQueue,
  async (job: Job<MessageQueueData>) => {
    const { messageId, senderId, receiverId } = job.data;

    // 1. Find or create conversation
    let conversation = await ConversationModel.findOne({
      participants: { $all: [senderId, receiverId] },
    });

    if (!conversation) {
      conversation = await ConversationModel.create({
        participants: [senderId, receiverId],
        lastMessage: null,
        unreadCount: new Map<string, number>(),
      });
    }

    conversation.lastMessage = messageId;

    const unread = conversation.unreadCount.get(receiverId) ?? 0;
    conversation.unreadCount.set(receiverId, unread + 1);
    await conversation.save();

    // 3. Emit via socket
    const receiverSocketId = await redis.get(`socket:${receiverId}`);
    if (receiverSocketId) {
      SocketServer.getIO()
        .to(receiverSocketId)
        .emit("chatMessage", {
          conversationId: conversation._id,
          message: await MessageModel.findById(messageId),
        });

      // update delivered status
      await MessageModel.findByIdAndUpdate(messageId, {
        $push: {
          status: { user: receiverId, state: MessageStatusEnum.DELIVERED },
        },
      });
    }
  },
  { connection: redis }
);
