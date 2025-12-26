import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const addContentsSchema = z.object({
  contentIds: z.array(z.string().uuid()).min(1),
});

const removeContentSchema = z.object({
  contentId: z.string().uuid(),
});

// POST - Añadir contenido a la lista
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id: listId } = await params;
    const body = await request.json();
    const { contentIds } = addContentsSchema.parse(body);

    const supabase = await createClient();

    // Verificar que la lista pertenece al usuario
    const { data: list } = await supabase
      .from("lists")
      .select("id")
      .eq("id", listId)
      .eq("user_id", session.user.id)
      .single();

    if (!list) {
      return NextResponse.json(
        { error: "Lista no encontrada" },
        { status: 404 }
      );
    }

    // Verificar que el contenido pertenece al usuario
    const { data: contents } = await supabase
      .from("content")
      .select("id")
      .eq("user_id", session.user.id)
      .in("id", contentIds);

    if (!contents || contents.length === 0) {
      return NextResponse.json(
        { error: "Contenido no encontrado" },
        { status: 404 }
      );
    }

    const validContentIds = contents.map((c) => c.id);

    // Obtener contenido ya asociado para evitar duplicados
    const { data: existingAssociations } = await supabase
      .from("content_lists")
      .select("content_id")
      .eq("list_id", listId)
      .in("content_id", validContentIds);

    const existingIds = new Set(existingAssociations?.map((a) => a.content_id) || []);
    const newContentIds = validContentIds.filter((id) => !existingIds.has(id));

    if (newContentIds.length === 0) {
      return NextResponse.json({
        message: "El contenido ya está en la lista",
        added: 0,
      });
    }

    // Insertar nuevas asociaciones
    const { error } = await supabase.from("content_lists").insert(
      newContentIds.map((contentId) => ({
        list_id: listId,
        content_id: contentId,
      }))
    );

    if (error) {
      console.error("Error adding content to list:", error);
      return NextResponse.json(
        { error: "Error al añadir contenido" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "Contenido añadido correctamente",
      added: newContentIds.length,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Datos inválidos", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Error in POST /api/lists/[id]/contents:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

// DELETE - Quitar contenido de la lista
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id: listId } = await params;
    const body = await request.json();
    const { contentId } = removeContentSchema.parse(body);

    const supabase = await createClient();

    // Verificar que la lista pertenece al usuario
    const { data: list } = await supabase
      .from("lists")
      .select("id")
      .eq("id", listId)
      .eq("user_id", session.user.id)
      .single();

    if (!list) {
      return NextResponse.json(
        { error: "Lista no encontrada" },
        { status: 404 }
      );
    }

    // Eliminar la asociación
    const { error } = await supabase
      .from("content_lists")
      .delete()
      .eq("list_id", listId)
      .eq("content_id", contentId);

    if (error) {
      console.error("Error removing content from list:", error);
      return NextResponse.json(
        { error: "Error al quitar contenido" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "Contenido quitado correctamente",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Datos inválidos", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Error in DELETE /api/lists/[id]/contents:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
