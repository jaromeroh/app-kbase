import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ContentList } from "@/components/content/ContentList";

interface ContentPageProps {
  searchParams: Promise<{
    type?: string;
    status?: string;
    page?: string;
  }>;
}

export default async function ContentPage({ searchParams }: ContentPageProps) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const params = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("content")
    .select(
      `
      *,
      video_metadata(*),
      article_metadata(*),
      book_metadata(*)
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

      <ContentList content={content || []} />
    </div>
  );
}
