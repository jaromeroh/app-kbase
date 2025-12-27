import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { createClient } from "@/lib/supabase/server";

interface ExportContent {
  id: string;
  type: string;
  status: string;
  title: string;
  url: string | null;
  description: string | null;
  summary: string | null;
  rating: number | null;
  personal_notes: string | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
  related_links: { title: string; url: string }[];
  metadata: Record<string, unknown>;
  lists: string[];
  tags: string[];
}

interface ExportData {
  exported_at: string;
  user_email: string;
  stats: {
    total_content: number;
    videos: number;
    articles: number;
    books: number;
    lists: number;
    tags: number;
  };
  content: ExportContent[];
  lists: { id: string; name: string; description: string | null; color: string; icon: string }[];
  tags: { id: string; name: string }[];
}

// GET - Exportar datos del usuario
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const format = searchParams.get("format") || "json";

    if (!["json", "csv"].includes(format)) {
      return NextResponse.json(
        { error: "Formato inválido. Use 'json' o 'csv'" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Obtener todo el contenido con relaciones
    const { data: contents, error: contentError } = await supabase
      .from("content")
      .select(`
        *,
        video_metadata(*),
        article_metadata(*),
        book_metadata(*),
        content_lists(list_id, lists(id, name)),
        content_tags(tag_id, tags(id, name))
      `)
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: false });

    if (contentError) {
      console.error("Error fetching contents:", contentError);
      return NextResponse.json({ error: contentError.message }, { status: 500 });
    }

    // Obtener listas
    const { data: lists, error: listsError } = await supabase
      .from("lists")
      .select("id, name, description, color, icon")
      .eq("user_id", session.user.id);

    if (listsError) {
      console.error("Error fetching lists:", listsError);
      return NextResponse.json({ error: listsError.message }, { status: 500 });
    }

    // Obtener tags
    const { data: tags, error: tagsError } = await supabase
      .from("tags")
      .select("id, name")
      .eq("user_id", session.user.id);

    if (tagsError) {
      console.error("Error fetching tags:", tagsError);
      return NextResponse.json({ error: tagsError.message }, { status: 500 });
    }

    // Procesar contenido para exportación
    const processedContent: ExportContent[] = (contents || []).map((item) => {
      // Combinar metadata según el tipo
      let metadata: Record<string, unknown> = {};
      if (item.type === "video" && item.video_metadata) {
        const { id, content_id, ...rest } = item.video_metadata;
        metadata = rest;
      } else if (item.type === "article" && item.article_metadata) {
        const { id, content_id, ...rest } = item.article_metadata;
        metadata = rest;
      } else if (item.type === "book" && item.book_metadata) {
        const { id, content_id, ...rest } = item.book_metadata;
        metadata = rest;
      }

      return {
        id: item.id,
        type: item.type,
        status: item.status,
        title: item.title,
        url: item.url,
        description: item.description,
        summary: item.summary,
        rating: item.rating,
        personal_notes: item.personal_notes,
        created_at: item.created_at,
        updated_at: item.updated_at,
        completed_at: item.completed_at,
        related_links: item.related_links || [],
        metadata,
        lists: item.content_lists?.map((cl: { lists: { name: string } }) => cl.lists?.name).filter(Boolean) || [],
        tags: item.content_tags?.map((ct: { tags: { name: string } }) => ct.tags?.name).filter(Boolean) || [],
      };
    });

    const exportData: ExportData = {
      exported_at: new Date().toISOString(),
      user_email: session.user.email || "",
      stats: {
        total_content: processedContent.length,
        videos: processedContent.filter((c) => c.type === "video").length,
        articles: processedContent.filter((c) => c.type === "article").length,
        books: processedContent.filter((c) => c.type === "book").length,
        lists: lists?.length || 0,
        tags: tags?.length || 0,
      },
      content: processedContent,
      lists: lists || [],
      tags: tags || [],
    };

    if (format === "json") {
      const filename = `kbase-export-${new Date().toISOString().split("T")[0]}.json`;
      return new NextResponse(JSON.stringify(exportData, null, 2), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Content-Disposition": `attachment; filename="${filename}"`,
        },
      });
    }

    // Formato CSV - solo contenido (las listas y tags van como columnas)
    const csvRows: string[] = [];

    // Header
    const headers = [
      "id",
      "type",
      "status",
      "title",
      "url",
      "description",
      "summary",
      "rating",
      "personal_notes",
      "created_at",
      "updated_at",
      "completed_at",
      "lists",
      "tags",
      "related_links",
    ];
    csvRows.push(headers.join(","));

    // Rows
    for (const item of processedContent) {
      const row = [
        escapeCSV(item.id),
        escapeCSV(item.type),
        escapeCSV(item.status),
        escapeCSV(item.title),
        escapeCSV(item.url || ""),
        escapeCSV(item.description || ""),
        escapeCSV(item.summary || ""),
        item.rating?.toString() || "",
        escapeCSV(item.personal_notes || ""),
        escapeCSV(item.created_at),
        escapeCSV(item.updated_at),
        escapeCSV(item.completed_at || ""),
        escapeCSV(item.lists.join("; ")),
        escapeCSV(item.tags.join("; ")),
        escapeCSV(item.related_links.map((l) => `${l.title}: ${l.url}`).join("; ")),
      ];
      csvRows.push(row.join(","));
    }

    const csvContent = csvRows.join("\n");
    const filename = `kbase-export-${new Date().toISOString().split("T")[0]}.csv`;

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("Error in GET /api/export:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

// Helper para escapar valores CSV
function escapeCSV(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
