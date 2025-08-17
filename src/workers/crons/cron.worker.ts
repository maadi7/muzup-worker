import { logger } from "../../utils/logger";
import {
  birthdayPointsProcess,
  cartsCampaignAndUtmProcess,
  itemlimitTrackerProcess,
  processPendingPayoutTransactions,
} from "./daily.process";

// This function will be executed every day at 12:00 AM
export const handleDailyCron = async () => {
  // - Check and reset item stock limits
  try {
    await itemlimitTrackerProcess();
  } catch (error: any) {
    logger.error({
      message: error?.message,
      stack: error?.stack,
      worker: "handleDailyCron",
      type: "items-limit-check",
    });
  }

  // - Check for restaurant customer birthdays and send emails
  try {
    await birthdayPointsProcess();
  } catch (error: any) {
    logger.error({
      message: error?.message,
      stack: error?.stack,
      worker: "handleDailyCron",
      type: "birthday-check",
    });
  }

  // - Check for restaurant refunds / payouts from choose and settle them with stripe.
  try {
    await processPendingPayoutTransactions();
  } catch (error: any) {
    logger.error({
      message: error?.message,
      stack: error?.stack,
      worker: "handleDailyCron",
      type: "payout-transaction-process",
    });
  }

  // - Check for any carts with campaign and utm details and clears them after 7 days
  try {
    await cartsCampaignAndUtmProcess();
  } catch (error: any) {
    logger.error({
      message: error?.message,
      stack: error?.stack,
      worker: "handleDailyCron",
      type: "cart-campaigns-utm-tracker-process",
    });
  }
};
