/**
 * Calculates the relative luminance of a hex color.
 * @param hex - Hex color code (e.g., "#FFFFFF").
 * @returns The relative luminance (a value between 0 and 1).
 */
function getLuminance(hex: string): number {
  const rgb = hex
    .replace("#", "")
    .match(/.{1,2}/g)
    ?.map((val) => parseInt(val, 16)) || [0, 0, 0];
  const [r, g, b] = rgb.map((c) => {
    const sRGB = c / 255;
    return sRGB <= 0.03928
      ? sRGB / 12.92
      : Math.pow((sRGB + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * Calculates the contrast ratio between two colors.
 * @param bgColor - Background hex color (e.g., "#FFFFFF").
 * @param textColor - Text hex color (e.g., "#000000").
 * @returns The contrast ratio (a value >= 1.0).
 */
function getContrastRatio(bgColor: string, textColor: string): number {
  const bgLuminance = getLuminance(bgColor);
  const textLuminance = getLuminance(textColor);
  return (
    (Math.max(bgLuminance, textLuminance) + 0.05) /
    (Math.min(bgLuminance, textLuminance) + 0.05)
  );
}

/**
 * Checks if the contrast ratio between a background and text color is sufficient.
 * @param bgColor - Background hex color (e.g., "#FFFFFF").
 * @param textColor - Text hex color (e.g., "#000000").
 * @param largeText - Whether the text is large (defaults to false).
 * @returns True if contrast is sufficient, otherwise false.
 */
export function isContrastOkay(
  bgColor: string,
  textColor: string,
  largeText: boolean = false
): boolean {
  const contrastRatio = getContrastRatio(bgColor, textColor);
  const minimumContrast = largeText ? 3.0 : 4.5; // WCAG AA standards
  return contrastRatio >= minimumContrast;
}

/**
 * Returns "black" if the background color is light, or "white" if it is dark.
 *
 * @param hex - A hex color string (e.g. "#abc" or "#aabbcc")
 * @returns "black" or "white" as the contrasting text color.
 */
export function getContrastColor(hex: string): "black" | "white" {
  // Remove the hash if it exists.
  const cleanedHex = hex.replace(/^#/, "");

  // Validate length: should be either 3 or 6 characters.
  if (cleanedHex.length !== 3 && cleanedHex.length !== 6) {
    throw new Error("Invalid hex color. Expected format: #abc or #aabbcc");
  }

  let r: number, g: number, b: number;

  if (cleanedHex.length === 3) {
    // Duplicate each character for shorthand notation.
    r = parseInt(cleanedHex.charAt(0) + cleanedHex.charAt(0), 16);
    g = parseInt(cleanedHex.charAt(1) + cleanedHex.charAt(1), 16);
    b = parseInt(cleanedHex.charAt(2) + cleanedHex.charAt(2), 16);
  } else {
    // Standard hex notation.
    r = parseInt(cleanedHex.substring(0, 2), 16);
    g = parseInt(cleanedHex.substring(2, 4), 16);
    b = parseInt(cleanedHex.substring(4, 6), 16);
  }

  // Calculate brightness using ITU-R BT.601 formula.
  // The weights 299, 587, and 114 reflect human perception of the different colors.
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;

  // If the background is light (brightness > 128), return "black" for contrast.
  // Otherwise, for dark backgrounds, return "white".
  return brightness > 128 ? "black" : "white";
}
