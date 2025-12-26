import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import {
  Card,
  CardContent,
  Button,
} from "@/components/ui";
import {
  FolderOpen,
  ArrowLeft,
  Plus,
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import { ListDetailClient } from "./ListDetailClient";
import { ContentListCard } from "@/components/lists/ContentListCard";

interface ListDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function ListDetailPage({ params }: ListDetailPageProps) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const { id } = await params;
  const supabase = await createClient();

  // Obtener la lista
  const { data: list, error: listError } = await supabase
    .from("lists")
    .select("*")
    .eq("id", id)
    .eq("user_id", session.user.id)
    .single();

  if (listError || !list) {
    notFound();
  }

  // Obtener el contenido de la lista
  const { data: contentItems } = await supabase
    .from("content_lists")
    .select(
      `
      content_id,
      content:content_id(
        *,
        video_metadata(*),
        article_metadata(*),
        book_metadata(*)
      )
    `
    )
    .eq("list_id", id);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const contents = (contentItems?.map((item: any) => item.content).filter(Boolean) || []) as any[];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/lists">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver a listas
          </Button>
        </Link>
      </div>

      {/* List Info */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div
              className="w-16 h-16 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: `${list.color}20` }}
            >
              <FolderOpen
                className="w-8 h-8"
                style={{ color: list.color }}
              />
            </div>

            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold">{list.name}</h1>
              {list.description && (
                <p className="text-muted-foreground mt-1">{list.description}</p>
              )}
              <p className="text-sm text-muted-foreground mt-2">
                {contents.length} elemento{contents.length !== 1 ? "s" : ""} · Creada {formatDate(list.created_at)}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <ListDetailClient
                listId={id}
                listName={list.name}
                listDescription={list.description || ""}
                listColor={list.color}
                existingContentIds={contents.map((c) => c.id)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Content List */}
      {contents.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {contents.map((content) => (
            <ContentListCard
              key={content.id}
              content={content}
              listId={id}
            />
          ))}
        </div>
      ) : (
        <Card className="text-center py-12">
          <CardContent>
            <FolderOpen className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Lista vacía</h3>
            <p className="text-muted-foreground mb-4">
              Aún no has añadido contenido a esta lista.
            </p>
            <Link href="/content/new">
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Añadir contenido
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
