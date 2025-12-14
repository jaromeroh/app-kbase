import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ContentForm } from "@/components/content/ContentForm";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

interface EditContentPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditContentPage({
  params,
}: EditContentPageProps) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const { id } = await params;
  const supabase = await createClient();

  const { data: content, error } = await supabase
    .from("content")
    .select(
      `
      *,
      video_metadata(*),
      article_metadata(*),
      book_metadata(*),
      content_lists(list_id, lists(id, name, color)),
      content_tags(tag_id, tags(id, name))
    `
    )
    .eq("id", id)
    .eq("user_id", session.user.id)
    .single();

  if (error || !content) {
    notFound();
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href={`/content/${id}`}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver al detalle
        </Link>
      </div>

      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold">Editar contenido</h1>
        <p className="text-muted-foreground mt-1">
          Modifica los datos de &quot;{content.title}&quot;
        </p>
      </div>

      {/* Form */}
      <ContentForm content={content} mode="edit" />
    </div>
  );
}
