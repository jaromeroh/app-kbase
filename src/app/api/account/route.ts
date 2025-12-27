import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { createClient } from "@/lib/supabase/server";

// DELETE - Eliminar cuenta y todos los datos del usuario
export async function DELETE() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const userId = session.user.id;
    const supabase = await createClient();

    // Primero obtener todos los IDs de contenido del usuario
    const { data: userContents } = await supabase
      .from("content")
      .select("id")
      .eq("user_id", userId);

    const contentIds = userContents?.map((c) => c.id) || [];

    // Eliminar en orden para respetar foreign keys
    if (contentIds.length > 0) {
      // 1. Eliminar relaciones de contenido (content_lists, content_tags)
      const { error: contentListsError } = await supabase
        .from("content_lists")
        .delete()
        .in("content_id", contentIds);

      if (contentListsError) {
        console.error("Error deleting content_lists:", contentListsError);
      }

      const { error: contentTagsError } = await supabase
        .from("content_tags")
        .delete()
        .in("content_id", contentIds);

      if (contentTagsError) {
        console.error("Error deleting content_tags:", contentTagsError);
      }

      // 2. Eliminar metadata (video, article, book)
      const { error: videoMetaError } = await supabase
        .from("video_metadata")
        .delete()
        .in("content_id", contentIds);

      if (videoMetaError) {
        console.error("Error deleting video_metadata:", videoMetaError);
      }

      const { error: articleMetaError } = await supabase
        .from("article_metadata")
        .delete()
        .in("content_id", contentIds);

      if (articleMetaError) {
        console.error("Error deleting article_metadata:", articleMetaError);
      }

      const { error: bookMetaError } = await supabase
        .from("book_metadata")
        .delete()
        .in("content_id", contentIds);

      if (bookMetaError) {
        console.error("Error deleting book_metadata:", bookMetaError);
      }
    }

    // 3. Eliminar contenidos
    const { error: contentsError } = await supabase
      .from("content")
      .delete()
      .eq("user_id", userId);

    if (contentsError) {
      console.error("Error deleting contents:", contentsError);
      return NextResponse.json(
        { error: "Error al eliminar contenidos" },
        { status: 500 }
      );
    }

    // 4. Eliminar listas
    const { error: listsError } = await supabase
      .from("lists")
      .delete()
      .eq("user_id", userId);

    if (listsError) {
      console.error("Error deleting lists:", listsError);
    }

    // 5. Eliminar tags
    const { error: tagsError } = await supabase
      .from("tags")
      .delete()
      .eq("user_id", userId);

    if (tagsError) {
      console.error("Error deleting tags:", tagsError);
    }

    // 6. Eliminar preferencias
    const { error: prefsError } = await supabase
      .from("user_preferences")
      .delete()
      .eq("user_id", userId);

    if (prefsError) {
      console.error("Error deleting preferences:", prefsError);
    }

    // 7. Eliminar usuario de la tabla users
    const { error: userError } = await supabase
      .from("users")
      .delete()
      .eq("id", userId);

    if (userError) {
      console.error("Error deleting user:", userError);
      return NextResponse.json(
        { error: "Error al eliminar usuario" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Cuenta eliminada correctamente"
    });
  } catch (error) {
    console.error("Error in DELETE /api/account:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
