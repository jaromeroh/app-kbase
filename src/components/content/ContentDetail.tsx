"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  Button,
} from "@/components/ui";
import {
  Video,
  FileText,
  BookOpen,
  Star,
  Clock,
  CheckCircle,
  ExternalLink,
  ArrowLeft,
  Edit,
  Trash2,
  Calendar,
  User,
  Globe,
  Hash,
  Tag,
} from "lucide-react";
import { Content } from "@/types";
import { formatDate, formatDuration, cn } from "@/lib/utils";

interface ContentDetailProps {
  content: Content;
}

const typeIcons = {
  video: Video,
  article: FileText,
  book: BookOpen,
};

const typeColors = {
  video: "text-foreground",
  article: "text-foreground",
  book: "text-foreground",
};

const typeLabels = {
  video: "Video",
  article: "Artículo",
  book: "Libro",
};

export function ContentDetail({ content }: ContentDetailProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const Icon = typeIcons[content.type];

  const handleDelete = async () => {
    if (!confirm("¿Estás seguro de que quieres eliminar este contenido?")) {
      return;
    }

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/content/${content.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        router.push("/content");
        router.refresh();
      }
    } catch (error) {
      console.error("Error deleting content:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const toggleStatus = async () => {
    setIsUpdating(true);
    const newStatus = content.status === "completed" ? "pending" : "completed";

    try {
      const response = await fetch(`/api/content/${content.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        router.refresh();
      }
    } catch (error) {
      console.error("Error updating status:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  const getThumbnail = (): string | null => {
    if (content.video_metadata?.thumbnail_url) {
      return content.video_metadata.thumbnail_url;
    }
    if (content.book_metadata?.cover_image_url) {
      return content.book_metadata.cover_image_url;
    }
    return null;
  };

  const thumbnail = getThumbnail();

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/content">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver
          </Button>
        </Link>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Title Card */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                {thumbnail ? (
                  <div className="relative w-32 h-20 rounded-md overflow-hidden flex-shrink-0">
                    <Image
                      src={thumbnail}
                      alt={content.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-32 h-20 rounded-md bg-muted flex items-center justify-center flex-shrink-0">
                    <Icon className={cn("w-8 h-8", typeColors[content.type])} />
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="secondary">
                      {typeLabels[content.type]}
                    </Badge>
                    <Badge
                      variant={
                        content.status === "completed" ? "default" : "outline"
                      }
                    >
                      {content.status === "completed" ? (
                        <>
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Completado
                        </>
                      ) : (
                        <>
                          <Clock className="w-3 h-3 mr-1" />
                          Pendiente
                        </>
                      )}
                    </Badge>
                  </div>
                  <h1 className="text-2xl font-bold">{content.title}</h1>

                  {/* Tags */}
                  {content.content_tags && content.content_tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {content.content_tags.map(({ tags }) => (
                        <Link
                          href={`/content?tag=${encodeURIComponent(tags?.name || "")}`}
                          key={tags?.name}
                        >
                          <Badge
                            variant="outline"
                            className="cursor-pointer hover:bg-muted flex items-center gap-1"
                          >
                            <Tag className="w-3 h-3" />
                            {tags?.name}
                          </Badge>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 mt-4 pt-4 border-t">
                <Button
                  onClick={toggleStatus}
                  disabled={isUpdating}
                  variant={
                    content.status === "completed" ? "outline" : "default"
                  }
                >
                  {content.status === "completed" ? (
                    <>
                      <Clock className="w-4 h-4 mr-2" />
                      Marcar pendiente
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Marcar completado
                    </>
                  )}
                </Button>

                {content.url && (
                  <a href={content.url} target="_blank" rel="noopener noreferrer">
                    <Button variant="outline">
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Abrir enlace
                    </Button>
                  </a>
                )}

                <div className="flex-1" />

                <Link href={`/content/${content.id}/edit`}>
                  <Button variant="ghost" size="sm">
                    <Edit className="w-4 h-4" />
                  </Button>
                </Link>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Description */}
          {content.description && (
            <Card>
              <CardHeader>
                <CardTitle>Descripción</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground whitespace-pre-wrap">
                  {content.description}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Personal Notes */}
          {content.personal_notes && (
            <Card>
              <CardHeader>
                <CardTitle>Notas Personales</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap">{content.personal_notes}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column - Metadata */}
        <div className="space-y-6">
          {/* Rating */}
          {content.rating && (
            <Card>
              <CardHeader>
                <CardTitle>Calificación</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={cn(
                        "w-6 h-6",
                        star <= content.rating!
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-muted-foreground"
                      )}
                    />
                  ))}
                  <span className="ml-2 text-lg font-semibold">
                    {content.rating}/5
                  </span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Dates */}
          <Card>
            <CardHeader>
              <CardTitle>Fechas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">Agregado:</span>
                <span>{formatDate(content.created_at)}</span>
              </div>
              {content.completed_at && (
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="w-4 h-4" />
                  <span className="text-muted-foreground">Completado:</span>
                  <span>{formatDate(content.completed_at)}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Type-specific metadata */}
          {content.type === "video" && content.video_metadata && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Video className="w-4 h-4" />
                  Datos del Video
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {content.video_metadata.channel_name && (
                  <div className="flex items-center gap-2 text-sm">
                    <User className="w-4 h-4 text-muted-foreground" />
                    <span>{content.video_metadata.channel_name}</span>
                  </div>
                )}
                {content.video_metadata.duration_seconds && (
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span>
                      {formatDuration(content.video_metadata.duration_seconds)}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {content.type === "article" && content.article_metadata && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Datos del Artículo
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {content.article_metadata.author && (
                  <div className="flex items-center gap-2 text-sm">
                    <User className="w-4 h-4 text-muted-foreground" />
                    <span>{content.article_metadata.author}</span>
                  </div>
                )}
                {content.article_metadata.site_name && (
                  <div className="flex items-center gap-2 text-sm">
                    <Globe className="w-4 h-4 text-muted-foreground" />
                    <span>{content.article_metadata.site_name}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {content.type === "book" && content.book_metadata && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4" />
                  Datos del Libro
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {content.book_metadata.author && (
                  <div className="flex items-center gap-2 text-sm">
                    <User className="w-4 h-4 text-muted-foreground" />
                    <span>{content.book_metadata.author}</span>
                  </div>
                )}
                {content.book_metadata.publisher && (
                  <div className="flex items-center gap-2 text-sm">
                    <Globe className="w-4 h-4 text-muted-foreground" />
                    <span>{content.book_metadata.publisher}</span>
                  </div>
                )}
                {content.book_metadata.isbn && (
                  <div className="flex items-center gap-2 text-sm">
                    <Hash className="w-4 h-4 text-muted-foreground" />
                    <span>{content.book_metadata.isbn}</span>
                  </div>
                )}
                {content.book_metadata.page_count && (
                  <div className="flex items-center gap-2 text-sm">
                    <FileText className="w-4 h-4 text-muted-foreground" />
                    <span>{content.book_metadata.page_count} páginas</span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
