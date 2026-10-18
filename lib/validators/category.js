import { z } from "zod";

export const categorySchema = z.object({
  name: z.string().trim().min(2, "Name is required").max(60),
  icon: z.string().trim().min(1).max(40).optional().default("cake"),
});
