import { z } from "zod";

export const bakerySettingsSchema = z.object({
  name: z.string().trim().min(2, "Name is required").max(120),
  description: z.string().trim().max(2000).optional().or(z.literal("")),
  city: z.string().trim().min(2, "City is required"),
  address: z.string().trim().max(200).optional().or(z.literal("")),
  whatsappNumber: z.string().trim().min(7, "A WhatsApp number is required"),
  mpesaTillNumber: z.string().trim().max(30).optional().or(z.literal("")),
  logoUrl: z.string().url().optional().or(z.literal("")),
  coverImageUrl: z.string().url().optional().or(z.literal("")),
});
