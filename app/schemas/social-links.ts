import { z } from "zod";

export const socialLinksSchema = z.object({
  websiteUrl: z
    .string()
    .optional()
    .transform((val) => val?.trim() || "")
    .refine((val) => !val || val === "" || z.url().safeParse(val).success, {
      message: "Please enter a valid URL",
    }),
  twitterUsername: z
    .string()
    .optional()
    .transform((val) => val?.trim() || "")
    .refine((val) => !val || /^[a-zA-Z0-9_]*$/.test(val), {
      message: "Username can only contain letters, numbers, and underscores",
    }),
  blueskyAddress: z
    .string()
    .optional()
    .transform((val) => val?.trim() || "")
    .refine((val) => !val || /^(@[a-zA-Z0-9.-]+)?$/.test(val), {
      message:
        // cspell:ignore bsky
        "Please enter a valid Bluesky address (e.g., @username.bsky.social)",
    }),
  activityPubAddress: z
    .string()
    .optional()
    .transform((val) => val?.trim() || "")
    .refine((val) => !val || /^(@[a-zA-Z0-9.-]+@[a-zA-Z0-9.-]+)?$/.test(val), {
      message:
        "Please enter a valid ActivityPub address (e.g., @username@mastodon.social)",
    }),
});
