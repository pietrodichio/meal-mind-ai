import { z } from "zod";

const DAYS = [
  "monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday",
] as const;
const TYPES = ["lunch", "dinner"] as const;

export const groceryItemSchema = z.object({
  item: z.string().min(1),
  quantity: z.string().optional(),
  note: z.string().optional(),
});

export const importPayloadSchema = z.object({
  mealPlanId: z.string().uuid().optional(),
  meals: z
    .array(
      z.object({
        day: z.enum(DAYS),
        type: z.enum(TYPES),
        name: z.string().min(1),
      })
    )
    .length(14)
    .refine(
      (meals) => new Set(meals.map((m) => `${m.day}:${m.type}`)).size === 14,
      { message: "meals must cover each day+type exactly once (14 unique entries)" }
    ),
  groceryList: z.object({
    categories: z.record(z.string(), z.array(groceryItemSchema)),
  }),
});

export type ImportPayload = z.infer<typeof importPayloadSchema>;
