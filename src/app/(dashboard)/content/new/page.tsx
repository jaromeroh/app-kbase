import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { ContentForm } from "@/components/content/ContentForm";

interface NewContentPageProps {
  searchParams: Promise<{
    type?: string;
  }>;
}

export default async function NewContentPage({ searchParams }: NewContentPageProps) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const params = await searchParams;

  // Validar que el tipo sea válido
  const validTypes = ["video", "article", "book"] as const;
  const initialType = validTypes.includes(params.type as typeof validTypes[number])
    ? (params.type as "video" | "article" | "book")
    : undefined;

  const typeLabels: Record<string, string> = {
    video: "Video",
    article: "Artículo",
    book: "Libro",
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">
          {initialType ? `Agregar ${typeLabels[initialType]}` : "Agregar Contenido"}
        </h1>
        <p className="text-muted-foreground mt-1">
          {initialType
            ? `Agrega un nuevo ${typeLabels[initialType].toLowerCase()} a tu biblioteca`
            : "Agrega un nuevo video, artículo o libro a tu biblioteca"}
        </p>
      </div>

      <ContentForm initialType={initialType} />
    </div>
  );
}
