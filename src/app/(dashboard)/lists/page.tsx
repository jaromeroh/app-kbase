import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, Button } from "@/components/ui";
import { FolderOpen, Plus } from "lucide-react";
import Link from "next/link";

export default async function ListsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const supabase = await createClient();

  const { data: lists } = await supabase
    .from("lists")
    .select(
      `
      *,
      content_lists(count)
    `
    )
    .eq("user_id", session.user.id)
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-muted rounded-lg">
            <FolderOpen className="w-6 h-6 text-foreground" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Mis Listas</h1>
            <p className="text-muted-foreground">
              Organiza tu contenido por temas
            </p>
          </div>
        </div>
        <Link href="/lists/new">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Nueva Lista
          </Button>
        </Link>
      </div>

      {lists && lists.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {lists.map((list) => (
            <Link key={list.id} href={`/lists/${list.id}`}>
              <Card className="h-full hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: `${list.color}20` }}
                    >
                      <FolderOpen
                        className="w-5 h-5"
                        style={{ color: list.color }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold truncate">{list.name}</h3>
                      {list.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                          {list.description}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-2">
                        {list.content_lists?.[0]?.count || 0} elementos
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <Card className="text-center py-12">
          <CardContent>
            <FolderOpen className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No hay listas aún</h3>
            <p className="text-muted-foreground mb-4">
              Crea tu primera lista para organizar tu contenido por temas.
            </p>
            <Link href="/lists/new">
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Crear Lista
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
