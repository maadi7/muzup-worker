import {
  DiscountData,
  OrderModifierGroups,
  OrderModifiers,
  PromoDiscountType,
} from "@choose-pos/choose-shared";

export const calculateModifierPrice = (modifier: OrderModifiers): number => {
  return modifier.modifierPrice * modifier.qty;
};
export const calculateTotalModifiersPrice = (
  modifierGroups: OrderModifierGroups[]
): number => {
  return modifierGroups.reduce((total, group) => {
    return (
      total +
      group.selectedModifiers.reduce((groupTotal, modifier) => {
        return groupTotal + calculateModifierPrice(modifier);
      }, 0)
    );
  }, 0);
};

export const formatLoyaltyDiscountDetails = (
  selectedOrder: DiscountData
): string | null => {
  // Check if applied discount exists and is a loyalty discount

  const loyaltyData = selectedOrder?.loyaltyData;
  const promoData = selectedOrder?.promoData;
  // If no loyalty data, return empty string
  if (!loyaltyData && !promoData) {
    return null;
  }
  if (loyaltyData) {
    // Base string with points used
    let result = `You used ${loyaltyData.loyaltyPointsRedeemed || 0} points`;

    // Add item details if available
    if (loyaltyData.redeemItem) {
      result += ` for Item: ${
        loyaltyData.redeemItem.itemName
      } (Value: $${loyaltyData.redeemItem.itemPrice.toFixed(2)})`;
    }

    // Add discount details if available
    const redeemDiscount = loyaltyData.redeemDiscount;
    if (
      redeemDiscount &&
      (redeemDiscount.discountType === "FixedAmount" ||
        redeemDiscount.discountType === "Percentage")
    ) {
      result += ` for Discount: $${redeemDiscount.discountValue.toFixed(
        2
      )} off`;
    }

    return result;
  } else {
    // Base string with points used
    let result = `You used code ${promoData?.code || 0}`;

    // Add item details if available
    if (promoData?.discountItemName) {
      result += ` for Item: ${promoData.discountItemName}`;
    }

    // Add discount details if available
    const redeemDiscount = promoData?.discountType;
    if (redeemDiscount && redeemDiscount === PromoDiscountType.Free) {
      result += ` for $${promoData.discountValue} off`;
    }
    if (redeemDiscount && redeemDiscount === PromoDiscountType.FreeDelivery) {
      result += ` for free delivery`;
    }
    if (redeemDiscount && redeemDiscount === PromoDiscountType.FixedAmount) {
      result += ` for $${promoData.discountValue}`;
    }
    if (redeemDiscount && redeemDiscount === PromoDiscountType.Percentage) {
      result += `for $${promoData.discountValue}`;
    }
    return result;
  }
};

export const extractItemName = (selectedOrder: DiscountData): string | null => {
  const loyaltyData = selectedOrder?.loyaltyData;
  const promoData = selectedOrder?.promoData;
  // If no loyalty data, return empty null
  if (!loyaltyData && !promoData) {
    return null;
  }
  if (loyaltyData) {
    // Base string
    let result = "";

    // Add item details if available
    if (loyaltyData.redeemItem) {
      result += `${loyaltyData.redeemItem.itemName}`;
    }

    if (result.length > 0) return result;
  } else {
    // Base string with points used
    let result = "";

    // Add item details if available
    if (promoData?.discountItemName) {
      result += `${promoData.discountItemName}`;
    }
    if (result.length > 0) return result;
  }

  return null;
};
