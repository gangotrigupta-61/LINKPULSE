/**
 * Lightweight User-Agent parser for LinkPulse analytics.
 * Avoids heavy external dependencies while accurately detecting
 * device types and common browsers.
 */

export interface ParsedUserAgent {
  deviceType: "mobile" | "tablet" | "desktop" | "bot";
  browser: "Chrome" | "Safari" | "Firefox" | "Edge" | "Opera" | "Other";
}

export function parseUserAgent(uaString: string | null | undefined): ParsedUserAgent {
  if (!uaString) {
    return { deviceType: "desktop", browser: "Other" };
  }

  const ua = uaString.toLowerCase();

  // 1. Device detection
  let deviceType: "mobile" | "tablet" | "desktop" | "bot" = "desktop";

  if (/bot|crawler|spider|crawling|headlesschrome|wget|curl/i.test(ua)) {
    deviceType = "bot";
  } else if (/ipad|tablet|(android(?!.*mobile))/i.test(ua)) {
    deviceType = "tablet";
  } else if (/iphone|ipod|mobile|android.*mobile|blackberry|iemobile|opera mini/i.test(ua)) {
    deviceType = "mobile";
  }

  // 2. Browser detection (order matters due to user agent token overlap)
  let browser: "Chrome" | "Safari" | "Firefox" | "Edge" | "Opera" | "Other" = "Other";

  if (/edg\//i.test(ua)) {
    browser = "Edge";
  } else if (/opr\/|opera/i.test(ua)) {
    browser = "Opera";
  } else if (/firefox|fxios/i.test(ua)) {
    browser = "Firefox";
  } else if (/chrome|crios/i.test(ua)) {
    browser = "Chrome";
  } else if (/safari/i.test(ua) && !/chrome|crios/i.test(ua)) {
    browser = "Safari";
  }

  return { deviceType, browser };
}
