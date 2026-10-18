import { z } from "zod";

export const cakeSchema = z.object({
  name: z.string().trim().min(2, "Name is required").max(120),
  categoryId: z.string().min(1, "Choose a category"),
  description: z.string().trim().max(2000).optional().or(z.literal("")),
  price: z.coerce.number().int().positive("Price must be a positive number"),
  discountPrice: z.coerce.number().int().positive().optional().nullable(),
  images: z.array(z.string().url()).min(1, "Add at least one image"),
  sizeOptions: z
    .array(z.object({ label: z.string().min(1), priceModifier: z.coerce.number().int().default(0) }))
    .optional()
    .default([]),
  isAvailable: z.coerce.boolean().optional().default(true),
  isFeatured: z.coerce.boolean().optional().default(false),
});
