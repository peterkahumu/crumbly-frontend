import { z } from "zod";

export const portfolioItemSchema = z.object({
  imageUrl: z.string().url("Add an image"),
  caption: z.string().trim().max(200).optional().or(z.literal("")),
  eventType: z.string().trim().max(60).optional().or(z.literal("")),
});
