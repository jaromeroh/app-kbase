import { z } from "zod";

export const listBaseSchema = z.object({
  name: z.string().min(1, "El nombre es requerido").max(100),
  description: z.string().max(500).optional().nullable(),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Color inválido")
    .default("#6366f1"),
  icon: z.string().max(50).default("folder"),
});

export const listSchema = listBaseSchema;
export const listUpdateSchema = listBaseSchema.partial();

export type ListFormData = z.infer<typeof listSchema>;
