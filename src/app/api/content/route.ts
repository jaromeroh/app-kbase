import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { createClient } from "@/lib/supabase/server";
import { contentSchema, contentFilterSchema } from "@/lib/validators/content";
import { z } from "zod";

// GET - Listar contenido
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const params = contentFilterSchema.parse({
      type: searchParams.get("type") || undefined,
      status: searchParams.get("status") || undefined,
      listId: searchParams.get("listId") || undefined,
      search: searchParams.get("search") || undefined,
      page: searchParams.get("page") || 1,
      limit: searchParams.get("limit") || 20,
      sortBy: searchParams.get("sortBy") || "created_at",
      sortOrder: searchParams.get("sortOrder") || "desc",
    });

    const supabase = await createClient();

    let query = supabase
      .from("content")
      .select(
        `
        *,
        video_metadata(*),
        article_metadata(*),
        book_metadata(*),
        content_tags(tag_id, tags(id, name))
      `,
        { count: "exact" }
      )
      .eq("user_id", session.user.id);

    // Aplicar filtros
    if (params.type) {
      query = query.eq("type", params.type);
    }

    if (params.status) {
      query = query.eq("status", params.status);
    }

    if (params.search) {
      // Buscar en título, descripción y notas personales
      query = query.or(
        `title.ilike.%${params.search}%,description.ilike.%${params.search}%,personal_notes.ilike.%${params.search}%`
      );
    }

    // Ordenamiento y paginación
    query = query
      .order(params.sortBy, { ascending: params.sortOrder === "asc" })
      .range(
        (params.page - 1) * params.limit,
        params.page * params.limit - 1
      );

    const { data, error, count } = await query;

    if (error) {
      console.error("Error fetching content:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      data,
      pagination: {
        page: params.page,
        limit: params.limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / params.limit),
      },
    });
  } catch (error) {
    console.error("Error in GET /api/content:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

// POST - Crear contenido
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = contentSchema.parse(body);

    const supabase = await createClient();

    // Insertar contenido principal
    const { data: content, error: contentError } = await supabase
      .from("content")
      .insert({
        user_id: session.user.id,
        type: validatedData.type,
        status: validatedData.status,
        title: validatedData.title,
        url: validatedData.url || null,
        description: validatedData.description || null,
        rating: validatedData.rating || null,
        personal_notes: validatedData.personal_notes || null,
        completed_at:
          validatedData.status === "completed"
            ? new Date().toISOString()
            : null,
      })
      .select()
      .single();

    if (contentError) {
      console.error("Error creating content:", contentError);
      return NextResponse.json(
        { error: "Error al crear el contenido" },
        { status: 500 }
      );
    }

    // Insertar metadatos específicos según tipo
    if (validatedData.metadata) {
      const metadataTable = `${validatedData.type}_metadata`;
      const metadataToInsert: Record<string, unknown> = {
        content_id: content.id,
      };

      // Filtrar solo los campos relevantes para el tipo
      if (validatedData.type === "video") {
        if (validatedData.metadata.channel_name)
          metadataToInsert.channel_name = validatedData.metadata.channel_name;
        if (validatedData.metadata.channel_url)
          metadataToInsert.channel_url = validatedData.metadata.channel_url;
        if (validatedData.metadata.duration_minutes)
          metadataToInsert.duration_seconds =
            validatedData.metadata.duration_minutes * 60;
        if (validatedData.metadata.thumbnail_url)
          metadataToInsert.thumbnail_url = validatedData.metadata.thumbnail_url;
        if (validatedData.metadata.video_id)
          metadataToInsert.video_id = validatedData.metadata.video_id;
      } else if (validatedData.type === "article") {
        if (validatedData.metadata.author)
          metadataToInsert.author = validatedData.metadata.author;
        if (validatedData.metadata.site_name)
          metadataToInsert.site_name = validatedData.metadata.site_name;
        if (validatedData.metadata.site_favicon)
          metadataToInsert.site_favicon = validatedData.metadata.site_favicon;
        if (validatedData.metadata.reading_time_minutes)
          metadataToInsert.reading_time_minutes =
            validatedData.metadata.reading_time_minutes;
      } else if (validatedData.type === "book") {
        if (validatedData.metadata.author)
          metadataToInsert.author = validatedData.metadata.author;
        if (validatedData.metadata.publisher)
          metadataToInsert.publisher = validatedData.metadata.publisher;
        if (validatedData.metadata.isbn)
          metadataToInsert.isbn = validatedData.metadata.isbn;
        if (validatedData.metadata.page_count)
          metadataToInsert.page_count = validatedData.metadata.page_count;
        if (validatedData.metadata.cover_image_url)
          metadataToInsert.cover_image_url =
            validatedData.metadata.cover_image_url;
        if (validatedData.metadata.published_year)
          metadataToInsert.published_year =
            validatedData.metadata.published_year;
      }

      // Solo insertar si hay metadatos además del content_id
      if (Object.keys(metadataToInsert).length > 1) {
        const { error: metadataError } = await supabase
          .from(metadataTable)
          .insert(metadataToInsert);

        if (metadataError) {
          console.error("Error creating metadata:", metadataError);
        }
      }
    }

    // Asociar a listas si se especificaron
    if (validatedData.listIds?.length) {
      const { error: listsError } = await supabase.from("content_lists").insert(
        validatedData.listIds.map((listId) => ({
          content_id: content.id,
          list_id: listId,
        }))
      );

      if (listsError) {
        console.error("Error associating lists:", listsError);
      }
    }

    // Asociar tags si se especificaron
    if (validatedData.tags?.length) {
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
          .insert({ content_id: content.id, tag_id: tagId });

        if (contentTagError) {
          console.error("Error associating tag:", contentTagError);
        }
      }
    }

    return NextResponse.json(content, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Datos inválidos", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Error in POST /api/content:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
