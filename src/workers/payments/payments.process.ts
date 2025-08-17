import {
  InvoiceStatus,
  RestaurantStatus,
  StripeAccountStatus,
  Subscription,
  SubscriptionStatus,
} from "@choose-pos/choose-shared";
import { mongoose } from "@typegoose/typegoose";
import moment from "moment";
import { FilterQuery } from "mongoose";
import Stripe from "stripe";
import { EmailTemplateWithSubjects } from "../../email/email-subjects";
import { emailQueue } from "../../email/queue/email.queue";
import {
  RestaurantModel,
  StripeEventLogModel,
  StripeIntegrationModel,
  SubscriptionInvoiceModel,
  SubscriptionModel,
  UserModel,
} from "../../models/index";
import { logger } from "../../utils/logger";

const handleSubscriptionEvent = async (
  event: Stripe.Event,
  stripe: Stripe,
  dbSession: mongoose.mongo.ClientSession,
  type: "created" | "updated" | "deleted"
) => {
  const eventObject = event.data.object;
  const subscription = eventObject as Stripe.Subscription;

  // fetch the metadata from stripe
  const cs = await stripe.checkout.sessions.list({
    subscription: subscription.id.toString(),
  });

  if (cs.data.length !== 1) {
    throw new Error("Unable to retrieve metadata from stripe");
  }

  const metadata = cs.data[0].metadata;

  if (!metadata) {
    throw new Error("Unable to retrieve metadata from stripe");
  }

  // Fetch subscription from stripe
  const stripeSubscription = await stripe.subscriptions.retrieve(
    subscription.id
  );

  // update the db with new status
  const { userId, restaurantId } = metadata;

  // Save subscription in db
  if (type === "created" || type === "updated") {
    let filterQuery: FilterQuery<Subscription> = {};

    const existigSubscription = await SubscriptionModel.findOne({
      restaurant: restaurantId,
    })
      .select("_id")
      .lean()
      .session(dbSession);

    if (existigSubscription) {
      filterQuery.restaurant = restaurantId;
    } else {
      filterQuery.subscriptionId = stripeSubscription.id;
    }

    await SubscriptionModel.updateOne(
      filterQuery,
      {
        $set: {
          user: userId,
          restaurant: restaurantId,
          planId: stripeSubscription.items.data[0].plan.id,
          subscriptionId: stripeSubscription.id,
          nextInvoiceDate: stripeSubscription.cancel_at_period_end
            ? null
            : new Date(stripeSubscription.current_period_end * 1000),
          status:
            stripeSubscription.status === "active"
              ? SubscriptionStatus.active
              : SubscriptionStatus.inactive,
        },
      },
      { upsert: true, setDefaultsOnInsert: true, session: dbSession }
    );
  } else if (type === "deleted") {
    await SubscriptionModel.updateOne(
      { subscriptionId: stripeSubscription.id },
      {
        $set: {
          status: SubscriptionStatus.inactive,
          nextInvoiceDate: null,
        },
      },
      { session: dbSession }
    );

    // Update restaurant status in restaurant collection
    await RestaurantModel.updateOne(
      {
        _id: restaurantId,
        status: RestaurantStatus.active,
      },
      {
        $set: {
          status: RestaurantStatus.paymentPending,
        },
      },
      { session: dbSession }
    );

    // Update restaurant status in user collection
    await UserModel.updateOne(
      {
        restaurants: {
          $elemMatch: {
            _id: restaurantId,
            status: RestaurantStatus.active,
          },
        },
      },
      {
        $set: {
          "restaurants.$.status": RestaurantStatus.paymentPending,
        },
      },
      { session: dbSession }
    );
  }
};

const handleInvoiceEvent = async (
  event: Stripe.Event,
  stripe: Stripe,
  dbSession: mongoose.mongo.ClientSession
) => {
  const eventObject = event.data.object;
  const invoice = eventObject as Stripe.Invoice;
  const { subscription } = invoice;

  // fetch the metadata from stripe
  const cs = await stripe.checkout.sessions.list({
    subscription: subscription?.toString(),
  });

  if (cs.data.length !== 1) {
    throw new Error("Unable to retrieve metadata from stripe");
  }

  const metadata = cs.data[0].metadata;

  if (!metadata) {
    throw new Error("Unable to retrieve metadata from stripe");
  }

  // Fetch invoice from stripe
  const stripeInvoice = await stripe.invoices.retrieve(invoice.id);

  // update the db with new status
  const { userId, restaurantId } = metadata;

  // Update restaurant status in restaurant collection
  await RestaurantModel.updateOne(
    {
      _id: restaurantId,
      $or: [
        { status: RestaurantStatus.active },
        { status: RestaurantStatus.paymentPending },
      ],
    },
    {
      $set: {
        status:
          stripeInvoice.status === "paid"
            ? RestaurantStatus.active
            : RestaurantStatus.paymentPending,
      },
    },
    { session: dbSession }
  );

  // Update restaurant status in user collection
  await UserModel.updateOne(
    {
      restaurants: {
        $elemMatch: {
          _id: restaurantId,
          $or: [
            { status: RestaurantStatus.active },
            { status: RestaurantStatus.paymentPending },
          ],
        },
      },
    },
    {
      $set: {
        "restaurants.$.status":
          stripeInvoice.status === "paid"
            ? RestaurantStatus.active
            : RestaurantStatus.paymentPending,
      },
    },
    { session: dbSession }
  );

  const user = await UserModel.findOne({ _id: userId.toString() })
    .select("email firstName lastName")
    .lean();
  const restaurantName = await RestaurantModel.findOne({
    _id: restaurantId.toString(),
  })
    .select("name")
    .lean();
  const templateDetails = EmailTemplateWithSubjects.restaurantWelcomeWithSteps;
  await emailQueue.add("WELCOME_WITH_STEPS", {
    emailSendingConfig: templateDetails,
    to: user?.email ?? "",
    member_name: `${user?.firstName} ${user?.lastName}`,
    restaurantName: restaurantName?.name ?? "",
    dashboardLink: `${process.env.RESTAURANT_ADMIN_URL}/dashboard`,
    knowledgeCenterLink: `${process.env.RESTAURANT_ADMIN_URL}/knowledge-base`,
  });

  // Save invoice in db
  await SubscriptionInvoiceModel.updateOne(
    { invoiceId: stripeInvoice.id },
    {
      $set: {
        user: userId,
        restaurant: restaurantId,
        subscriptionId: stripeInvoice?.subscription?.toString(),
        invoiceId: stripeInvoice.id,
        invoicePeriod: `${moment(
          new Date(stripeInvoice.lines.data[0].period.start * 1000)
        ).format("YYYY-MM-DD")} to ${moment(
          new Date(stripeInvoice.lines.data[0].period.end * 1000)
        ).format("YYYY-MM-DD")}`,
        invoicePdf: stripeInvoice.invoice_pdf,
        amount: stripeInvoice.amount_paid / 100,
        status:
          stripeInvoice.status === "paid"
            ? InvoiceStatus.paid
            : InvoiceStatus.unpaid,
      },
    },
    { upsert: true, setDefaultsOnInsert: true, session: dbSession }
  );
};

const handleRefundEvent = async (
  event: Stripe.Event,
  stripe: Stripe,
  dbSession: mongoose.mongo.ClientSession
) => {
  const eventObject = event.data.object;
  const charge = eventObject as Stripe.Charge;
  const { metadata, status, refunded } = charge;

  logger.info({ ...metadata, status, refunded, type: "stripe-refund" });
};

const handleAccountUpdate = async (
  event: Stripe.Event,
  stripe: Stripe,
  dbSession: mongoose.mongo.ClientSession
) => {
  const eventObject = event.data.object;
  const account = eventObject as Stripe.Account;
  const {
    charges_enabled,
    payouts_enabled,
    details_submitted,
    requirements,
    metadata,
  } = account;

  if (!metadata) {
    throw new Error("Unable to retrieve metadata from stripe");
  }

  const { user, restaurant } = metadata;

  if (!user || !restaurant) {
    throw new Error(
      "Unable to retrieve metadata from stripe for account update webhook"
    );
  }

  if (details_submitted && (!charges_enabled || !payouts_enabled)) {
    await StripeIntegrationModel.updateOne(
      { user: user, restaurant: restaurant },
      { $set: { status: StripeAccountStatus.blocked } },
      { session: dbSession }
    );
  } else if (
    charges_enabled &&
    payouts_enabled &&
    details_submitted &&
    (requirements?.currently_due ?? []).length === 0
  ) {
    await StripeIntegrationModel.updateOne(
      { user: user, restaurant: restaurant },
      { $set: { status: StripeAccountStatus.connected } },
      { session: dbSession }
    );
  }
};

export const processStripeEvent = async (
  event: Stripe.Event,
  stripe: Stripe
) => {
  const dbSession = await mongoose.startSession();
  dbSession.startTransaction();

  try {
    const { id: eventId, type: eventType, data: eventData } = event;
    const { object: eventDataObject } = eventData;

    // Idempotency check
    const existingEvent = await StripeEventLogModel.findOne({
      eventId,
    })
      .session(dbSession)
      .lean();
    if (existingEvent) return; // Event already processed

    switch (eventType) {
      case "customer.subscription.created":
        await handleSubscriptionEvent(event, stripe, dbSession, "created");
        break;
      case "customer.subscription.updated":
        await handleSubscriptionEvent(event, stripe, dbSession, "updated");
        break;
      case "customer.subscription.deleted":
        await handleSubscriptionEvent(event, stripe, dbSession, "deleted");
        break;
      case "invoice.paid":
        await handleInvoiceEvent(event, stripe, dbSession);
        break;
      case "invoice.payment_failed":
        await handleInvoiceEvent(event, stripe, dbSession);
        break;
      case "account.updated":
        await handleAccountUpdate(event, stripe, dbSession);
        break;
      case "charge.refunded":
        await handleRefundEvent(event, stripe, dbSession);
        break;
      default:
        throw new Error(`Unhandled event type: ${event.type}`);
    }

    // Log event for idempotency
    await StripeEventLogModel.create([{ eventId }], { session: dbSession });
    await dbSession.commitTransaction();
  } catch (error: any) {
    await dbSession.abortTransaction();
    console.error("Payment Webhook processing failed:", error?.message);
    throw error; // Let the job retry mechanism handle it
  } finally {
    await dbSession.endSession();
  }
};
