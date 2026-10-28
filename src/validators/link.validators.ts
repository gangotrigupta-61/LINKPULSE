import { z } from "zod";
import { isReservedWord } from "@/lib/reserved-words";

export const createLinkSchema = z.object({
  url: z
    .string()
    .trim()
    .min(1, "Destination URL is required")
    .refine(
      (val) => {
        try {
          const parsed = new URL(val);
          return parsed.protocol === "http:" || parsed.protocol === "https:";
        } catch {
          return false;
        }
      },
      {
        message: "URL must be a valid address starting with http:// or https://",
      }
    ),
  alias: z
    .string()
    .trim()
    .min(3, "Custom alias must be at least 3 characters")
    .max(50, "Custom alias cannot exceed 50 characters")
    .regex(
      /^[a-zA-Z0-9_-]+$/,
      "Custom alias can only contain letters, numbers, hyphens (-), and underscores (_)"
    )
    .refine(
      (val) => !isReservedWord(val),
      {
        message: "This alias is a reserved route and cannot be used",
      }
    )
    .optional()
    .or(z.literal("")),
  title: z
    .string()
    .trim()
    .max(100, "Title cannot exceed 100 characters")
    .optional()
    .or(z.literal("")),
  expiresAt: z
    .string()
    .trim()
    .refine(
      (val) => {
        if (!val) return true;
        const parsed = new Date(val);
        return !isNaN(parsed.getTime()) && parsed.getTime() > Date.now();
      },
      {
        message: "Expiry date must be a valid date in the future",
      }
    )
    .optional()
    .or(z.literal("")),
});

export type CreateLinkInput = z.infer<typeof createLinkSchema>;
