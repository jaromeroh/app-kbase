import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { createClient } from "@/lib/supabase/server";

// GET - Obtener estadísticas del usuario
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const supabase = await createClient();

    // Obtener conteos de contenido
    const { data: contents, error: contentsError } = await supabase
      .from("content")
      .select("type, status")
      .eq("user_id", session.user.id);

    if (contentsError) {
      console.error("Error fetching contents:", contentsError);
      return NextResponse.json({ error: contentsError.message }, { status: 500 });
    }

    // Obtener conteo de listas
    const { count: listsCount, error: listsError } = await supabase
      .from("lists")
      .select("*", { count: "exact", head: true })
      .eq("user_id", session.user.id);

    if (listsError) {
      console.error("Error fetching lists count:", listsError);
    }

    // Obtener conteo de tags
    const { count: tagsCount, error: tagsError } = await supabase
      .from("tags")
      .select("*", { count: "exact", head: true })
      .eq("user_id", session.user.id);

    if (tagsError) {
      console.error("Error fetching tags count:", tagsError);
    }

    // Calcular estadísticas
    const contentList = contents || [];
    const stats = {
      total_content: contentList.length,
      videos: contentList.filter((c) => c.type === "video").length,
      articles: contentList.filter((c) => c.type === "article").length,
      books: contentList.filter((c) => c.type === "book").length,
      pending: contentList.filter((c) => c.status === "pending").length,
      completed: contentList.filter((c) => c.status === "completed").length,
      lists: listsCount || 0,
      tags: tagsCount || 0,
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error("Error in GET /api/stats:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
