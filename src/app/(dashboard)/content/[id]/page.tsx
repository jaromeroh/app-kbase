import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ContentDetail } from "@/components/content/ContentDetail";

interface ContentDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function ContentDetailPage({
  params,
}: ContentDetailPageProps) {
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

  return <ContentDetail content={content} />;
}
