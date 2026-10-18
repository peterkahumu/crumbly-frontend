import { z } from "zod";

export const createOrderSchema = z.object({
  bakeryId: z.string().min(1),
  customerName: z.string().trim().min(2, "Enter your name"),
  customerPhone: z.string().trim().min(7, "Enter a valid phone number"),
  items: z
    .array(
      z.object({
        cakeId: z.string().min(1),
        name: z.string().min(1),
        price: z.coerce.number().int().nonnegative(),
        qty: z.coerce.number().int().positive(),
      })
    )
    .min(1, "Your cart is empty"),
});
