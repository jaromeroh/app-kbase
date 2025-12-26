"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Card, CardContent, Badge, Button } from "@/components/ui";
import { Video, FileText, BookOpen, Clock, CheckCircle, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ContentListCardProps {
  content: {
    id: string;
    title: string;
    type: "video" | "article" | "book";
    status: "pending" | "completed";
    video_metadata?: { thumbnail_url?: string };
    book_metadata?: { cover_image_url?: string };
  };
  listId: string;
}

const typeIcons = {
  video: Video,
  article: FileText,
  book: BookOpen,
};

export function ContentListCard({ content, listId }: ContentListCardProps) {
  const router = useRouter();
  const [isRemoving, setIsRemoving] = useState(false);

  const Icon = typeIcons[content.type];
  const thumbnail =
    content.video_metadata?.thumbnail_url ||
    content.book_metadata?.cover_image_url;

  const handleRemove = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!confirm("¿Quitar este contenido de la lista?")) {
      return;
    }

    setIsRemoving(true);
    try {
      const response = await fetch(`/api/lists/${listId}/contents`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contentId: content.id }),
      });

      if (response.ok) {
        router.refresh();
      }
    } catch (error) {
      console.error("Error removing content:", error);
    } finally {
      setIsRemoving(false);
    }
  };

  const handleCardClick = () => {
    router.push(`/content/${content.id}`);
  };

  return (
    <Card
      className={cn(
        "h-full hover:shadow-md transition-shadow cursor-pointer group relative",
        isRemoving && "opacity-50"
      )}
      onClick={handleCardClick}
    >
      <CardContent className="pt-6">
        <div className="flex gap-3">
          {thumbnail ? (
            <div className="relative w-20 h-14 rounded overflow-hidden flex-shrink-0">
              <Image
                src={thumbnail}
                alt={content.title}
                fill
                className="object-cover"
              />
            </div>
          ) : (
            <div className="w-20 h-14 rounded bg-muted flex items-center justify-center flex-shrink-0">
              <Icon className="w-6 h-6 text-muted-foreground" />
            </div>
          )}

          <div className="flex-1 min-w-0">
            <h3 className="font-medium line-clamp-2 text-sm pr-6">
              {content.title}
            </h3>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="secondary" className="text-xs">
                {content.type === "video"
                  ? "Video"
                  : content.type === "article"
                  ? "Artículo"
                  : "Libro"}
              </Badge>
              <Badge
                variant={content.status === "completed" ? "default" : "outline"}
                className="text-xs"
              >
                {content.status === "completed" ? (
                  <CheckCircle className="w-3 h-3 mr-1" />
                ) : (
                  <Clock className="w-3 h-3 mr-1" />
                )}
                {content.status === "completed" ? "Completado" : "Pendiente"}
              </Badge>
            </div>
          </div>
        </div>

        {/* Remove button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleRemove}
          disabled={isRemoving}
          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity h-7 w-7 p-0 text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950"
        >
          <X className="w-4 h-4" />
        </Button>
      </CardContent>
    </Card>
  );
}
