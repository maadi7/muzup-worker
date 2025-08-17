import {
  AddressInfo,
  LoyaltyPointsTransaction,
  Order,
  TransactionType,
} from "@choose-pos/choose-shared";
import { LoyaltyPointsTransactionModel, OrderModel } from "../models";
import { formatNumberToMax2 } from "./helper-functions";
import { DateTime } from "luxon";

class RestaurantReceiptInfo {
  name: string;
  email: string;
  phone: string;
  address: AddressInfo;
  brandingLogo: string;
}

class LoyaltyTransactionSummary {
  transactionType: TransactionType;
  points: number;
}

class CustomerReceiptInfo {
  name: string;
  email: string;
  phone: string;
}

export class OrderWithTotals extends Order {
  subTotalAmount: number;
  discountAmount: number;
  declare platformFees: number;
  taxAmount: number;
  finalAmount: number;
  tipAmount: number;
  restaurantInfo: RestaurantReceiptInfo;
  customerInfo: CustomerReceiptInfo;
  loyaltyTransactions: LoyaltyTransactionSummary[];
}

export const fetchOrderById = async (
  orderId: string
): Promise<OrderWithTotals> => {
  try {
    // Fetch Order and Loyalty Transactions in Parallel
    const [order, loyaltyTransactions] = await Promise.all([
      OrderModel.findById(orderId)
        .populate([
          {
            path: "customer",
            select: "firstName lastName email phone addresses",
          },
          {
            path: "restaurant",
            select: "name email phone address brandingLogo",
          },
        ])
        .lean<Order>(),
      LoyaltyPointsTransactionModel.find(
        { order: orderId },
        "transactionType points"
      ).lean<LoyaltyPointsTransaction[]>(),
    ]);

    if (!order) {
      throw new Error("Order not found or not authorized to view");
    }

    // Format Customer Information
    const customer = order.customer as any;
    const customerName = customer
      ? `${customer.firstName ?? ""} ${customer.lastName ?? ""}`.trim()
      : order.guestData
      ? `${order.guestData.firstName} ${order.guestData.lastName}`.trim()
      : "";

    // Format Loyalty Transactions
    const formattedLoyaltyTransactions = loyaltyTransactions.map(
      (transaction) => ({
        transactionType: transaction.transactionType,
        points: transaction.points,
      })
    );

    // Initialize Variables
    const discountAmount = order.appliedDiscount?.discountAmount ?? 0;
    const refundAmount = order.refundAmount ?? 0;
    const platformFeePercent = order.platformFeePercent ?? 0;
    const subTotalAmount = order.subTotal ?? 0;
    // Calculate Gross Amount
    const grossAmount = order.grossAmount ?? 0;
    const calculateOnSubtotal = discountAmount > subTotalAmount;

    // Calculate Platform Fee
    const platformFeeBase = calculateOnSubtotal ? subTotalAmount : grossAmount;
    const platformFee = (platformFeePercent / 100) * platformFeeBase;

    // Calculate Taxes and Other Charges
    const taxBase = calculateOnSubtotal ? subTotalAmount : grossAmount;
    const taxAmount = (taxBase * order.taxPercent) / 100;
    const tipAmount =
      (order.tipPercent ?? 0) > 0
        ? ((order.tipPercent ?? 0) / 100) * subTotalAmount
        : 0;
    const deliveryAmount = order.deliveryAmount ?? 0;

    // Calculate Final Amount
    const finalAmount =
      formatNumberToMax2(grossAmount) +
      formatNumberToMax2(taxAmount) +
      formatNumberToMax2(tipAmount) +
      formatNumberToMax2(platformFee) +
      formatNumberToMax2(deliveryAmount);

    // Return Order with Totals
    return {
      ...order,
      items: order.items,
      customerInfo: {
        name: customerName,
        email: customer?.email || order.guestData?.email,
        phone: customer?.phone || order.guestData?.phone,
      },
      restaurantInfo: {
        name: (order.restaurant as any)?.name,
        email: (order.restaurant as any)?.email,
        phone: (order.restaurant as any)?.phone,
        address: (order.restaurant as any)?.address,
        brandingLogo: (order.restaurant as any)?.brandingLogo,
      },
      subTotalAmount: formatNumberToMax2(subTotalAmount),
      refundAmount: formatNumberToMax2(refundAmount),
      discountAmount: formatNumberToMax2(discountAmount),
      tipAmount: formatNumberToMax2(tipAmount),
      grossAmount: formatNumberToMax2(grossAmount),
      platformFees: formatNumberToMax2(platformFee),
      taxAmount: formatNumberToMax2(taxAmount),
      deliveryAmount: formatNumberToMax2(deliveryAmount),
      finalAmount: formatNumberToMax2(finalAmount),
      loyaltyTransactions: formattedLoyaltyTransactions,
    };
  } catch (error: any) {
    throw error;
  }
};

export const convertToRestoTimezone = (restaurantTz: string, date: Date) => {
  return (
    DateTime.fromJSDate(date, { zone: restaurantTz }).toFormat(
      "dd MMM hh:mm a ZZZZ"
    ) ?? ""
  );
};
