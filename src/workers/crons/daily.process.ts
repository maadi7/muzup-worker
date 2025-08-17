import {
  LoyaltyPointsTransaction,
  LoyaltyRuleType,
  PayoutRestaurantStatus,
  StatusEnum,
  StripeAccountStatus,
  TransactionType,
} from "@choose-pos/choose-shared";
import { DateTime } from "luxon";
import mongoose from "mongoose";
import Stripe from "stripe";
import { ResEmailTemplateWithSubjects } from "../../email/email-subjects";
import {
  CartModel,
  CmsModel,
  CustomerLoyaltyWalletModel,
  CustomerModel,
  ItemModel,
  LoyaltyConfigModel,
  LoyaltyPointsTransactionModel,
  PayoutTransactionModel,
  StripeIntegrationModel,
} from "../../models";
import { decryptData, replacePlaceholders } from "../../utils/helper-functions";
import { logger } from "../../utils/logger";

export const itemlimitTrackerProcess = async () => {
  try {
    await ItemModel.updateMany(
      {
        status: StatusEnum.active,
        orderLimit: { $ne: null },
        $expr: { $lt: ["$orderLimitTracker", "$orderLimit"] },
      },
      [{ $set: { orderLimitTracker: "$orderLimit" } }]
    );
  } catch (error: any) {
    const errMessage = error?.message.toString();
    throw new Error(errMessage);
  }
};

export const birthdayPointsProcess = async () => {
  try {
    // Fetch all the customers with dob added
    const start = new Date();
    start.setHours(0, 0, 0, 0);

    const end = new Date();
    end.setHours(23, 59, 59, 999);

    const customers = await CustomerModel.find({
      restaurant: { $exists: true },
      dob: { $exists: true, $ne: null as any, $gte: start, $lte: end },
    }).select("_id firstName restaurant lastName email phone loyaltyWallet");

    for (const customer of customers) {
      if (customer.restaurant && customer.email) {
        const loyaltyConfig = await LoyaltyConfigModel.findOne({
          restaurant: customer.restaurant,
        });

        if (loyaltyConfig) {
          const birthdayRule = loyaltyConfig.loyaltyRules.find(
            (rule: any) =>
              rule.type === LoyaltyRuleType.PointsForBirthday &&
              rule.isLoyaltyTypeActive
          );

          if (birthdayRule) {
            const earnedPoints = Math.round(birthdayRule.rewardPoints);

            // Create transaction record
            const transaction: LoyaltyPointsTransaction = {
              _id: new mongoose.Types.ObjectId().toString(),
              transactionType: TransactionType.EARN,
              points: earnedPoints,
              createdAt: new Date(),
              order: undefined,
              customer: customer._id.toString(),
              restaurant: customer.restaurant,
            };

            const existingWallet = await CustomerLoyaltyWalletModel.findById(
              customer.loyaltyWallet
            );
            const cmsDetails = await CmsModel.findOne({
              restaurant: customer.restaurant,
            })
              .select("domainConfig")
              .lean();

            if (existingWallet && cmsDetails) {
              existingWallet.Transaction.push(transaction);
              existingWallet.balance += earnedPoints;
              existingWallet.lifeTimePointsEarned += earnedPoints;

              await LoyaltyPointsTransactionModel.create(transaction);

              const customerName = `${customer.firstName} ${customer.lastName}`;
              const emailData = ResEmailTemplateWithSubjects.birthday;
              const emailSubject = replacePlaceholders(emailData.subject, [
                customerName,
              ]);
            }
          }
        }
      }
    }
  } catch (error: any) {
    const errMessage = error?.message.toString();
    throw new Error(`Birthday points process failed: ${errMessage}`);
  }
};

export const processPendingPayoutTransactions = async (): Promise<void> => {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "");

  try {
    // Calculate the date 24 hours ago
    const twentyFourHoursAgo = new Date();
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

    // Find all pending transactions that were created at least 24 hours ago
    const pendingTransactions = await PayoutTransactionModel.find({
      status: PayoutRestaurantStatus.pending,
      createdAt: { $lte: twentyFourHoursAgo },
    }).populate("restaurant");

    logger.info({
      message: `Found ${pendingTransactions.length} pending payout transactions to process`,
      worker: "processPendingPayoutTransactions",
    });

    // Process each transaction
    for (const transaction of pendingTransactions) {
      const session = await mongoose.startSession();
      session.startTransaction();

      try {
        const restaurantId = transaction.restaurant.toString();

        // Check if restaurant has Stripe integration
        const stripeAccount = await StripeIntegrationModel.findOne({
          restaurant: restaurantId,
          status: StripeAccountStatus.connected,
        })
          .select("accountId")
          .lean();

        if (!stripeAccount?.accountId) {
          logger.error({
            message: `Stripe account not found or not connected for restaurant ${restaurantId}`,
            transactionId: transaction._id,
            worker: "processPendingPayoutTransactions",
          });
          await session.abortTransaction();
          await session.endSession();
          continue;
        }

        const stripeAccountId = decryptData(stripeAccount.accountId);

        // Convert amount to cents for Stripe
        const amountInCents = Math.round(transaction.amount * 100);

        // Create transfer to the restaurant's Stripe account
        const transfer = await stripe.transfers.create({
          amount: amountInCents,
          currency: "usd",
          destination: stripeAccountId,
          description: transaction.reason,
          metadata: {
            restaurantId,
            transactionId: transaction._id.toString(),
            reason: transaction.reason,
          },
        });

        // Update the transaction with the transfer ID and change status to paid
        await PayoutTransactionModel.updateOne(
          { _id: transaction._id },
          {
            status: PayoutRestaurantStatus.paid,
            transferId: transfer.id,
            updatedAt: new Date(),
          },
          { session }
        );

        await session.commitTransaction();

        logger.info({
          message: `Successfully processed payout transaction ${transaction._id}`,
          transferId: transfer.id,
          worker: "processPendingPayoutTransactions",
        });
      } catch (error: any) {
        await session.abortTransaction();

        logger.error({
          message: error?.message,
          stack: error?.stack,
          transactionId: transaction._id,
          worker: "processPendingPayoutTransactions",
        });
      } finally {
        await session.endSession();
      }
    }
  } catch (error: any) {
    logger.error({
      message: error?.message,
      stack: error?.stack,
      worker: "processPendingPayoutTransactions",
      type: "payout-transaction-process",
    });
    throw new Error(
      `Failed to process pending payout transactions: ${error?.message}`
    );
  }
};

export const cartsCampaignAndUtmProcess = async () => {
  try {
    const cutoff = DateTime.now().minus({ days: 7 }).toJSDate();

    await CartModel.updateMany(
      { "campaignDetails.setAt": { $lte: cutoff } },
      {
        $set: {
          "campaignDetails.campaignId": null,
          "campaignDetails.setAt": null,
        },
      }
    );

    await CartModel.updateMany(
      { "utmDetails.setAt": { $lte: cutoff } },
      {
        $set: {
          "utmDetails.source": null,
          "utmDetails.medium": null,
          "utmDetails.campaign": null,
          "utmDetails.setAt": null,
        },
      }
    );
  } catch (error) {
    throw error;
  }
};
