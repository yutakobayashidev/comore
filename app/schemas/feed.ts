import { z } from "zod";

export const feedSchema = z.object({
  url: z.string().min(1, "URL is required").url("Please enter a valid URL"),
  title: z
    .string()
    .optional()
    .transform((val) => val || undefined),
  description: z
    .string()
    .optional()
    .transform((val) => val || undefined),
});

export const updateFeedSchema = z.object({
  title: z.string().min(1, "Title is required"),
  url: z.string().min(1, "URL is required").url("Please enter a valid URL"),
  isActive: z
    .string()
    .optional()
    .transform((val) => val === "on"),
});

export type FeedFormData = z.infer<typeof feedSchema>;
export type UpdateFeedFormData = z.infer<typeof updateFeedSchema>;
