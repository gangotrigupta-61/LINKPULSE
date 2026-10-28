import { customAlphabet } from "nanoid";

// URL-safe character set: 64 characters (A-Z, a-z, 0-9, _, -)
const ALPHABET =
  "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_-";

const generateRawId = customAlphabet(ALPHABET, 7);

/**
 * Generate a 7-character URL-safe short code.
 */
export function generateShortCode(): string {
  return generateRawId();
}
