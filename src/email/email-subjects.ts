export type TEmailSendingConfig = {
  template: string;
  subject: string;
  type:
    | "transactional"
    | "restaurant-campaigns"
    | "admin-campaigns"
    | "automated";
};

export class EmailTemplateWithSubjects {
  // For restaurant sign ups
  static readonly registerVerificationCode: TEmailSendingConfig = {
    template: "transactional/registration-code",
    subject: "Your Verification Code for Choose",
    type: "transactional",
  };

  // For restaurant sign in and internal admin sign in
  static readonly loginVerificationCode: TEmailSendingConfig = {
    template: "transactional/login-code",
    subject: "Your Verification Code for Choose",
    type: "transactional",
  };

  // For block / unblock admin user
  static readonly blockUnblockAdmin: TEmailSendingConfig = {
    template: "transactional/block-unblock-admin",
    subject: "Your account has been {var}",
    type: "transactional",
  };

  // For business details submission
  static readonly businessVerificationProgress: TEmailSendingConfig = {
    template: "transactional/business-verification-progress",
    subject: "Your business details are under review",
    type: "transactional",
  };

  // For restaurant onboarding with verification pending
  static readonly restaurantAddedVerificationPending: TEmailSendingConfig = {
    template: "transactional/restaurant-added-verification-pending",
    subject: "Restaurant Details Added Successfully - Verification Pending",
    type: "transactional",
  };

  // For verification of account details
  static readonly restaurantUserVerified: TEmailSendingConfig = {
    template: "transactional/restaurant-user-verified",
    subject: "Congratulations! Your account has been verified",
    type: "transactional",
  };

  // For rejection of account details
  static readonly restaurantUserRejected: TEmailSendingConfig = {
    template: "transactional/restaurant-user-rejected",
    subject: "Your account has been rejected",
    type: "transactional",
  };

  // For restaurant onboarding with verification completed
  static readonly restaurantPaymentPending: TEmailSendingConfig = {
    template: "transactional/restaurant-payment-pending",
    subject: "Complete Your Subscription",
    type: "transactional",
  };

  // For welcoming restaurant after payment is completed
  static readonly restaurantWelcomeWithSteps: TEmailSendingConfig = {
    template: "transactional/welcome-restaurant",
    subject: "Welcome aboard! Your restaurant is added successfully!",
    type: "transactional",
  };

  // For new restaurant team member added
  static readonly newTeamMember: TEmailSendingConfig = {
    template: "transactional/new-team-member",
    subject: "You've been invited to manage Choose",
    type: "transactional",
  };

  // For restaurant team member update
  static readonly teamMemberUpdate: TEmailSendingConfig = {
    template: "transactional/team-member-update",
    subject: "Account details updated on Choose",
    type: "transactional",
  };

  // When restaurant is connected to clover
  static readonly cloverConnected: TEmailSendingConfig = {
    template: "transactional/clover-connect",
    subject: "Clover POS - Successfully Connected",
    type: "transactional",
  };

  // When Customers are added by admin for restaurants
  static readonly csvImportResults: TEmailSendingConfig = {
    template: "transactional/csv-customer-import-results",
    subject: "Customer Import Status - {#var#}",
    type: "transactional",
  };

  // For Restaurant Clover Diconnect
  static readonly cloverDisconnected: TEmailSendingConfig = {
    template: "transactional/clover-disconnect",
    subject: "Alert: Clover POS Disconnected",
    type: "transactional",
  };

  // When menu csv is uploaded successfully
  static readonly menuCsvUploadSuccess: TEmailSendingConfig = {
    template: "transactional/csv-menu-success",
    subject: "CSV Menu Import - Successfully Completed",
    type: "transactional",
  };

  // When menu csv upload is failed in worker
  static readonly menuCsvUploadFailure: TEmailSendingConfig = {
    template: "transactional/csv-menu-failure",
    subject: "Alert: CSV Menu Import - Failed",
    type: "transactional",
  };

  // When clover menu sync is completed successfully
  static readonly menuCloverSyncSuccess: TEmailSendingConfig = {
    template: "transactional/clover-menu-success",
    subject: "Clover Menu Sync - Successfully Completed",
    type: "transactional",
  };

  // When clover menu sync is failed in worker
  static readonly menuCloverSyncFailure: TEmailSendingConfig = {
    template: "transactional/clover-menu-failure",
    subject: "Alert: Clover Menu Sync - Failed",
    type: "transactional",
  };

  // When coupon sales limit is reached
  static readonly couponSalesLimit: TEmailSendingConfig = {
    template: "transactional/sales-limit-reached",
    subject: "Coupon Alert - Sales Limit Reached",
    type: "transactional",
  };

  // For Restaurant CMS Contact Form
  static readonly restaurantCmsContact: TEmailSendingConfig = {
    template: "transactional/cms-contact-form",
    subject: "New enquiry received from website",
    type: "transactional",
  };

  // When restaurant chooses a website theme for the first time
  static readonly cmsDeploymentFirst: TEmailSendingConfig = {
    template: "transactional/cms-deployment-first",
    subject: "🚀 Your Website Deployment Has Begun!",
    type: "transactional",
  };

  // When vercel deployment is successful
  static readonly cmsDeploymentSuccess: TEmailSendingConfig = {
    template: "transactional/cms-deployment-success",
    subject: "Your Website is Ready! 🎉 Here's Your Website Link",
    type: "transactional",
  };

  // When vercel deployment is failed / in worker
  static readonly cmsDeploymentFailed: TEmailSendingConfig = {
    template: "transactional/cms-deployment-failure",
    subject: "Alert: Your Website Deployment - Failed",
    type: "transactional",
  };

  // When website update is created
  static readonly cmsUpdateDeployment: TEmailSendingConfig = {
    template: "transactional/cms-updated-generated",
    subject: "🚀 Your Website Update Has Begun!",
    type: "transactional",
  };

  static readonly OnlineOrderingStatusChange: TEmailSendingConfig = {
    template: "transactional/online-ordering-status",
    subject: "Your online ordering status has been changed.",
    type: "transactional",
  };

  static readonly orderPlaced: TEmailSendingConfig = {
    template: "restaurant/order-placed",
    subject: "Your order from {#var#}",
    type: "transactional",
  };

  static readonly domainRequestCreated: TEmailSendingConfig = {
    template: "transactional/cms-domain-request",
    subject: "New Domain Request Created",
    type: "transactional",
  };

  static readonly domainRequestCancelled: TEmailSendingConfig = {
    template: "transactional/domain-request-cancelled",
    subject: "Your Domain Request Has Been Cancelled",
    type: "transactional",
  };

  static readonly domainRequestCompleted: TEmailSendingConfig = {
    template: "transactional/domain-request-completed",
    subject: "Your Domain Request Has Been Approved",
    type: "transactional",
  };

  static readonly ItemOutOfStock: TEmailSendingConfig = {
    template: "transactional/out-of-stock",
    subject: "Menu Item Out of Stock ⚠️",
    type: "transactional",
  };
}

export class ResEmailTemplateWithSubjects {
  static readonly signIn: TEmailSendingConfig = {
    template: "restaurant/signin",
    subject: "Your Sign-In Verification Code",
    type: "transactional",
  };

  static readonly signUp: TEmailSendingConfig = {
    template: "restaurant/signup",
    subject: "Sign-Up Verification Code",
    type: "transactional",
  };

  static readonly guestOrderOtp: TEmailSendingConfig = {
    template: "restaurant/guest-order-otp",
    subject: "Verification Code to Place Your Order",
    type: "transactional",
  };

  static readonly signupReward: TEmailSendingConfig = {
    template: "restaurant/signup-rewards",
    subject: "🎉 Welcome to Our Family at {#var#}",
    type: "automated",
  };

  static readonly birthday: TEmailSendingConfig = {
    template: "restaurant/birthday",
    subject: "Happy Birthday {#var#}!, we have a gift for you.",
    type: "automated",
  };

  static readonly cartAbandonment: TEmailSendingConfig = {
    template: "restaurant/cart-abandonment",
    subject: "{#var#}, your food is waiting! 🍽️",
    type: "automated",
  };

  static readonly orderPlaced: TEmailSendingConfig = {
    template: "restaurant/order-placed",
    subject: "Your order from {#var#}",
    type: "transactional",
  };

  static readonly orderRefundLoyalty: TEmailSendingConfig = {
    template: "restaurant/order-refund-loyalty",
    subject: "Points credited to your wallet",
    type: "transactional",
  };

  static readonly deliveryTracking: TEmailSendingConfig = {
    template: "restaurant/delivery-tracking",
    subject: "Order is being prepeared, here is your delivery link",
    type: "transactional",
  };

  static readonly orderRefundAmount: TEmailSendingConfig = {
    template: "restaurant/refund-order",
    subject: "Refund for your order is processed",
    type: "transactional",
  };
}
