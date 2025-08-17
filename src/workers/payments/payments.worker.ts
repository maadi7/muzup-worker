import { Job, Worker } from "bullmq";
import Stripe from "stripe";
import { QueueNames } from "../../utils/queue-names";
import { RedisClient } from "../../utils/redis-connection";
import { processStripeEvent } from "./payments.process";

export type PaymentsQueueData = {
  event: Stripe.Event;
};

const redisClient = RedisClient.getInstance();

export const paymentsWorker = new Worker<PaymentsQueueData>(
  QueueNames.paymentsQueue,
  async (job: Job<PaymentsQueueData>) => {
    const { event } = job.data;
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "");

    await processStripeEvent(event, stripe);
  },
  { connection: redisClient }
);
