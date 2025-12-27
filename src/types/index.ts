// Content types
export type ContentType = "video" | "article" | "book";
export type ContentStatus = "pending" | "completed";

export interface RelatedLink {
  title: string;
  url: string;
}

export interface Content {
  id: string;
  user_id: string;
  type: ContentType;
  status: ContentStatus;
  title: string;
  url: string | null;
  description: string | null;
  summary: string | null;
  related_links: RelatedLink[];
  rating: number | null;
  personal_notes: string | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
  // Relations
  video_metadata?: VideoMetadata | null;
  article_metadata?: ArticleMetadata | null;
  book_metadata?: BookMetadata | null;
  content_lists?: { list_id: string; lists?: { id: string; name: string; color: string } }[];
  content_tags?: { tag_id: string; tags: { name: string } }[];
}

export interface VideoMetadata {
  id: string;
  content_id: string;
  channel_name: string | null;
  channel_url: string | null;
  duration_seconds: number | null;
  thumbnail_url: string | null;
  video_id: string | null;
  published_at: string | null;
}

export interface ArticleMetadata {
  id: string;
  content_id: string;
  author: string | null;
  site_name: string | null;
  site_favicon: string | null;
  reading_time_minutes: number | null;
  published_at: string | null;
}

export interface BookMetadata {
  id: string;
  content_id: string;
  author: string | null;
  publisher: string | null;
  isbn: string | null;
  page_count: number | null;
  cover_image_url: string | null;
  published_year: number | null;
}

// List types
export interface List {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  color: string;
  icon: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
  _count?: {
    content_lists: number;
  };
}

// Tag types
export interface Tag {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
}

// User types
export interface User {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  role: "admin" | "viewer";
}

// User Preferences types
export type DefaultView = "list" | "grid";
export type DefaultSort = "created_at" | "updated_at" | "title" | "rating";
export type SortOrder = "asc" | "desc";
export type ItemsPerPage = 10 | 20 | 50;

export interface UserPreferences {
  id: string;
  user_id: string;
  display_name: string | null;
  default_view: DefaultView;
  default_sort: DefaultSort;
  default_sort_order: SortOrder;
  items_per_page: ItemsPerPage;
  created_at: string;
  updated_at: string;
}

export interface UserPreferencesInput {
  display_name?: string | null;
  default_view?: DefaultView;
  default_sort?: DefaultSort;
  default_sort_order?: SortOrder;
  items_per_page?: ItemsPerPage;
}

// Stats types
export interface UserStats {
  total_content: number;
  pending: number;
  completed: number;
  videos: number;
  articles: number;
  books: number;
  avg_rating: number | null;
  this_month: number;
}

// API Response types
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ApiError {
  error: string;
  details?: unknown;
}
