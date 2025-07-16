import { z } from "zod";

export const teamSchema = z.object({
  name: z.string().min(1, { message: "Team name is required" }),
  slug: z
    .string()
    .min(1, { message: "Team slug is required" })
    .regex(/^[a-z0-9-]+$/, {
      message: "Slug can only contain lowercase letters, numbers, and hyphens",
    }),
});

export type TeamInput = z.input<typeof teamSchema>;
export type Team = z.infer<typeof teamSchema>;
