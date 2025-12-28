"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Card,
  Badge,
  Button,
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui";
import {
  Video,
  FileText,
  BookOpen,
  Star,
  Clock,
  CheckCircle,
  ExternalLink,
  LayoutGrid,
  List,
  ArrowUpDown,
  Settings2,
  ChevronUp,
  ChevronDown,
  X,
  Tag,
} from "lucide-react";
import { Content, DefaultView, DefaultSort, SortOrder as PreferencesSortOrder } from "@/types";
import { cn, formatRelativeTime, truncate } from "@/lib/utils";
import Image from "next/image";

interface UserPreferencesProps {
  defaultView?: DefaultView;
  defaultSort?: DefaultSort;
  defaultSortOrder?: PreferencesSortOrder;
}

interface ContentListProps {
  content: Content[];
  preferences?: UserPreferencesProps;
  showTypeFilter?: boolean;
}

const typeIcons = {
  video: Video,
  article: FileText,
  book: BookOpen,
};

const typeColors = {
  video: "bg-secondary text-secondary-foreground",
  article: "bg-secondary text-secondary-foreground",
  book: "bg-secondary text-secondary-foreground",
};

const typeLabels = {
  video: "Video",
  article: "Artículo",
  book: "Libro",
};

type SortField = "created_at" | "updated_at" | "rating" | "title";
type SortOrder = "asc" | "desc";

const sortLabels: Record<SortField, string> = {
  created_at: "Fecha creación",
  updated_at: "Fecha actualización",
  rating: "Calificación",
  title: "Título",
};

export function ContentList({ content, preferences, showTypeFilter = true }: ContentListProps) {
  const searchParams = useSearchParams();
  const tagFilter = searchParams.get("tag");

  const [filter, setFilter] = useState<"all" | "pending" | "completed">("all");
  const [typeFilter, setTypeFilter] = useState<
    "all" | "video" | "article" | "book"
  >("all");

  // View mode - usa preferencia del usuario o "grid" por defecto
  const [viewMode, setViewMode] = useState<"grid" | "list">(
    preferences?.defaultView || "grid"
  );

  // Sorting - usa preferencias del usuario o valores por defecto
  const [sortBy, setSortBy] = useState<SortField>(
    preferences?.defaultSort || "created_at"
  );
  const [sortOrder, setSortOrder] = useState<SortOrder>(
    preferences?.defaultSortOrder || "desc"
  );

  // Visible columns (for list view)
  const [visibleColumns, setVisibleColumns] = useState({
    type: true,
    rating: true,
    author: true,
    tags: true,
    status: true,
  });

  const filteredContent = content.filter((item) => {
    if (filter !== "all" && item.status !== filter) return false;
    if (typeFilter !== "all" && item.type !== typeFilter) return false;
    // Filter by tag if specified
    if (tagFilter) {
      const hasTag = item.content_tags?.some(
        (ct) => ct.tags?.name?.toLowerCase() === tagFilter.toLowerCase()
      );
      if (!hasTag) return false;
    }
    return true;
  });

  // Sorted content
  const sortedContent = useMemo(() => {
    return [...filteredContent].sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case "rating":
          comparison = (a.rating || 0) - (b.rating || 0);
          break;
        case "title":
          comparison = a.title.localeCompare(b.title);
          break;
        case "updated_at":
          comparison =
            new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime();
          break;
        case "created_at":
        default:
          comparison =
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      }

      return sortOrder === "asc" ? comparison : -comparison;
    });
  }, [filteredContent, sortBy, sortOrder]);

  const handleSort = (field: SortField) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder(field === "title" ? "asc" : "desc");
    }
  };

  const toggleColumn = (column: keyof typeof visibleColumns) => {
    setVisibleColumns((prev) => ({ ...prev, [column]: !prev[column] }));
  };

  const getThumbnail = (item: Content): string | null => {
    if (item.video_metadata?.thumbnail_url) {
      return item.video_metadata.thumbnail_url;
    }
    if (item.book_metadata?.cover_image_url) {
      return item.book_metadata.cover_image_url;
    }
    return null;
  };

  const getSubtitle = (item: Content): string | null => {
    if (item.video_metadata?.channel_name) {
      return item.video_metadata.channel_name;
    }
    if (item.article_metadata?.author) {
      return item.article_metadata.author;
    }
    if (item.book_metadata?.author) {
      return item.book_metadata.author;
    }
    return null;
  };

  if (content.length === 0) {
    return (
      <Card className="text-center py-12">
        <BookOpen className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">No hay contenido aún</h3>
        <p className="text-muted-foreground mb-4">
          Agrega tu primer video, artículo o libro.
        </p>
        <Link href="/content/new">
          <Button>Agregar Contenido</Button>
        </Link>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters and Controls */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Status Filter */}
        <div className="flex gap-1 p-1 bg-muted rounded-lg">
          {(["all", "pending", "completed"] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                filter === status
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {status === "all" && "Todos"}
              {status === "pending" && "Pendiente"}
              {status === "completed" && "Completado"}
            </button>
          ))}
        </div>

        {/* Type Filter - solo visible en "Todo el Contenido" */}
        {showTypeFilter && (
          <div className="flex gap-1 p-1 bg-muted rounded-lg">
            {(["all", "video", "article", "book"] as const).map((type) => (
              <button
                key={type}
                onClick={() => setTypeFilter(type)}
                className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                  typeFilter === type
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {type === "all" && "Todo tipo"}
                {type === "video" && "Videos"}
                {type === "article" && "Artículos"}
                {type === "book" && "Libros"}
              </button>
            ))}
          </div>
        )}

        {/* Active Tag Filter */}
        {tagFilter && (
          <Link href="/content">
            <Badge
              variant="secondary"
              className="flex items-center gap-1 cursor-pointer hover:bg-secondary/80"
            >
              <Tag className="w-3 h-3" />
              {tagFilter}
              <X className="w-3 h-3 ml-1" />
            </Badge>
          </Link>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Sort Dropdown */}
        <DropdownMenu
          trigger={
            <Button variant="outline" size="sm" className="gap-2">
              <ArrowUpDown className="w-4 h-4" />
              {sortLabels[sortBy]}
              {sortOrder === "asc" ? (
                <ChevronUp className="w-3 h-3" />
              ) : (
                <ChevronDown className="w-3 h-3" />
              )}
            </Button>
          }
        >
          <DropdownMenuLabel>Ordenar por</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {(["created_at", "updated_at", "rating", "title"] as SortField[]).map((field) => (
            <DropdownMenuItem
              key={field}
              onClick={() => handleSort(field)}
              className="justify-between"
            >
              {sortLabels[field]}
              {sortBy === field && (
                sortOrder === "asc" ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenu>

        {/* Columns Dropdown (only in list view) */}
        {viewMode === "list" && (
          <DropdownMenu
            align="right"
            trigger={
              <Button variant="outline" size="sm">
                <Settings2 className="w-4 h-4" />
              </Button>
            }
          >
            <DropdownMenuLabel>Columnas</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuCheckboxItem
              checked={visibleColumns.type}
              onCheckedChange={() => toggleColumn("type")}
            >
              Tipo
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={visibleColumns.rating}
              onCheckedChange={() => toggleColumn("rating")}
            >
              Rating
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={visibleColumns.author}
              onCheckedChange={() => toggleColumn("author")}
            >
              Autor/Canal
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={visibleColumns.tags}
              onCheckedChange={() => toggleColumn("tags")}
            >
              Tags
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={visibleColumns.status}
              onCheckedChange={() => toggleColumn("status")}
            >
              Estado
            </DropdownMenuCheckboxItem>
          </DropdownMenu>
        )}

        {/* View Toggle */}
        <div className="flex gap-1 p-1 bg-muted rounded-lg">
          <button
            onClick={() => setViewMode("grid")}
            className={cn(
              "p-1.5 rounded-md transition-colors",
              viewMode === "grid"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
            aria-label="Vista de cuadrícula"
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={cn(
              "p-1.5 rounded-md transition-colors",
              viewMode === "list"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
            aria-label="Vista de lista"
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Content - Grid View */}
      {viewMode === "grid" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedContent.map((item) => {
            const Icon = typeIcons[item.type];
            const thumbnail = getThumbnail(item);
            const subtitle = getSubtitle(item);

            return (
              <Link key={item.id} href={`/content/${item.id}`}>
                <Card className="h-full hover:shadow-md transition-shadow cursor-pointer overflow-hidden">
                  {/* Thumbnail */}
                  <div className="aspect-video bg-muted relative">
                    {thumbnail ? (
                      <Image
                        src={thumbnail}
                        alt={item.title}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Icon className="w-12 h-12 text-muted-foreground" />
                      </div>
                    )}
                    {/* Type Badge */}
                    <div className="absolute top-2 left-2">
                      <Badge className={typeColors[item.type]}>
                        {typeLabels[item.type]}
                      </Badge>
                    </div>
                    {/* Status Badge */}
                    <div className="absolute top-2 right-2">
                      {item.status === "completed" ? (
                        <div className="p-1.5 bg-primary rounded-full">
                          <CheckCircle className="w-3 h-3 text-primary-foreground" />
                        </div>
                      ) : (
                        <div className="p-1.5 bg-muted rounded-full">
                          <Clock className="w-3 h-3 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-4">
                    <h3 className="font-semibold line-clamp-2 mb-1">
                      {item.title}
                    </h3>

                    {subtitle && (
                      <p className="text-sm text-muted-foreground mb-2">
                        {subtitle}
                      </p>
                    )}

                    {item.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                        {truncate(item.description, 100)}
                      </p>
                    )}

                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{formatRelativeTime(item.created_at)}</span>

                      <div className="flex items-center gap-2">
                        {item.rating && (
                          <span className="flex items-center gap-1">
                            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                            {item.rating}
                          </span>
                        )}
                        {item.url && <ExternalLink className="w-3 h-3" />}
                      </div>
                    </div>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      )}

      {/* Content - List View */}
      {viewMode === "list" && (
        <div className="border border-border rounded-lg overflow-hidden">
          {/* Header - oculto en móvil para más espacio */}
          <div className="hidden sm:flex items-center gap-4 px-4 py-2 bg-muted/50 border-b border-border text-sm font-medium text-muted-foreground">
            <div className="w-16 flex-shrink-0" />
            <div className="flex-1 min-w-0">Título</div>
            {visibleColumns.type && <div className="w-20 text-center">Tipo</div>}
            {visibleColumns.rating && <div className="w-16 text-center">Rating</div>}
            {visibleColumns.author && <div className="w-32 hidden md:block">Autor/Canal</div>}
            {visibleColumns.tags && <div className="w-36 hidden sm:block">Tags</div>}
            {visibleColumns.status && <div className="w-20 text-center">Estado</div>}
          </div>

          {/* Rows */}
          {sortedContent.map((item) => {
            const Icon = typeIcons[item.type];
            const thumbnail = getThumbnail(item);
            const subtitle = getSubtitle(item);

            return (
              <Link
                key={item.id}
                href={`/content/${item.id}`}
                className="flex items-center gap-3 sm:gap-4 px-3 sm:px-4 py-3 border-b border-border last:border-b-0 hover:bg-muted/30 transition-colors"
              >
                {/* Mini Thumbnail */}
                <div className="w-16 h-10 flex-shrink-0 bg-muted rounded-sm overflow-hidden relative">
                  {thumbnail ? (
                    <Image
                      src={thumbnail}
                      alt={item.title}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Icon className="w-5 h-5 text-muted-foreground" />
                    </div>
                  )}
                </div>

                {/* Title + Info móvil */}
                <div className="flex-1 min-w-0">
                  <p className="font-medium line-clamp-2 sm:line-clamp-1">{item.title}</p>
                  <div className="flex items-center justify-between gap-2 mt-0.5">
                    {subtitle && (
                      <p className="text-xs text-muted-foreground truncate md:hidden">
                        {subtitle}
                      </p>
                    )}
                    {/* Rating en móvil */}
                    {item.rating && (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground sm:hidden flex-shrink-0">
                        <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                        {item.rating}
                      </span>
                    )}
                  </div>
                </div>

                {/* Type - oculto en móvil */}
                {visibleColumns.type && (
                  <div className="w-20 hidden sm:flex justify-center">
                    <Badge className={cn(typeColors[item.type], "text-xs")}>
                      {typeLabels[item.type]}
                    </Badge>
                  </div>
                )}

                {/* Rating - oculto en móvil */}
                {visibleColumns.rating && (
                  <div className="w-16 hidden sm:flex justify-center">
                    {item.rating ? (
                      <span className="flex items-center gap-1 text-sm">
                        <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                        {item.rating}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </div>
                )}

                {/* Author/Channel */}
                {visibleColumns.author && (
                  <div className="w-32 hidden md:block">
                    <p className="text-sm text-muted-foreground truncate">
                      {subtitle || "-"}
                    </p>
                  </div>
                )}

                {/* Tags */}
                {visibleColumns.tags && (
                  <div className="w-36 hidden sm:flex flex-wrap gap-1">
                    {item.content_tags && item.content_tags.length > 0 ? (
                      <>
                        {item.content_tags.slice(0, 2).map(({ tags }) => (
                          <Badge
                            key={tags?.name}
                            variant="outline"
                            className="text-xs"
                          >
                            {tags?.name}
                          </Badge>
                        ))}
                        {item.content_tags.length > 2 && (
                          <span className="text-xs text-muted-foreground">
                            +{item.content_tags.length - 2}
                          </span>
                        )}
                      </>
                    ) : (
                      <span className="text-muted-foreground text-xs">-</span>
                    )}
                  </div>
                )}

                {/* Status - oculto en móvil */}
                {visibleColumns.status && (
                  <div className="w-20 hidden sm:flex justify-center">
                    {item.status === "completed" ? (
                      <div className="p-1 bg-primary rounded-full">
                        <CheckCircle className="w-3 h-3 text-primary-foreground" />
                      </div>
                    ) : (
                      <div className="p-1 bg-muted rounded-full">
                        <Clock className="w-3 h-3 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                )}
              </Link>
            );
          })}
        </div>
      )}

      {sortedContent.length === 0 && (
        <Card className="text-center py-8">
          <p className="text-muted-foreground">
            No hay contenido que coincida con los filtros seleccionados.
          </p>
        </Card>
      )}
    </div>
  );
}
