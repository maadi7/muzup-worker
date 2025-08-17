import { CmsModel, RestaurantModel } from "../models";
import { isContrastOkay } from "./isContrastOkay";
import { logger } from "./logger";

interface IResBrandingDetails {
  restaurantWebsite: string;
  restaurantName: string;
  restaurantLogo: string;
  restaurantAddress: string;
  buttonBgColor: string;
  buttonTextColor: string;
  facebookLink?: string;
  instagramLink?: string;
}
export const restaurantBrandingDetails = async (
  restaurantId: string
): Promise<IResBrandingDetails | null> => {
  try {
    // get restaurant details
    const restaurant = await RestaurantModel.findById(restaurantId)
      .select("_id name address brandingLogo socialInfo website")
      .lean();

    if (!restaurant) {
      throw new Error(
        "Restaurant details not found for the id " + restaurantId
      );
    }

    // get cms details
    const restaurantCms = await CmsModel.findOne({ restaurant: restaurantId })
      .select("_id themeConfig domainConfig")
      .lean();

    if (!restaurantCms) {
      throw new Error(
        "Restaurant cms details not found for the id " + restaurantId
      );
    }

    // Construct response and return
    let response: IResBrandingDetails = {
      restaurantWebsite: restaurantCms.domainConfig.website,
      restaurantName: restaurant.name,
      restaurantAddress: restaurant.address?.addressLine1 ?? "",
      restaurantLogo: restaurant.brandingLogo,
      buttonBgColor: restaurantCms.themeConfig.primary ?? "",
      buttonTextColor: isContrastOkay(
        restaurantCms.themeConfig.primary,
        restaurantCms.themeConfig.background
      )
        ? restaurantCms.themeConfig.background
        : isContrastOkay(restaurantCms.themeConfig.primary, "#000000")
        ? "#000000"
        : "#ffffff",
    };

    if (restaurant.socialInfo?.facebook) {
      response["facebookLink"] = restaurant.socialInfo?.facebook;
    }

    if (restaurant.socialInfo?.instagram) {
      response["instagramLink"] = restaurant.socialInfo?.instagram;
    }

    return response;
  } catch (err: any) {
    logger.error({
      message: err.message,
      stack: err.stack,
      utilFn: "restaurantBrandingDetails",
    });
    return null;
  }
};
