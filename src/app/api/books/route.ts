import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";

interface GoogleBooksVolume {
  id: string;
  volumeInfo: {
    title?: string;
    authors?: string[];
    publisher?: string;
    publishedDate?: string;
    description?: string;
    industryIdentifiers?: Array<{
      type: string;
      identifier: string;
    }>;
    pageCount?: number;
    imageLinks?: {
      thumbnail?: string;
      smallThumbnail?: string;
    };
  };
}

interface GoogleBooksResponse {
  totalItems: number;
  items?: GoogleBooksVolume[];
}

export interface BookSearchResult {
  id: string;
  title: string;
  author: string | null;
  publisher: string | null;
  description: string | null;
  isbn: string | null;
  page_count: number | null;
  published_year: number | null;
  cover_image_url: string | null;
}

/**
 * Limpia el HTML de la descripción de Google Books
 */
function cleanDescription(html: string | undefined): string | null {
  if (!html) return null;

  return html
    // Reemplazar tags de párrafo con saltos de línea
    .replace(/<\/p>\s*<p>/gi, "\n\n")
    .replace(/<br\s*\/?>/gi, "\n")
    // Eliminar todos los demás tags HTML
    .replace(/<[^>]+>/g, "")
    // Decodificar entidades HTML comunes
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    // Limpiar espacios extra
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/**
 * Mejora la URL de la imagen de Google Books para obtener mejor resolución
 */
function improveImageUrl(url: string | undefined): string | null {
  if (!url) return null;

  // Google Books usa zoom=1 por defecto, cambiamos a zoom=0 para mejor calidad
  // También quitamos el borde (edge=curl)
  return url
    .replace("zoom=1", "zoom=0")
    .replace("&edge=curl", "")
    .replace("http://", "https://");
}

/**
 * Procesa un resultado de Google Books a nuestro formato
 */
function processBookResult(book: GoogleBooksVolume): BookSearchResult {
  const info = book.volumeInfo;

  // Extraer ISBN-13 o ISBN-10
  let isbn: string | null = null;
  if (info.industryIdentifiers) {
    const isbn13 = info.industryIdentifiers.find(id => id.type === "ISBN_13");
    const isbn10 = info.industryIdentifiers.find(id => id.type === "ISBN_10");
    isbn = isbn13?.identifier || isbn10?.identifier || null;
  }

  // Extraer año de publicación
  let publishedYear: number | null = null;
  if (info.publishedDate) {
    const yearMatch = info.publishedDate.match(/(\d{4})/);
    if (yearMatch) {
      publishedYear = parseInt(yearMatch[1], 10);
    }
  }

  return {
    id: book.id,
    title: info.title || "Sin título",
    author: info.authors?.join(", ") || null,
    publisher: info.publisher || null,
    description: cleanDescription(info.description),
    isbn: isbn,
    page_count: info.pageCount || null,
    published_year: publishedYear,
    cover_image_url: improveImageUrl(info.imageLinks?.thumbnail),
  };
}

/**
 * Extrae el ID de libro de una URL de Google Books
 * Soporta formatos:
 * - books.google.com/books?id=XXXXX
 * - books.google.com/books/about/Title.html?id=XXXXX
 */
function extractGoogleBooksId(input: string): string | null {
  const patterns = [
    /books\.google\.[^/]+\/books(?:\/about)?[^?]*\?.*id=([a-zA-Z0-9_-]+)/,
    /^[a-zA-Z0-9_-]{12}$/, // ID directo (12 caracteres)
  ];

  for (const pattern of patterns) {
    const match = input.match(pattern);
    if (match) return match[1] || match[0];
  }

  return null;
}

// GET - Buscar libros en Google Books
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");
    const bookId = searchParams.get("id");

    // Búsqueda por ID específico
    if (bookId) {
      const response = await fetch(
        `https://www.googleapis.com/books/v1/volumes/${bookId}`
      );

      if (!response.ok) {
        return NextResponse.json(
          { error: "Libro no encontrado" },
          { status: 404 }
        );
      }

      const book: GoogleBooksVolume = await response.json();
      return NextResponse.json({ results: [processBookResult(book)] });
    }

    if (!query || query.trim().length < 2) {
      return NextResponse.json(
        { error: "Se requiere un término de búsqueda de al menos 2 caracteres" },
        { status: 400 }
      );
    }

    // Detectar si es una URL de Google Books
    const extractedId = extractGoogleBooksId(query);
    if (extractedId) {
      const response = await fetch(
        `https://www.googleapis.com/books/v1/volumes/${extractedId}`
      );

      if (response.ok) {
        const book: GoogleBooksVolume = await response.json();
        return NextResponse.json({ results: [processBookResult(book)] });
      }
    }

    // Buscar en Google Books API (máximo 10 resultados)
    const googleBooksUrl = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=10&printType=books`;

    const response = await fetch(googleBooksUrl);

    if (!response.ok) {
      return NextResponse.json(
        { error: "Error al buscar en Google Books" },
        { status: 500 }
      );
    }

    const data: GoogleBooksResponse = await response.json();

    if (!data.items || data.items.length === 0) {
      return NextResponse.json({ results: [] });
    }

    // Procesar todos los resultados
    const results = data.items.map(processBookResult);

    return NextResponse.json({ results });
  } catch (error) {
    console.error("Error searching books:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
