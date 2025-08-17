import { IntegrationConnectionStatusEnum, IntegrationPlatformEnum } from "@choose-pos/choose-shared";
import { IntegrationModel, RestaurantModel, SquareCredentialModel } from "../models";
import { decryptData, encryptData } from "./helper-functions";
import { DateTime } from 'luxon';
import axios from "axios";

export const getSquareCreds = async (
    restaurantId: string
  ): Promise<[string, string] | null> => {
    try {
      // Resto check
      const restaurant = await RestaurantModel.findOne({ _id: restaurantId })
        .select("integrations")
        .lean();
      if (!restaurant) {
        return null;
      }
  
      // Resto integrations list check
      const squareIntegrationId =
        restaurant.integrations.find(
          (e) =>
            e.platform === IntegrationPlatformEnum.Square &&
            e.connectionStatus === IntegrationConnectionStatusEnum.Connected
        )?.id ?? "";
      if (!squareIntegrationId) {
        return null;
      }
  
      // Integrations check
      const integration = await IntegrationModel.countDocuments({
        _id: squareIntegrationId,
      }).lean();
      if (integration !== 1) {
        return null;
      }
  
      // Square creds check
      const squareCreds = await SquareCredentialModel.findOne({
        restaurantId: restaurantId,
        integration: squareIntegrationId,
      }).select(
        "accessToken refreshToken expires_at merchantId"
      );
      if (!squareCreds) {
        return null;
      }

      // Check token expiration
      const expiresAt = DateTime.fromISO(squareCreds.expires_at as string);
      const now = DateTime.utc();
  
  
      // If access token is still valid, return existing tokens
      if (now < expiresAt) {
        return [
          squareCreds.accessToken, 
          squareCreds.refreshToken
        ];
      }
  
      // Attempt to refresh tokens
      const refreshResponse = await axios.post(
        `${process.env.SQUARE_API_ENDPOINT}/oauth2/token`,
        {
          client_id: process.env.SQUARE_APP_ID,
          client_secret: process.env.SQUARE_APP_SECRET,
          grant_type: 'refresh_token',
          refresh_token: decryptData(squareCreds.refreshToken)
        },
        {
          headers: {
            'Square-Version': '2025-03-19',
            'Content-Type': 'application/json'
          }
        }
      );
  
      // Validate refresh response
      const data = refreshResponse.data;
      if (!data.access_token || !data.refresh_token) {
        return null;
      }
  
      // Encrypt new tokens
      const encryptedAccessToken = encryptData(data.access_token);
      const encryptedRefreshToken = encryptData(data.refresh_token);
  
      // Update credentials in database
      await SquareCredentialModel.updateOne(
        {
          restaurantId: restaurantId,
          integration: squareIntegrationId,
        },
        {
          $set: {
            accessToken: encryptedAccessToken,
            refreshToken: encryptedRefreshToken,
            expires_at: data.expires_at,
          },
        }
      );
  
      return [encryptedAccessToken, encryptedRefreshToken];
    } catch (error) {
      // Log the error for debugging
      console.error('Error refreshing Square credentials:', error);
      throw error;
    }
  };
