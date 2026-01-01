import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ContentList } from "@/components/content/ContentList";
import { FloatingActionButton } from "@/components/ui";
import { FileText, Plus } from "lucide-react";
import { UserPreferences } from "@/types";
import Link from "next/link";

export default async function ArticlesPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const supabase = await createClient();

  // Obtener preferencias del usuario
  const { data: preferences } = await supabase
    .from("user_preferences")
    .select("default_view, default_sort, default_sort_order")
    .eq("user_id", session.user.id)
    .single();

  const { data: content } = await supabase
    .from("content")
    .select(
      `
      *,
      article_metadata(*),
      content_tags(tag_id, tags(id, name))
    `
    )
    .eq("user_id", session.user.id)
    .eq("type", "article")
    .order("created_at", { ascending: false });

  const userPreferences = preferences ? {
    defaultView: preferences.default_view as UserPreferences["default_view"],
    defaultSort: preferences.default_sort as UserPreferences["default_sort"],
    defaultSortOrder: preferences.default_sort_order as UserPreferences["default_sort_order"],
  } : undefined;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-muted rounded-lg">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Artículos</h1>
            <p className="text-muted-foreground">
              {content?.length || 0} artículos guardados
            </p>
          </div>
        </div>
        <Link
          href="/content/new?type=article"
          className="hidden md:inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Agregar Artículo
        </Link>
      </div>

      <ContentList content={content || []} preferences={userPreferences} showTypeFilter={false} />

      <FloatingActionButton href="/content/new?type=article" label="Agregar artículo" />
    </div>
  );
}
