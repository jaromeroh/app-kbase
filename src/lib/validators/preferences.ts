import { z } from "zod";

export const userPreferencesSchema = z.object({
  display_name: z.string().max(100).nullable().optional(),
  default_view: z.enum(["list", "grid"]).optional(),
  default_sort: z.enum(["created_at", "updated_at", "title", "rating"]).optional(),
  default_sort_order: z.enum(["asc", "desc"]).optional(),
  items_per_page: z.union([z.literal(10), z.literal(20), z.literal(50)]).optional(),
});

export type UserPreferencesFormData = z.infer<typeof userPreferencesSchema>;
