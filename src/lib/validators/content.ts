import { z } from "zod";

// Helper para transformar strings vacías a null
const emptyStringToNull = z.literal("").transform(() => null);

// Helper para URLs opcionales (acepta string vacío, URL válida, o null)
const optionalUrl = z.preprocess(
  (val) => (val === "" || val === null || val === undefined ? null : val),
  z.string().url().nullable().optional()
).nullable().optional();

// Helper para manejar NaN de campos numéricos vacíos
const nanToNull = z.preprocess(
  (val) => (typeof val === "number" && isNaN(val) ? null : val),
  z.number().int().positive().optional().nullable()
);

// Schema para links relacionados
const relatedLinkSchema = z.object({
  title: z.string().min(1).max(200),
  url: z.string().url(),
});

// Schema base sin refinamientos (para poder usar .partial() en updates)
export const contentBaseSchema = z.object({
  type: z.enum(["video", "article", "book"]),
  status: z.enum(["pending", "completed"]).default("pending"),
  title: z.string().min(1, "El título es requerido").max(500),
  url: z.union([z.string().url("URL inválida"), emptyStringToNull]).optional().nullable(),
  description: z.union([z.string().max(5000), emptyStringToNull]).optional().nullable(),
  summary: z.union([z.string().max(10000), emptyStringToNull]).optional().nullable(),
  related_links: z.array(relatedLinkSchema).max(20).optional().default([]),
  rating: z.number().int().min(1).max(5).optional().nullable(),
  personal_notes: z.union([z.string().max(10000), emptyStringToNull]).optional().nullable(),
  listIds: z.array(z.string().uuid()).optional(),
  tags: z.array(z.string().max(50)).max(10).optional(),
  metadata: z
    .object({
      // Video metadata
      channel_name: z.union([z.string(), emptyStringToNull]).optional().nullable(),
      channel_url: optionalUrl,
      duration_minutes: nanToNull,
      thumbnail_url: optionalUrl,
      video_id: z.union([z.string(), emptyStringToNull]).optional().nullable(),
      // Article metadata
      author: z.union([z.string(), emptyStringToNull]).optional().nullable(),
      site_name: z.union([z.string(), emptyStringToNull]).optional().nullable(),
      site_favicon: optionalUrl,
      reading_time_minutes: nanToNull,
      // Book metadata
      publisher: z.union([z.string(), emptyStringToNull]).optional().nullable(),
      isbn: z.union([z.string(), emptyStringToNull]).optional().nullable(),
      page_count: nanToNull,
      cover_image_url: optionalUrl,
      published_year: z.preprocess(
        (val) => (typeof val === "number" && isNaN(val) ? null : val),
        z.number().int().optional().nullable()
      ),
      published_at: z.union([z.string(), emptyStringToNull]).optional().nullable(),
    })
    .optional(),
});

// Schema completo con refinamiento (para crear contenido)
export const contentSchema = contentBaseSchema.refine(
  (data) => {
    // URL es obligatoria para videos
    if (data.type === "video") {
      return data.url && data.url.trim() !== "";
    }
    return true;
  },
  {
    message: "La URL es obligatoria para videos",
    path: ["url"],
  }
);

// Schema para actualizaciones parciales
export const contentUpdateSchema = contentBaseSchema.partial();

export type ContentFormData = z.infer<typeof contentSchema>;

export const contentFilterSchema = z.object({
  type: z.enum(["video", "article", "book"]).optional(),
  status: z.enum(["pending", "completed"]).optional(),
  listId: z.string().uuid().optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  sortBy: z
    .enum(["created_at", "updated_at", "completed_at", "title", "rating"])
    .default("created_at"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export type ContentFilterParams = z.infer<typeof contentFilterSchema>;
