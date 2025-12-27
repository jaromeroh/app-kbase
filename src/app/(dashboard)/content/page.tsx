import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ContentList } from "@/components/content/ContentList";
import { UserPreferences } from "@/types";

interface ContentPageProps {
  searchParams: Promise<{
    type?: string;
    status?: string;
    page?: string;
  }>;
}

export default async function ContentPage({ searchParams }: ContentPageProps) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const params = await searchParams;
  const supabase = await createClient();

  // Obtener preferencias del usuario
  const { data: preferences } = await supabase
    .from("user_preferences")
    .select("default_view, default_sort, default_sort_order")
    .eq("user_id", session.user.id)
    .single();

  let query = supabase
    .from("content")
    .select(
      `
      *,
      video_metadata(*),
      article_metadata(*),
      book_metadata(*),
      content_tags(tag_id, tags(id, name))
    `
    )
    .eq("user_id", session.user.id)
    .order("created_at", { ascending: false });

  if (params.type) {
    query = query.eq("type", params.type);
  }

  if (params.status) {
    query = query.eq("status", params.status);
  }

  const { data: content, error } = await query;

  if (error) {
    console.error("Error fetching content:", error);
  }

  const userPreferences = preferences ? {
    defaultView: preferences.default_view as UserPreferences["default_view"],
    defaultSort: preferences.default_sort as UserPreferences["default_sort"],
    defaultSortOrder: preferences.default_sort_order as UserPreferences["default_sort_order"],
  } : undefined;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Todo el Contenido</h1>
          <p className="text-muted-foreground mt-1">
            Gestiona todos tus videos, artículos y libros
          </p>
        </div>
        <a
          href="/content/new"
          className="inline-flex items-center justify-center px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
        >
          Agregar Nuevo
        </a>
      </div>

      <ContentList content={content || []} preferences={userPreferences} />
    </div>
  );
}
