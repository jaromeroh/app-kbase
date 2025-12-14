import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { ContentForm } from "@/components/content/ContentForm";

export default async function NewContentPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Agregar Contenido</h1>
        <p className="text-muted-foreground mt-1">
          Agrega un nuevo video, artículo o libro a tu biblioteca
        </p>
      </div>

      <ContentForm />
    </div>
  );
}
