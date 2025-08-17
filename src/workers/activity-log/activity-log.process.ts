import {
  ActivityActionType,
  ActivityLogModel,
  PerformedByUser,
  RefundType,
} from "@choose-pos/choose-shared";
import { CustomerModel, UserModel } from "../../models";
import { ca } from "date-fns/locale";

export const gatherPerformedByDetails = async (
  userId: string
): Promise<PerformedByUser> => {
  const userData = await UserModel.findById(userId)
    .select("firstName lastName ")
    .lean();

  return {
    userId: userId.toString(),
    name: `${userData?.firstName} ${userData?.lastName}`,
  };
};

export const createBaseLog = async (
  restaurantId: string,
  actionType: ActivityActionType,
  userId: string
) => {
  if (!userId) {
    throw new Error("userId is required for activity logging");
  }

  const performedByUserInfo = await gatherPerformedByDetails(userId.toString());

  return {
    restaurant: restaurantId,
    performedByUserInfo,
    actionPerformed: actionType,
  };
};

export const gatherCustomerDetails = async (customerId: string) => {
  const customerData = await CustomerModel.findById(customerId)
    .select("firstName lastName _id")
    .lean();

  return {
    customerId: customerData?._id.toString(),
    customerName: `${customerData?.firstName} ${customerData?.lastName}`,
  };
};

export const logRefundOrderLoyaltyPoints = async (
  restaurantId: string,
  loyaltyRefundData: {
    orderId: string;
    orderDisplayId: string;
    points: number;
    description?: string;
    customerId: string;
    orderAmount?: number;
  },
  userId: string
) => {
  const baseLog = await createBaseLog(
    restaurantId,
    ActivityActionType.REFUND_ORDER_LOYALTY_POINTS,
    userId.toString()
  );

  // Gather customer details
  const customerDetails = await gatherCustomerDetails(
    loyaltyRefundData.customerId
  );

  // Create a descriptive message for the log
  const description = `${baseLog.performedByUserInfo.name}has refunded ${loyaltyRefundData.points} loyalty points for order #${loyaltyRefundData.orderDisplayId} to customer ${customerDetails.customerName}`;

  // Create meta object to store additional data
  const meta = {
    refundOrderLoyaltyPointsInfo: {
      customer: customerDetails,
      orderId: loyaltyRefundData.orderId,
      orderDisplayId: loyaltyRefundData.orderDisplayId,
      points: loyaltyRefundData.points,
      orderAmount: loyaltyRefundData.orderAmount,
      description: loyaltyRefundData.description,
    },
  };

  const activityLog = new ActivityLogModel({
    ...baseLog,
    desc: description,
    meta: meta,
  });

  return activityLog.save();
};

export const logRefundOrderAmount = async (
  restaurantId: string,
  refundData: {
    orderId: string;
    orderDisplayId: string;
    refundAmount: number;
    refundType: RefundType;
    description?: string;
    customer?: string;
    stripeRefundId: string;
    paymentIntentId: string;
  },
  userId: string
) => {
  const baseLog = await createBaseLog(
    restaurantId,
    ActivityActionType.REFUND_ORDER,
    userId.toString()
  );

  const refundTypeText =
    refundData.refundType === RefundType.FullRefund ? "full" : "partial";
  let description = `${
    baseLog.performedByUserInfo.name
  } has processed a ${refundTypeText} refund of $${refundData.refundAmount.toFixed(
    2
  )} for order #${refundData.orderDisplayId}.`;

  // Create meta object to store additional data
  const meta = {
    refundOrderInfo: {
      orderId: refundData.orderId,
      orderDisplayId: refundData.orderDisplayId,
      refundAmount: refundData.refundAmount,
      refundType: refundData.refundType,
      stripeRefundId: refundData.stripeRefundId,
      paymentIntentId: refundData.paymentIntentId,
      customer: refundData.customer || null,
    },
  };

  const activityLog = new ActivityLogModel({
    ...baseLog,
    desc: description,
    meta: meta,
  });

  return activityLog.save();
};

export const logOnlineOrderingStatusChange = async (
  restaurantId: string,
  data: {
    restaurantName: string;
  },
  userId: string,
  status: boolean
) => {
  const baseLog = await createBaseLog(
    restaurantId,
    ActivityActionType.ONLINE_ORDERING_STATUS,
    userId.toString()
  );

  // Create a descriptive message for the log
  const description = status
    ? `${baseLog.performedByUserInfo.name} activated online ordering`
    : `${baseLog.performedByUserInfo.name} deactivated online ordering`;

  // Create meta object to store additional data
  const meta = {
    onlineOrderingInfo: {
      restaurantName: data.restaurantName,
      activatedAt: new Date(),
    },
  };

  const activityLog = new ActivityLogModel({
    ...baseLog,
    desc: description,
    meta: meta,
  });

  return activityLog.save();
};

export const logCloverStatusChange = async (
  restaurantId: string,
  data: {
    restaurantName: string;
    merchantId: string;
  },
  userId: string,
  status: boolean
) => {
  const baseLog = await createBaseLog(
    restaurantId,
    ActivityActionType.CLOVER_STATUS,
    userId.toString()
  );

  // Create a descriptive message for the log
  const description = status
    ? `${baseLog.performedByUserInfo.name} connected Clover`
    : `${baseLog.performedByUserInfo.name} disconnected Clover`;

  // Create meta object to store additional data
  const meta = {
    cloverConnectionInfo: {
      restaurantName: data.restaurantName,
      merchantId: data.merchantId,
      connectedAt: new Date(),
    },
  };

  const activityLog = new ActivityLogModel({
    ...baseLog,
    desc: description,
    meta: meta,
  });

  return activityLog.save();
};

export const logUserLogin = async (
  restaurantId: string,
  data: {
    restaurantName: string;
  },
  userId: string
) => {
  const baseLog = await createBaseLog(
    restaurantId,
    ActivityActionType.USER_LOGIN,
    userId.toString()
  );

  // Format the current time
  const loginTime = new Date().toLocaleString();

  // Create a descriptive message for the log
  const description = `${baseLog.performedByUserInfo.name} logged in`;

  // Create minimal meta object with just essential info
  const meta = {
    loginInfo: {
      timestamp: new Date(),
    },
  };

  const activityLog = new ActivityLogModel({
    ...baseLog,
    desc: description,
    meta: meta,
  });

  return activityLog.save();
};

export const logUserLogout = async (
  restaurantId: string,
  data: {
    restaurantName: string;
  },
  userId: string
) => {
  const baseLog = await createBaseLog(
    restaurantId,
    ActivityActionType.USER_LOGOUT,
    userId
  );

  // Format the current time
  const logoutTime = new Date().toLocaleString();

  // Create a descriptive message for the log
  const description = `${baseLog.performedByUserInfo.name} logged out`;

  // Create minimal meta object with just essential info
  const meta = {
    logoutInfo: {
      timestamp: new Date(),
    },
  };

  const activityLog = new ActivityLogModel({
    ...baseLog,
    desc: description,
    meta: meta,
  });

  return activityLog.save();
};

export const logMenuStatusChange = async (
  restaurantId: string,
  data: {
    menuId: string;
    menuName: string;
    menuType: string;
  },
  userId: string,
  status: boolean
) => {
  const baseLog = await createBaseLog(
    restaurantId,
    ActivityActionType.MENU_STATUS,
    userId.toString()
  );

  // Create a descriptive message for the log
  const description = status
    ? `${baseLog.performedByUserInfo.name} activated menu "${data.menuName}"`
    : `${baseLog.performedByUserInfo.name} deactivated menu "${data.menuName}"`;

  // Create meta object to store additional data
  const meta = {
    menuActivationInfo: {
      menuId: data.menuId,
      menuName: data.menuName,
      menuType: data.menuType,
      activatedAt: new Date(),
    },
  };

  const activityLog = new ActivityLogModel({
    ...baseLog,
    desc: description,
    meta: meta,
  });

  return activityLog.save();
};

export const logCategoryStatusChange = async (
  restaurantId: string,
  data: {
    categoryId: string;
    categoryName: string;
  },
  userId: string,
  status: boolean
) => {
  const baseLog = await createBaseLog(
    restaurantId,
    ActivityActionType.CATEGORY_STATUS,
    userId.toString()
  );

  // Create a descriptive message for the log
  const description = status
    ? `${baseLog.performedByUserInfo.name} activated category "${data.categoryName}"`
    : `${baseLog.performedByUserInfo.name} deactivated category "${data.categoryName}"`;

  // Create meta object to store additional data
  const meta = {
    categoryActivationInfo: {
      categoryId: data.categoryId,
      categoryName: data.categoryName,

      activatedAt: new Date(),
    },
  };

  const activityLog = new ActivityLogModel({
    ...baseLog,
    desc: description,
    meta: meta,
  });

  return activityLog.save();
};

export const logItemStatusChange = async (
  restaurantId: string,
  data: {
    itemId: string;
    itemName: string;
  },
  userId: string,
  status: boolean
) => {
  const baseLog = await createBaseLog(
    restaurantId,
    ActivityActionType.ITEM_STATUS,
    userId.toString()
  );

  // Create a descriptive message for the log
  const description = status
    ? `${baseLog.performedByUserInfo.name} activated item "${data.itemName}"`
    : `${baseLog.performedByUserInfo.name} deactivated item "${data.itemName}"`;

  // Create meta object to store additional data
  const meta = {
    itemActivationInfo: {
      itemId: data.itemId,
      itemName: data.itemName,
      activatedAt: new Date(),
    },
  };

  const activityLog = new ActivityLogModel({
    ...baseLog,
    desc: description,
    meta: meta,
  });

  return activityLog.save();
};

export const logItemRedemption = async (
  restaurantId: string,
  data: {
    status: string;
    itemName: string;
    pointsThreshold: number;
  },
  userId: string
) => {
  const baseLog = await createBaseLog(
    restaurantId,
    ActivityActionType.ITEM_REDEMPTION,
    userId.toString()
  );

  // Create a descriptive message for the log
  const description = `${baseLog.performedByUserInfo.name} ${data.status} loyalty reward of type Free Item (${data.itemName}) for ${data.pointsThreshold} points`;

  // Create meta object to store additional data
  const meta = {
    itemDeactivationInfo: {
      itemName: data.itemName,
      pointsThreshold: data.pointsThreshold,
      deactivatedAt: new Date(),
    },
  };

  const activityLog = new ActivityLogModel({
    ...baseLog,
    desc: description,
    meta: meta,
  });

  return activityLog.save();
};

export const logPointsRedemption = async (
  restaurantId: string,
  data: {
    status: string;
    type: string;
    pointsThreshold: number;
    uptoAmount?: number;
    value: number;
  },
  userId: string
) => {
  const baseLog = await createBaseLog(
    restaurantId,
    ActivityActionType.POINTS_REDEMPTION,
    userId.toString()
  );

  // Create a descriptive message for the log
  const description = `${baseLog.performedByUserInfo.name} ${
    data.status
  } loyalty reward (${data.type} ${
    data.type !== "Percentage" ? "$" : "Discount "
  }${data.value}${data.type === "Percentage" ? "%" : ""}${
    data.uptoAmount ? ` up to $${data.uptoAmount}` : ""
  }) for ${data.pointsThreshold} points
`;

  // Create meta object to store additional data
  const meta = {
    itemDeactivationInfo: {
      type: data.type,
      pointsThreshold: data.pointsThreshold,
      deactivatedAt: new Date(),
    },
  };

  const activityLog = new ActivityLogModel({
    ...baseLog,
    desc: description,
    meta: meta,
  });

  return activityLog.save();
};

export const logSquareStatusChange = async (
  restaurantId: string,
  data: {
    restaurantName: string;
    merchantId: string;
  },
  userId: string,
  status: boolean
) => {
  const baseLog = await createBaseLog(
    restaurantId,
    ActivityActionType.SQUARE_STATUS,
    userId.toString()
  );

  // Create a descriptive message for the log
  const description = status
    ? `${baseLog.performedByUserInfo.name} connected Square`
    : `${baseLog.performedByUserInfo.name} disconnected Square`;

  // Create meta object to store additional data
  const meta = {
    cloverConnectionInfo: {
      restaurantName: data.restaurantName,
      merchantId: data.merchantId,
      connectedAt: new Date(),
    },
  };

  const activityLog = new ActivityLogModel({
    ...baseLog,
    desc: description,
    meta: meta,
  });

  return activityLog.save();
};
export const logWebsiteBuilderChanges = async (
  restaurantId: string,
  data: {
    section: string;
  },
  userId: string
) => {
  const baseLog = await createBaseLog(
    restaurantId,
    ActivityActionType.WEBSITE_BUILDER_MODIFIED,
    userId.toString()
  );

  let formattedSectionName = "";
  switch (data.section) {
    case "grid":
      formattedSectionName = "USPs";
      break;
    case "menu":
      formattedSectionName = "Best Sellers";
      break;
    case "hero":
      formattedSectionName = "Hero";
      break;
    case "content":
      formattedSectionName = "Reviews";
      break;
    case "contentWithImage":
      formattedSectionName = "Promotional";
      break;
    case "review":
      formattedSectionName = "Banner";
      break;

    default:
      formattedSectionName = "CSM settings";
      break;
  }

  // Create a descriptive message for the log
  const description = `${baseLog.performedByUserInfo.name} modified ${formattedSectionName} section of online ordering website`;

  // Create meta object to store additional data
  const meta = {
    cloverConnectionInfo: {
      sectionName: data.section,
      connectedAt: new Date(),
    },
  };

  const activityLog = new ActivityLogModel({
    ...baseLog,
    desc: description,
    meta: meta,
  });

  return activityLog.save();
};
