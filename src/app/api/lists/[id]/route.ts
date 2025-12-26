import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { createClient } from "@/lib/supabase/server";
import { listUpdateSchema } from "@/lib/validators/list";
import { z } from "zod";

// GET - Obtener lista por ID con su contenido
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
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

    if (listError) {
      if (listError.code === "PGRST116") {
        return NextResponse.json(
          { error: "Lista no encontrada" },
          { status: 404 }
        );
      }
      return NextResponse.json({ error: listError.message }, { status: 500 });
    }

    // Obtener el contenido de la lista
    const { data: contentItems, error: contentError } = await supabase
      .from("content_lists")
      .select(
        `
        content_id,
        content:content_id(
          *,
          video_metadata(*),
          article_metadata(*),
          book_metadata(*),
          content_tags(tag_id, tags(id, name))
        )
      `
      )
      .eq("list_id", id);

    if (contentError) {
      console.error("Error fetching list content:", contentError);
    }

    // Formatear la respuesta
    const contents = contentItems?.map((item) => item.content).filter(Boolean) || [];

    return NextResponse.json({
      ...list,
      contents,
      content_count: contents.length,
    });
  } catch (error) {
    console.error("Error in GET /api/lists/[id]:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

// PUT - Actualizar lista
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const validatedData = listUpdateSchema.parse(body);

    const supabase = await createClient();

    // Verificar que la lista pertenece al usuario
    const { data: existing } = await supabase
      .from("lists")
      .select("id")
      .eq("id", id)
      .eq("user_id", session.user.id)
      .single();

    if (!existing) {
      return NextResponse.json(
        { error: "Lista no encontrada" },
        { status: 404 }
      );
    }

    // Actualizar la lista
    const { data, error } = await supabase
      .from("lists")
      .update(validatedData)
      .eq("id", id)
      .eq("user_id", session.user.id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Datos inválidos", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Error in PUT /api/lists/[id]:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar lista
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id } = await params;
    const supabase = await createClient();

    // Eliminar la lista (las relaciones en content_lists se eliminan en cascada)
    const { error } = await supabase
      .from("lists")
      .delete()
      .eq("id", id)
      .eq("user_id", session.user.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in DELETE /api/lists/[id]:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
