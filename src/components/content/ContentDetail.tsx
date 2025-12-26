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
  TimestampText,
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
  FolderOpen,
  Link as LinkIcon,
  Play,
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

  // Obtener metadatos según el tipo
  const getAuthor = () => {
    if (content.type === "video") return content.video_metadata?.channel_name;
    if (content.type === "article") return content.article_metadata?.author;
    if (content.type === "book") return content.book_metadata?.author;
    return null;
  };

  const author = getAuthor();

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Link href="/content">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver
          </Button>
        </Link>
        <div className="flex items-center gap-2">
          <Link href={`/content/${content.id}/edit`}>
            <Button variant="outline" size="sm">
              <Edit className="w-4 h-4 mr-2" />
              Editar
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
      </div>

      {/* Hero Section */}
      <Card className="overflow-hidden">
        <div className="relative">
          {/* Thumbnail para videos - tamaño optimizado para calidad */}
          {thumbnail && content.type === "video" ? (
            <div className="flex justify-center bg-muted/30 p-4">
              <div className="relative w-full max-w-xl aspect-video rounded-lg overflow-hidden shadow-lg">
                <Image
                  src={thumbnail}
                  alt={content.title}
                  fill
                  className="object-cover"
                />
                {content.url && (
                  <a
                    href={content.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 hover:opacity-100 transition-opacity"
                  >
                    <div className="w-14 h-14 rounded-full bg-white/90 flex items-center justify-center">
                      <Play className="w-7 h-7 text-black ml-1" />
                    </div>
                  </a>
                )}
              </div>
            </div>
          ) : thumbnail ? (
            <div className="p-6 pb-0 flex justify-center">
              <div className="relative w-32 h-48 rounded-lg overflow-hidden shadow-lg">
                <Image
                  src={thumbnail}
                  alt={content.title}
                  fill
                  className="object-cover"
                />
              </div>
            </div>
          ) : null}
        </div>

        <CardContent className={cn("pt-6", thumbnail && content.type !== "video" && "pt-4")}>
          {/* Badges */}
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <Badge variant="secondary" className="flex items-center gap-1">
              <Icon className="w-3 h-3" />
              {typeLabels[content.type]}
            </Badge>
            <Badge
              variant={content.status === "completed" ? "success" : "outline"}
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
            {content.rating && (
              <Badge variant="warning" className="flex items-center gap-1">
                <Star className="w-3 h-3 fill-current" />
                {content.rating}/5
              </Badge>
            )}
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold mb-2">{content.title}</h1>

          {/* Author/Channel */}
          {author && (
            <p className="text-muted-foreground flex items-center gap-2 mb-4">
              <User className="w-4 h-4" />
              {author}
            </p>
          )}

          {/* Tags */}
          {content.content_tags && content.content_tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
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

          {/* Listas */}
          {content.content_lists && content.content_lists.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {content.content_lists.map(({ list_id, lists }) => (
                <Link href={`/lists/${list_id}`} key={list_id}>
                  <Badge
                    className="cursor-pointer hover:opacity-80 flex items-center gap-1 border"
                    style={{
                      backgroundColor: `${lists?.color}15`,
                      color: lists?.color,
                      borderColor: `${lists?.color}50`,
                    }}
                  >
                    <FolderOpen className="w-3 h-3" />
                    {lists?.name}
                  </Badge>
                </Link>
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-wrap items-center gap-2 pt-4 border-t">
            <Button
              onClick={toggleStatus}
              disabled={isUpdating}
              variant={content.status === "completed" ? "outline" : "default"}
              size="sm"
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
                <Button variant="outline" size="sm">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Abrir enlace
                </Button>
              </a>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Content Sections - Grid layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Descripción */}
        {content.description && (
          <Card className="md:col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Descripción</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground whitespace-pre-wrap text-sm">
                {content.description}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Resumen */}
        {content.summary && (
          <Card className="md:col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Resumen</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap text-sm">
                <TimestampText
                  text={content.summary}
                  videoUrl={content.type === "video" ? content.url : null}
                />
              </p>
            </CardContent>
          </Card>
        )}

        {/* Mis Comentarios */}
        {content.personal_notes && (
          <Card className="md:col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Mis Comentarios</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap text-sm">{content.personal_notes}</p>
            </CardContent>
          </Card>
        )}

        {/* Links Relacionados */}
        {content.related_links && content.related_links.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <LinkIcon className="w-4 h-4" />
                Links Relacionados
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                {content.related_links.map((link, index) => (
                  <a
                    key={index}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 p-2 -mx-2 rounded-md hover:bg-muted transition-colors group"
                  >
                    <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-primary flex-shrink-0" />
                    <span className="text-sm group-hover:text-primary truncate">
                      {link.title}
                    </span>
                  </a>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Metadatos específicos del tipo */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Icon className="w-4 h-4" />
              Información
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Fechas */}
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground">Agregado:</span>
              <span>{formatDate(content.created_at)}</span>
            </div>
            {content.completed_at && (
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="text-muted-foreground">Completado:</span>
                <span>{formatDate(content.completed_at)}</span>
              </div>
            )}

            {/* Video metadata */}
            {content.type === "video" && content.video_metadata && (
              <>
                {content.video_metadata.channel_name && (
                  <div className="flex items-center gap-2 text-sm">
                    <User className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Canal:</span>
                    <span>{content.video_metadata.channel_name}</span>
                  </div>
                )}
                {content.video_metadata.duration_seconds && (
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Duración:</span>
                    <span>{formatDuration(content.video_metadata.duration_seconds)}</span>
                  </div>
                )}
              </>
            )}

            {/* Article metadata */}
            {content.type === "article" && content.article_metadata && (
              <>
                {content.article_metadata.author && (
                  <div className="flex items-center gap-2 text-sm">
                    <User className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Autor:</span>
                    <span>{content.article_metadata.author}</span>
                  </div>
                )}
                {content.article_metadata.site_name && (
                  <div className="flex items-center gap-2 text-sm">
                    <Globe className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Sitio:</span>
                    <span>{content.article_metadata.site_name}</span>
                  </div>
                )}
                {content.article_metadata.reading_time_minutes && (
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Lectura:</span>
                    <span>{content.article_metadata.reading_time_minutes} min</span>
                  </div>
                )}
              </>
            )}

            {/* Book metadata */}
            {content.type === "book" && content.book_metadata && (
              <>
                {content.book_metadata.author && (
                  <div className="flex items-center gap-2 text-sm">
                    <User className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Autor:</span>
                    <span>{content.book_metadata.author}</span>
                  </div>
                )}
                {content.book_metadata.publisher && (
                  <div className="flex items-center gap-2 text-sm">
                    <Globe className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Editorial:</span>
                    <span>{content.book_metadata.publisher}</span>
                  </div>
                )}
                {content.book_metadata.isbn && (
                  <div className="flex items-center gap-2 text-sm">
                    <Hash className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">ISBN:</span>
                    <span>{content.book_metadata.isbn}</span>
                  </div>
                )}
                {content.book_metadata.page_count && (
                  <div className="flex items-center gap-2 text-sm">
                    <FileText className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Páginas:</span>
                    <span>{content.book_metadata.page_count}</span>
                  </div>
                )}
                {content.book_metadata.published_year && (
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Año:</span>
                    <span>{content.book_metadata.published_year}</span>
                  </div>
                )}
              </>
            )}

            {/* URL */}
            {content.url && (
              <div className="flex items-start gap-2 text-sm pt-2 border-t">
                <LinkIcon className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                <a
                  href={content.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline break-all"
                >
                  {content.url}
                </a>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Calificación detallada (si existe) */}
        {content.rating && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Calificación</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={cn(
                      "w-8 h-8",
                      star <= content.rating!
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-muted-foreground/30"
                    )}
                  />
                ))}
              </div>
              <p className="text-2xl font-bold mt-2">{content.rating}/5</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
