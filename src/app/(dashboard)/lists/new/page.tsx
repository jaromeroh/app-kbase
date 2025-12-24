import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui";
import { ListForm } from "@/components/lists/ListForm";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default async function NewListPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Link
        href="/lists"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Volver a listas
      </Link>

      <Card>
        <CardHeader>
          <CardTitle>Nueva Lista</CardTitle>
          <CardDescription>
            Crea una lista para organizar tu contenido por temas o categorías.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ListForm />
        </CardContent>
      </Card>
    </div>
  );
}
