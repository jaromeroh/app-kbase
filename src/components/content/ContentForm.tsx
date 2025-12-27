"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button, Card, Input, Label, Textarea, TagInput, RelatedLinksInput } from "@/components/ui";
import { Video, FileText, BookOpen, Loader2, Star, Tag, FolderOpen, Link as LinkIcon } from "lucide-react";
import { ListSelector } from "@/components/lists/ListSelector";
import { BookSearch } from "@/components/content/BookSearch";
import type { BookSearchResult } from "@/app/api/books/route";
import { contentSchema, ContentFormData } from "@/lib/validators/content";
import { cn, detectContentType, extractYouTubeVideoId } from "@/lib/utils";
import { Content } from "@/types";

const typeOptions = [
  { value: "video", label: "Video", icon: Video },
  { value: "article", label: "Artículo", icon: FileText },
  { value: "book", label: "Libro", icon: BookOpen },
] as const;

const statusOptions = [
  { value: "pending", label: "Pendiente" },
  { value: "completed", label: "Completado" },
] as const;

interface ContentFormProps {
  content?: Content;
  mode?: "create" | "edit";
  initialType?: "video" | "article" | "book";
}

export function ContentForm({ content, mode = "create", initialType }: ContentFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFetchingMetadata, setIsFetchingMetadata] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [selectedBook, setSelectedBook] = useState<{
    title: string;
    cover_image_url: string | null;
  } | null>(null);

  // Cargar tags disponibles al montar
  useEffect(() => {
    fetch("/api/tags")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setAvailableTags(data.map((t: { name: string }) => t.name));
        }
      })
      .catch((err) => console.error("Error loading tags:", err));
  }, []);

  // Inicializar selectedBook si estamos editando un libro
  useEffect(() => {
    if (content?.type === "book" && content.title) {
      setSelectedBook({
        title: content.title,
        cover_image_url: content.book_metadata?.cover_image_url || null,
      });
    }
  }, [content]);

  // Handler para cuando se selecciona un libro desde BookSearch
  const handleBookSelect = (book: BookSearchResult) => {
    setSelectedBook({
      title: book.title,
      cover_image_url: book.cover_image_url,
    });

    // Auto-fill form fields
    form.setValue("title", book.title);
    if (book.description) {
      form.setValue("description", book.description);
    }
    if (book.author) {
      form.setValue("metadata.author", book.author);
    }
    if (book.publisher) {
      form.setValue("metadata.publisher", book.publisher);
    }
    if (book.isbn) {
      form.setValue("metadata.isbn", book.isbn);
    }
    if (book.page_count) {
      form.setValue("metadata.page_count", book.page_count);
    }
    if (book.cover_image_url) {
      form.setValue("metadata.cover_image_url", book.cover_image_url);
    }
    if (book.published_year) {
      form.setValue("metadata.published_year", book.published_year);
    }
  };

  // Handler para limpiar la selección de libro
  const handleBookClear = () => {
    setSelectedBook(null);
    form.setValue("title", "");
    form.setValue("description", "");
    form.setValue("metadata.author", "");
    form.setValue("metadata.publisher", "");
    form.setValue("metadata.isbn", "");
    form.setValue("metadata.page_count", undefined);
    form.setValue("metadata.cover_image_url", "");
    form.setValue("metadata.published_year", undefined);
  };

  const getDefaultValues = (): ContentFormData => {
    if (content && mode === "edit") {
      return {
        type: content.type,
        status: content.status,
        title: content.title,
        url: content.url || "",
        description: content.description || "",
        summary: content.summary || "",
        related_links: content.related_links || [],
        rating: content.rating || undefined,
        personal_notes: content.personal_notes || "",
        tags: content.content_tags?.map((ct) => ct.tags?.name).filter(Boolean) as string[] || [],
        listIds: content.content_lists?.map((cl) => cl.list_id).filter(Boolean) as string[] || [],
        metadata: {
          // Video metadata
          channel_name: content.video_metadata?.channel_name || "",
          channel_url: content.video_metadata?.channel_url || "",
          duration_minutes: content.video_metadata?.duration_seconds
            ? Math.round(content.video_metadata.duration_seconds / 60)
            : undefined,
          thumbnail_url: content.video_metadata?.thumbnail_url || "",
          video_id: content.video_metadata?.video_id || "",
          // Article metadata
          author: content.article_metadata?.author || content.book_metadata?.author || "",
          site_name: content.article_metadata?.site_name || "",
          reading_time_minutes: content.article_metadata?.reading_time_minutes || undefined,
          // Book metadata
          publisher: content.book_metadata?.publisher || "",
          isbn: content.book_metadata?.isbn || "",
          page_count: content.book_metadata?.page_count || undefined,
          cover_image_url: content.book_metadata?.cover_image_url || "",
        },
      };
    }
    return {
      type: initialType || "video",
      status: "pending",
      title: "",
      url: "",
      description: "",
      summary: "",
      related_links: [],
      rating: undefined,
      personal_notes: "",
      tags: [],
      listIds: [],
    };
  };

  const form = useForm<ContentFormData>({
    resolver: zodResolver(contentSchema),
    defaultValues: getDefaultValues(),
  });

  const selectedType = form.watch("type");
  const selectedStatus = form.watch("status");
  const selectedRating = form.watch("rating");

  const handleUrlBlur = async () => {
    const url = form.getValues("url");
    if (!url) return;

    const detectedType = detectContentType(url);
    if (detectedType) {
      form.setValue("type", detectedType);
    }

    // Auto-fetch metadata for YouTube videos
    if (detectedType === "video") {
      const videoId = extractYouTubeVideoId(url);
      if (videoId) {
        setIsFetchingMetadata(true);
        try {
          const response = await fetch(`/api/youtube?url=${encodeURIComponent(url)}`);
          if (response.ok) {
            const metadata = await response.json();

            // Auto-fill fields with fetched metadata
            if (metadata.title && !form.getValues("title")) {
              form.setValue("title", metadata.title);
            }
            if (metadata.description && !form.getValues("description")) {
              form.setValue("description", metadata.description);
            }
            if (metadata.channel_name) {
              form.setValue("metadata.channel_name", metadata.channel_name);
            }
            if (metadata.channel_url) {
              form.setValue("metadata.channel_url", metadata.channel_url);
            }
            if (metadata.thumbnail_url) {
              form.setValue("metadata.thumbnail_url", metadata.thumbnail_url);
            }
            if (metadata.video_id) {
              form.setValue("metadata.video_id", metadata.video_id);
            }
          }
        } catch (err) {
          console.error("Error fetching YouTube metadata:", err);
        } finally {
          setIsFetchingMetadata(false);
        }
      }
    }

  };

  const onSubmit = async (data: ContentFormData) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const url = mode === "edit" && content
        ? `/api/content/${content.id}`
        : "/api/content";

      const method = mode === "edit" ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error al guardar el contenido");
      }

      const savedContent = await response.json();
      router.push(`/content/${savedContent.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      {error && (
        <Card className="p-4 bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </Card>
      )}

      {/* URL */}
      <div className="space-y-2">
        <Label htmlFor="url">
          URL {selectedType === "video" ? "*" : "(opcional)"}
        </Label>
        <div className="relative">
          <Input
            id="url"
            type="url"
            placeholder="https://youtube.com/watch?v=..."
            {...form.register("url")}
            onBlur={handleUrlBlur}
            disabled={isFetchingMetadata}
          />
          {isFetchingMetadata && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
            </div>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          {selectedType === "video"
            ? "Pega la URL del video y completaremos los datos automáticamente"
            : "Pega la URL y detectaremos automáticamente el tipo de contenido"}
        </p>
        {form.formState.errors.url && (
          <p className="text-xs text-red-500">
            {form.formState.errors.url.message}
          </p>
        )}
      </div>

      {/* Tipo de contenido */}
      <div className="space-y-2">
        <Label>Tipo de contenido</Label>
        <div className="flex gap-2">
          {typeOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                form.setValue("type", option.value);
                // Limpiar selección de libro si cambiamos de tipo
                if (option.value !== "book") {
                  setSelectedBook(null);
                }
              }}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 p-3 rounded-lg border-2 transition-all",
                selectedType === option.value
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50"
              )}
            >
              <option.icon className="w-5 h-5" />
              <span className="font-medium">{option.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Búsqueda de libro (solo para tipo libro) */}
      {selectedType === "book" && (
        <div className="space-y-2">
          <Label>Buscar libro</Label>
          <BookSearch
            onSelect={handleBookSelect}
            onClear={handleBookClear}
            selectedBook={selectedBook}
            disabled={isSubmitting}
          />
          <p className="text-xs text-muted-foreground">
            Busca el libro por título o autor para autocompletar los datos.
          </p>
        </div>
      )}

      {/* Título */}
      <div className="space-y-2">
        <Label htmlFor="title">Título *</Label>
        <Input
          id="title"
          placeholder="Título del contenido"
          {...form.register("title")}
        />
        {form.formState.errors.title && (
          <p className="text-xs text-red-500">
            {form.formState.errors.title.message}
          </p>
        )}
      </div>

      {/* Descripción */}
      <div className="space-y-2">
        <Label htmlFor="description">Descripción</Label>
        <Textarea
          id="description"
          placeholder="Breve descripción del contenido..."
          rows={3}
          {...form.register("description")}
        />
      </div>

      {/* Resumen */}
      <div className="space-y-2">
        <Label htmlFor="summary">Resumen</Label>
        <Textarea
          id="summary"
          placeholder="Pega aquí el resumen generado por IA (Gemini, ChatGPT, etc.)..."
          rows={5}
          {...form.register("summary")}
        />
        <p className="text-xs text-muted-foreground">
          Resumen del contenido. Puedes usar herramientas de IA como Gemini en YouTube para generarlo.
        </p>
      </div>

      {/* Links relacionados */}
      <div className="space-y-2">
        <Label className="flex items-center gap-2">
          <LinkIcon className="w-4 h-4" />
          Links relacionados
        </Label>
        <RelatedLinksInput
          value={form.watch("related_links") || []}
          onChange={(links) => form.setValue("related_links", links)}
          disabled={isSubmitting}
        />
        <p className="text-xs text-muted-foreground">
          Añade links a recursos complementarios, referencias o material relacionado.
        </p>
      </div>

      {/* Estado */}
      <div className="space-y-2">
        <Label>Estado</Label>
        <div className="flex gap-2">
          {statusOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => form.setValue("status", option.value)}
              className={cn(
                "flex-1 p-3 rounded-lg border-2 transition-all font-medium",
                selectedStatus === option.value
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50"
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Rating (solo si completado) */}
      {selectedStatus === "completed" && (
        <div className="space-y-2">
          <Label>Calificación</Label>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((rating) => (
              <button
                key={rating}
                type="button"
                onClick={() =>
                  form.setValue(
                    "rating",
                    selectedRating === rating ? undefined : rating
                  )
                }
                className="p-1 hover:scale-110 transition-transform"
              >
                <Star
                  className={cn(
                    "w-8 h-8 transition-colors",
                    selectedRating && rating <= selectedRating
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-muted-foreground"
                  )}
                />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Mis comentarios */}
      <div className="space-y-2">
        <Label htmlFor="personal_notes">Mis comentarios</Label>
        <Textarea
          id="personal_notes"
          placeholder="Tu opinión, reflexiones, ideas que te generó el contenido..."
          rows={4}
          {...form.register("personal_notes")}
        />
        <p className="text-xs text-muted-foreground">
          Tu punto de vista personal sobre el contenido.
        </p>
      </div>

      {/* Tags */}
      <div className="space-y-2">
        <Label className="flex items-center gap-2">
          <Tag className="w-4 h-4" />
          Tags
        </Label>
        <TagInput
          value={form.watch("tags") || []}
          onChange={(tags) => form.setValue("tags", tags)}
          suggestions={availableTags}
          placeholder="Agregar tags..."
          maxTags={10}
        />
        <p className="text-xs text-muted-foreground">
          Escribe y presiona Enter para agregar. Máximo 10 tags.
        </p>
      </div>

      {/* Listas */}
      <div className="space-y-2">
        <Label className="flex items-center gap-2">
          <FolderOpen className="w-4 h-4" />
          Listas
        </Label>
        <ListSelector
          value={form.watch("listIds") || []}
          onChange={(listIds) => form.setValue("listIds", listIds)}
          disabled={isSubmitting}
        />
        <p className="text-xs text-muted-foreground">
          Selecciona las listas donde quieres guardar este contenido.
        </p>
      </div>

      {/* Metadatos específicos por tipo */}
      {selectedType === "video" && (
        <Card className="p-4 space-y-4">
          <h3 className="font-medium flex items-center gap-2">
            <Video className="w-4 h-4" />
            Datos del video
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="channel_name">Canal</Label>
              <Input
                id="channel_name"
                placeholder="Nombre del canal"
                {...form.register("metadata.channel_name")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="duration">Duración (minutos)</Label>
              <Input
                id="duration"
                type="number"
                placeholder="60"
                {...form.register("metadata.duration_minutes", {
                  valueAsNumber: true,
                })}
              />
            </div>
          </div>
        </Card>
      )}

      {selectedType === "article" && (
        <Card className="p-4 space-y-4">
          <h3 className="font-medium flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Datos del artículo
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="author">Autor</Label>
              <Input
                id="author"
                placeholder="Nombre del autor"
                {...form.register("metadata.author")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="site_name">Sitio</Label>
              <Input
                id="site_name"
                placeholder="Nombre del sitio"
                {...form.register("metadata.site_name")}
              />
            </div>
          </div>
        </Card>
      )}

      {selectedType === "book" && (
        <Card className="p-4 space-y-4">
          <h3 className="font-medium flex items-center gap-2">
            <BookOpen className="w-4 h-4" />
            Datos del libro
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="book_author">Autor</Label>
              <Input
                id="book_author"
                placeholder="Nombre del autor"
                {...form.register("metadata.author")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="publisher">Editorial</Label>
              <Input
                id="publisher"
                placeholder="Nombre de la editorial"
                {...form.register("metadata.publisher")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="isbn">ISBN</Label>
              <Input
                id="isbn"
                placeholder="978-..."
                {...form.register("metadata.isbn")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="page_count">Páginas</Label>
              <Input
                id="page_count"
                type="number"
                placeholder="300"
                {...form.register("metadata.page_count", {
                  valueAsNumber: true,
                })}
              />
            </div>
          </div>
        </Card>
      )}

      {/* Botones */}
      <div className="flex justify-end gap-3 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isSubmitting}
        >
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          {mode === "edit" ? "Guardar cambios" : "Guardar"}
        </Button>
      </div>
    </form>
  );
}
