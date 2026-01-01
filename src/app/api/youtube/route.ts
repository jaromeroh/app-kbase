import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";

interface NoembedResponse {
  title?: string;
  author_name?: string;
  author_url?: string;
  thumbnail_url?: string;
  provider_name?: string;
  error?: string;
}

// Extraer video ID de diferentes formatos de URL de YouTube
function extractYouTubeVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)([^&\n?#]+)/,
    /youtube\.com\/shorts\/([^&\n?#]+)/,
    /youtube\.com\/live\/([^&\n?#]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      return match[1];
    }
  }
  return null;
}

// Extraer descripción de la página de YouTube
async function fetchYouTubeDescription(videoId: string): Promise<string | null> {
  try {
    const response = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
      },
    });

    if (!response.ok) return null;

    const html = await response.text();

    // Buscar la descripción en el JSON embebido de YouTube
    const jsonMatch = html.match(/var ytInitialPlayerResponse\s*=\s*(\{[\s\S]+?\});/);
    if (jsonMatch) {
      try {
        const data = JSON.parse(jsonMatch[1]);
        const description = data?.videoDetails?.shortDescription;
        if (description) {
          // Limitar a 500 caracteres
          return description.length > 500
            ? description.substring(0, 500) + "..."
            : description;
        }
      } catch {
        // Ignorar errores de parsing
      }
    }

    // Fallback: buscar en meta tags
    const metaMatch = html.match(/<meta\s+name="description"\s+content="([^"]+)"/i);
    if (metaMatch) {
      return metaMatch[1];
    }

    return null;
  } catch {
    return null;
  }
}

// GET - Obtener metadatos de un video de YouTube
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const url = searchParams.get("url");

    if (!url) {
      return NextResponse.json(
        { error: "URL es requerida" },
        { status: 400 }
      );
    }

    // Validar que sea una URL de YouTube
    const videoId = extractYouTubeVideoId(url);
    if (!videoId) {
      return NextResponse.json(
        { error: "URL de YouTube inválida" },
        { status: 400 }
      );
    }

    // Convertir a URL canónica para noembed (no soporta /live/, /shorts/, etc.)
    const canonicalUrl = `https://www.youtube.com/watch?v=${videoId}`;

    // Obtener metadatos en paralelo
    const [noembedResponse, description] = await Promise.all([
      fetch(`https://noembed.com/embed?url=${encodeURIComponent(canonicalUrl)}`),
      fetchYouTubeDescription(videoId),
    ]);

    if (!noembedResponse.ok) {
      return NextResponse.json(
        { error: "Error al obtener metadatos del video" },
        { status: 500 }
      );
    }

    const data: NoembedResponse = await noembedResponse.json();

    if (data.error) {
      return NextResponse.json(
        { error: data.error },
        { status: 400 }
      );
    }

    // Construir respuesta con los metadatos
    const metadata = {
      title: data.title || null,
      description: description,
      channel_name: data.author_name || null,
      channel_url: data.author_url || null,
      thumbnail_url: data.thumbnail_url || `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
      video_id: videoId,
      // Duración no disponible sin YouTube Data API
      duration_minutes: null,
    };

    return NextResponse.json(metadata);
  } catch (error) {
    console.error("Error fetching YouTube metadata:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
