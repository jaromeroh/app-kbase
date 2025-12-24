import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { createClient } from "@/lib/supabase/server";
import { listSchema } from "@/lib/validators/list";
import { z } from "zod";

// GET - Listar listas del usuario
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const supabase = await createClient();

    const { data, error } = await supabase
      .from("lists")
      .select(
        `
        *,
        content_lists(count)
      `
      )
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching lists:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error in GET /api/lists:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

// POST - Crear nueva lista
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = listSchema.parse(body);

    const supabase = await createClient();

    const { data, error } = await supabase
      .from("lists")
      .insert({
        user_id: session.user.id,
        name: validatedData.name,
        description: validatedData.description || null,
        color: validatedData.color,
        icon: validatedData.icon,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating list:", error);
      return NextResponse.json(
        { error: "Error al crear la lista" },
        { status: 500 }
      );
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Datos inválidos", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Error in POST /api/lists:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
