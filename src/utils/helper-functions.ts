import crypto from "crypto";
import Joi from "joi";

import { DateTime } from "luxon";
import { mongoose } from "@typegoose/typegoose";

export const nameWithSpecialChars = (value: string) => {
  const regex = /^[a-zA-Z0-9-.'!$\/\\]+$/;
  return regex.test(value);
};

export const isAlphanumeric = (value: string) => {
  const regex = /^[a-zA-Z0-9-]+$/;
  return regex.test(value);
};

export const roundOffPrice = (price: number) => {
  const decimalPart = price % 1;

  if (decimalPart === 0) {
    return price;
  } else if (decimalPart < 0.5) {
    return Math.floor(price) + 0.49;
  } else {
    return Math.floor(price) + 0.99;
  }
};

export const formatWebsiteUrlClickable = (url: string) => {
  if (!url.match(/^https?:\/\//i)) {
    return `https://${url}`;
  }
  return url;
};

export const encryptData = (value: string): string => {
  const key = process.env.ENCRYPTION_KEY ?? "";

  // Generate a random IV
  const iv = crypto.randomBytes(16);

  // Create a cipher instance
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);

  // Encrypt the value
  let encrypted = cipher.update(value, "utf8", "hex");
  encrypted += cipher.final("hex");

  // Get the authentication tag
  const authTag = cipher.getAuthTag().toString("hex");

  // Return the IV, auth tag, and encrypted text concatenated
  return `${iv.toString("hex")}$$${authTag}$$${encrypted}`;
};

export const decryptData = (encryptedValue: string): string => {
  const key = process.env.ENCRYPTION_KEY ?? "";

  // Split the encrypted data into its components
  const [ivHex, authTagHex, encryptedText] = encryptedValue.split("$$");

  // Convert components back to buffers
  const iv = Buffer.from(ivHex, "hex");
  const authTag = Buffer.from(authTagHex, "hex");

  // Create a decipher instance
  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);

  // Set the authentication tag
  decipher.setAuthTag(authTag);

  // Decrypt the text
  let decrypted = decipher.update(encryptedText, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
};

/**
 * Formats a number to a maximum of 2 decimal places.
 * If the value is not a valid number, it returns 0.00.
 * @param value - The number to be formatted
 * @returns - The formatted number as a float
 */
export const formatNumberToMax2 = (value: number): number => {
  if (isNaN(value)) {
    return 0;
  }
  return parseFloat(value.toFixed(2));
};

/**
 * Replaces placeholders in a string with elements from the provided array.
 *
 * The function will replace each `{#var#}` placeholder in the string with
 * the corresponding element in the `params` array, in order. For example,
 * the first `{#var#}` will be replaced with the first element in the array,
 * the second `{#var#}` with the second element, and so on. If there are more
 * placeholders than elements in `params`, the remaining placeholders are replaced
 * with an empty string.
 *
 * @param {string} content - The string containing `{#var#}` placeholders.
 * @param {string[]} params - An array of strings to replace each `{#var#}` placeholder.
 * @returns {string} - The formatted string with all placeholders replaced by corresponding array elements or empty strings.
 */
export const replacePlaceholders = (
  content: string,
  params: string[]
): string => {
  let result = "";
  let placeholderIndex = 0;
  let lastPos = 0;
  const placeholder = "{#var#}";
  const placeholderLength = placeholder.length;

  while (true) {
    const currentPos = content.indexOf(placeholder, lastPos);

    // If no more placeholders are found, append the rest of the content
    if (currentPos === -1) {
      result += content.slice(lastPos);
      break;
    }

    // Append portion before placeholder and replace placeholder
    // with the parameter or an empty string if no parameter is left
    const replacement =
      placeholderIndex < params.length ? params[placeholderIndex] : "";
    result += content.slice(lastPos, currentPos) + replacement;
    placeholderIndex++;
    lastPos = currentPos + placeholderLength;
  }

  return result;
};

export const joiSchema = Joi.object({
  name: Joi.string().messages({
    "string.empty": "Name field cannot be empty.",
  }),
  desc: Joi.string().messages({
    "string.empty": "Description field cannot be empty.",
  }),
  content: Joi.string().max(180).messages({
    "string.empty": "Content cannot be empty",
    "string.length": "Content cannot be more than 180 characters",
  }),
  firstName: Joi.string().messages({
    "string.empty": "You have not entered your first name.",
  }),
  lastName: Joi.string().messages({
    "string.empty": "You have not entered your last name.",
  }),
  email: Joi.string().email().messages({
    "string.empty": "You have not entered your email id.",
    "string.email": "You have entered an invalid email id.",
  }),
  phone: Joi.string()
    .length(10)
    .pattern(/^[0-9]+$/)
    .messages({
      "string.empty": "You have not entered your phone number.",
      "string.length": "You have entered an invalid phone number.",
      "string.pattern.base": "You have entered an invalid phone number.",
    }),
  password: Joi.string().messages({
    "string.empty": "You have not entered your password.",
  }),
  otp: Joi.string()
    .length(6)
    .pattern(/^[0-9]+$/)
    .messages({
      "string.empty": "Please provide verification code.",
      "string.length": "Please enter a valid verification code",
      "string.pattern.base": "Please enter a valid verification code",
    }),
  salesTax: Joi.number().positive().precision(2).messages({
    "number.base": "Sales tax must be a number.",
    "number.positive": "Sales tax must be a positive number.",
    "number.precision":
      "Sales tax must be a valid number with up to two decimal places.",
  }),
  isSpicy: Joi.boolean().messages({
    "boolean.base": '"isSpicy" should be a boolean value',
    "any.required": '"isSpicy" is a required field',
  }),
  isVegan: Joi.boolean().messages({
    "boolean.base": '"isVegan" should be a boolean value',
    "any.required": '"isVegan" is a required field',
  }),
  isHalal: Joi.boolean().messages({
    "boolean.base": '"isHalal" should be a boolean value',
    "any.required": '"isHalal" is a required field',
  }),
  isGlutenFree: Joi.boolean().messages({
    "boolean.base": '"isGlutenFree" should be a boolean value',
    "any.required": '"isGlutenFree" is a required field',
  }),
  hasNuts: Joi.boolean().messages({
    "boolean.base": '"hasNuts" should be a boolean value',
    "any.required": '"hasNuts" is a required field',
  }),
});

export function getRestoTimezoneTime(
  restaurantTz: string,
  utcDate: Date | string
): DateTime {
  const tz = restaurantTz?.split(" ")[0] ?? "";

  return DateTime.fromJSDate(new Date(utcDate), { zone: "utc" }) // handles both Date or ISO string
    .setZone(tz);
}
