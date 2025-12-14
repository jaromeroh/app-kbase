import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { createClient } from "@/lib/supabase/server";
import { contentUpdateSchema } from "@/lib/validators/content";
import { z } from "zod";

// GET - Obtener contenido por ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id } = await params;
    const supabase = await createClient();

    const { data, error } = await supabase
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

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json(
          { error: "Contenido no encontrado" },
          { status: 404 }
        );
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error in GET /api/content/[id]:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

// PUT - Actualizar contenido
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
    const validatedData = contentUpdateSchema.parse(body);

    const supabase = await createClient();

    // Verificar que el contenido pertenece al usuario
    const { data: existing } = await supabase
      .from("content")
      .select("id, type, status")
      .eq("id", id)
      .eq("user_id", session.user.id)
      .single();

    if (!existing) {
      return NextResponse.json(
        { error: "Contenido no encontrado" },
        { status: 404 }
      );
    }

    // Preparar datos para actualizar
    const updateData: Record<string, unknown> = {};

    if (validatedData.type !== undefined) updateData.type = validatedData.type;
    if (validatedData.status !== undefined) {
      updateData.status = validatedData.status;
      // Si cambia a completado, establecer fecha
      if (
        validatedData.status === "completed" &&
        existing.status !== "completed"
      ) {
        updateData.completed_at = new Date().toISOString();
      }
      // Si cambia de completado a pendiente, limpiar fecha
      if (
        validatedData.status === "pending" &&
        existing.status === "completed"
      ) {
        updateData.completed_at = null;
      }
    }
    if (validatedData.title !== undefined)
      updateData.title = validatedData.title;
    if (validatedData.url !== undefined)
      updateData.url = validatedData.url || null;
    if (validatedData.description !== undefined)
      updateData.description = validatedData.description || null;
    if (validatedData.rating !== undefined)
      updateData.rating = validatedData.rating || null;
    if (validatedData.personal_notes !== undefined)
      updateData.personal_notes = validatedData.personal_notes || null;

    // Actualizar contenido principal
    const { data, error } = await supabase
      .from("content")
      .update(updateData)
      .eq("id", id)
      .eq("user_id", session.user.id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Actualizar metadatos si existen
    const contentType = validatedData.type || existing.type;

    if (validatedData.metadata) {
      const metadata = validatedData.metadata;

      if (contentType === "video") {
        const videoData = {
          channel_name: metadata.channel_name || null,
          channel_url: metadata.channel_url || null,
          duration_seconds: metadata.duration_minutes ? metadata.duration_minutes * 60 : null,
          thumbnail_url: metadata.thumbnail_url || null,
          video_id: metadata.video_id || null,
        };

        // Verificar si ya existe metadata
        const { data: existingMeta } = await supabase
          .from("video_metadata")
          .select("id")
          .eq("content_id", id)
          .single();

        if (existingMeta) {
          await supabase
            .from("video_metadata")
            .update(videoData)
            .eq("content_id", id);
        } else {
          await supabase
            .from("video_metadata")
            .insert({ content_id: id, ...videoData });
        }
      }

      if (contentType === "article") {
        const articleData = {
          author: metadata.author || null,
          site_name: metadata.site_name || null,
          reading_time_minutes: metadata.reading_time_minutes || null,
        };

        const { data: existingMeta } = await supabase
          .from("article_metadata")
          .select("id")
          .eq("content_id", id)
          .single();

        if (existingMeta) {
          await supabase
            .from("article_metadata")
            .update(articleData)
            .eq("content_id", id);
        } else {
          await supabase
            .from("article_metadata")
            .insert({ content_id: id, ...articleData });
        }
      }

      if (contentType === "book") {
        const bookData = {
          author: metadata.author || null,
          publisher: metadata.publisher || null,
          isbn: metadata.isbn || null,
          page_count: metadata.page_count || null,
          cover_image_url: metadata.cover_image_url || null,
        };

        const { data: existingMeta } = await supabase
          .from("book_metadata")
          .select("id")
          .eq("content_id", id)
          .single();

        if (existingMeta) {
          await supabase
            .from("book_metadata")
            .update(bookData)
            .eq("content_id", id);
        } else {
          await supabase
            .from("book_metadata")
            .insert({ content_id: id, ...bookData });
        }
      }
    }

    // Actualizar tags si se especificaron
    if (validatedData.tags !== undefined) {
      // Eliminar tags existentes
      await supabase
        .from("content_tags")
        .delete()
        .eq("content_id", id);

      // Agregar nuevos tags
      if (validatedData.tags.length > 0) {
        for (const tagName of validatedData.tags) {
          const normalizedName = tagName.trim().toLowerCase();
          if (!normalizedName) continue;

          // Buscar tag existente o crear uno nuevo
          let { data: existingTag } = await supabase
            .from("tags")
            .select("id")
            .eq("user_id", session.user.id)
            .eq("name", normalizedName)
            .single();

          let tagId = existingTag?.id;

          if (!tagId) {
            const { data: newTag, error: tagError } = await supabase
              .from("tags")
              .insert({ user_id: session.user.id, name: normalizedName })
              .select("id")
              .single();

            if (tagError) {
              console.error("Error creating tag:", tagError);
              continue;
            }
            tagId = newTag.id;
          }

          // Crear relación content_tags
          const { error: contentTagError } = await supabase
            .from("content_tags")
            .insert({ content_id: id, tag_id: tagId });

          if (contentTagError) {
            console.error("Error associating tag:", contentTagError);
          }
        }
      }
    }

    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Datos inválidos", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Error in PUT /api/content/[id]:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar contenido
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id } = await params;
    const supabase = await createClient();

    const { error } = await supabase
      .from("content")
      .delete()
      .eq("id", id)
      .eq("user_id", session.user.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in DELETE /api/content/[id]:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
