import { TEmailSendingConfig } from "./email-subjects";

type TEmailOrderDets = {
  itemName: string;
  qty: number;
  itemPrice: number;
  itemRemarks: string | undefined;
  modifierGroups: {
    mgName: string;
    selectedModifiers: {
      modifierName: string;
      qty: number;
      modifierPrice: string;
    }[];
  }[];
};

export type TSendEmailParams = {
  to: string;
  emailSendingConfig: TEmailSendingConfig;
  [key: string]:
    | string
    | number
    | boolean
    | TEmailSendingConfig
    | TEmailOrderDets[]
    | null;
};

export type TSendCustomerEmailParams = {
  to: string;
  restaurantId: string;
  emailSendingConfig: TEmailSendingConfig;
  [key: string]:
    | string
    | number
    | boolean
    | TEmailSendingConfig
    | TEmailOrderDets[]
    | null
    | any[];
};
