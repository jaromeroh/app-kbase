"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button, Input, Badge } from "@/components/ui";
import {
  X,
  Search,
  Loader2,
  Check,
  Video,
  FileText,
  BookOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";

interface ContentItem {
  id: string;
  title: string;
  type: "video" | "article" | "book";
  status: "pending" | "completed";
  video_metadata?: { thumbnail_url?: string };
  book_metadata?: { cover_image_url?: string };
}

interface AddContentToListModalProps {
  listId: string;
  listName: string;
  existingContentIds: string[];
  isOpen: boolean;
  onClose: () => void;
}

const typeIcons = {
  video: Video,
  article: FileText,
  book: BookOpen,
};

export function AddContentToListModal({
  listId,
  listName,
  existingContentIds,
  isOpen,
  onClose,
}: AddContentToListModalProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [allContent, setAllContent] = useState<ContentItem[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cargar todo el contenido del usuario
  useEffect(() => {
    if (!isOpen) return;

    const fetchContent = async () => {
      setIsLoading(true);
      try {
        const response = await fetch("/api/content?limit=100");
        if (!response.ok) throw new Error("Error al cargar contenido");
        const result = await response.json();
        setAllContent(result.data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error desconocido");
      } finally {
        setIsLoading(false);
      }
    };

    fetchContent();
    setSelectedIds([]);
    setSearch("");
  }, [isOpen]);

  // Filtrar contenido que no está ya en la lista y por búsqueda
  const availableContent = allContent.filter((item) => {
    const notInList = !existingContentIds.includes(item.id);
    const matchesSearch =
      !search || item.title.toLowerCase().includes(search.toLowerCase());
    return notInList && matchesSearch;
  });

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleSave = async () => {
    if (selectedIds.length === 0) return;

    setIsSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/lists/${listId}/contents`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contentIds: selectedIds }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Error al añadir contenido");
      }

      router.refresh();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-background rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">
            Añadir contenido a &quot;{listName}&quot;
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-muted rounded-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar contenido..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {/* Content list */}
        <div className="flex-1 overflow-y-auto p-4">
          {error && (
            <div className="p-3 mb-4 text-sm text-red-500 bg-red-50 dark:bg-red-950/50 rounded-md">
              {error}
            </div>
          )}

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : availableContent.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              {search
                ? "No se encontró contenido con esa búsqueda"
                : "No hay contenido disponible para añadir"}
            </div>
          ) : (
            <div className="space-y-2">
              {availableContent.map((item) => {
                const Icon = typeIcons[item.type];
                const isSelected = selectedIds.includes(item.id);
                const thumbnail =
                  item.video_metadata?.thumbnail_url ||
                  item.book_metadata?.cover_image_url;

                return (
                  <button
                    key={item.id}
                    onClick={() => toggleSelect(item.id)}
                    className={cn(
                      "w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-all text-left",
                      isSelected
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    )}
                  >
                    {thumbnail ? (
                      <div className="relative w-16 h-10 rounded overflow-hidden flex-shrink-0">
                        <Image
                          src={thumbnail}
                          alt={item.title}
                          fill
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-16 h-10 rounded bg-muted flex items-center justify-center flex-shrink-0">
                        <Icon className="w-5 h-5 text-muted-foreground" />
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate text-sm">
                        {item.title}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary" className="text-xs">
                          {item.type === "video"
                            ? "Video"
                            : item.type === "article"
                            ? "Artículo"
                            : "Libro"}
                        </Badge>
                      </div>
                    </div>

                    <div
                      className={cn(
                        "w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors",
                        isSelected
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-muted-foreground/30"
                      )}
                    >
                      {isSelected && <Check className="w-3 h-3" />}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t">
          <p className="text-sm text-muted-foreground">
            {selectedIds.length} seleccionado{selectedIds.length !== 1 && "s"}
          </p>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} disabled={isSaving}>
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              disabled={selectedIds.length === 0 || isSaving}
              isLoading={isSaving}
            >
              Añadir a la lista
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
