import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ContentList } from "@/components/content/ContentList";
import { BookOpen } from "lucide-react";

export default async function BooksPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const supabase = await createClient();

  const { data: content } = await supabase
    .from("content")
    .select(
      `
      *,
      book_metadata(*)
    `
    )
    .eq("user_id", session.user.id)
    .eq("type", "book")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-muted rounded-lg">
          <BookOpen className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-3xl font-bold">Libros</h1>
          <p className="text-muted-foreground">
            {content?.length || 0} libros guardados
          </p>
        </div>
      </div>

      <ContentList content={content || []} />
    </div>
  );
}
