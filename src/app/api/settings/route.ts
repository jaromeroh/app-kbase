import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { createClient } from "@/lib/supabase/server";
import { userPreferencesSchema } from "@/lib/validators/preferences";
import { z } from "zod";
import type { UserPreferences } from "@/types";

// Valores por defecto para nuevos usuarios
const DEFAULT_PREFERENCES = {
  display_name: null,
  default_view: "list" as const,
  default_sort: "created_at" as const,
  default_sort_order: "desc" as const,
  items_per_page: 20 as const,
};

// GET - Obtener preferencias del usuario (crear si no existen)
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const supabase = await createClient();

    // Intentar obtener preferencias existentes
    const { data, error } = await supabase
      .from("user_preferences")
      .select("*")
      .eq("user_id", session.user.id)
      .single();

    if (error && error.code !== "PGRST116") {
      // PGRST116 = no rows returned
      console.error("Error fetching preferences:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Si no existen preferencias, crear registro con valores por defecto
    if (!data) {
      const { data: newData, error: insertError } = await supabase
        .from("user_preferences")
        .insert({
          user_id: session.user.id,
          ...DEFAULT_PREFERENCES,
        })
        .select()
        .single();

      if (insertError) {
        console.error("Error creating preferences:", insertError);
        return NextResponse.json(
          { error: "Error al crear preferencias" },
          { status: 500 }
        );
      }

      return NextResponse.json(newData);
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error in GET /api/settings:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

// PUT - Actualizar preferencias del usuario
export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = userPreferencesSchema.parse(body);

    const supabase = await createClient();

    // Verificar si existen preferencias
    const { data: existing } = await supabase
      .from("user_preferences")
      .select("id")
      .eq("user_id", session.user.id)
      .single();

    let result: UserPreferences;

    if (existing) {
      // Actualizar preferencias existentes
      const { data, error } = await supabase
        .from("user_preferences")
        .update({
          ...validatedData,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", session.user.id)
        .select()
        .single();

      if (error) {
        console.error("Error updating preferences:", error);
        return NextResponse.json(
          { error: "Error al actualizar preferencias" },
          { status: 500 }
        );
      }

      result = data;
    } else {
      // Crear nuevas preferencias
      const { data, error } = await supabase
        .from("user_preferences")
        .insert({
          user_id: session.user.id,
          ...DEFAULT_PREFERENCES,
          ...validatedData,
        })
        .select()
        .single();

      if (error) {
        console.error("Error creating preferences:", error);
        return NextResponse.json(
          { error: "Error al crear preferencias" },
          { status: 500 }
        );
      }

      result = data;
    }

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Datos inválidos", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Error in PUT /api/settings:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
