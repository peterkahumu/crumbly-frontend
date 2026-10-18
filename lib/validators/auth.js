import { z } from "zod";

export const registerBakerSchema = z.object({
  name: z.string().trim().min(2, "Your name is required"),
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  phone: z.string().trim().min(7, "Enter a valid phone number").optional().or(z.literal("")),
  bakeryName: z.string().trim().min(2, "Bakery name is required"),
  city: z.string().trim().min(2, "City is required"),
  whatsappNumber: z.string().trim().min(7, "A WhatsApp number is required so customers can reach you"),
  description: z.string().trim().max(1000).optional().or(z.literal("")),
});
