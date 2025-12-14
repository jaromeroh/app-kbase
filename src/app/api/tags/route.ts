import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { createClient } from "@/lib/supabase/server";

// GET - Listar tags del usuario con conteo de uso
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const supabase = await createClient();

    // Obtener tags con conteo de uso
    const { data: tags, error } = await supabase
      .from("tags")
      .select(`
        id,
        name,
        content_tags(count)
      `)
      .eq("user_id", session.user.id)
      .order("name");

    if (error) {
      console.error("Error fetching tags:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Transformar para incluir el count
    const tagsWithCount = tags.map((tag) => ({
      id: tag.id,
      name: tag.name,
      count: tag.content_tags?.[0]?.count || 0,
    }));

    // Ordenar por uso (más usados primero)
    tagsWithCount.sort((a, b) => b.count - a.count);

    return NextResponse.json(tagsWithCount);
  } catch (error) {
    console.error("Error in GET /api/tags:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
