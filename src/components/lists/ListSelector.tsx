"use client";

import { useState, useEffect } from "react";
import { Check, FolderOpen, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface List {
  id: string;
  name: string;
  color: string;
  description: string | null;
}

interface ListSelectorProps {
  value: string[];
  onChange: (listIds: string[]) => void;
  disabled?: boolean;
}

export function ListSelector({ value = [], onChange, disabled = false }: ListSelectorProps) {
  const [lists, setLists] = useState<List[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLists = async () => {
      try {
        const response = await fetch("/api/lists");
        if (!response.ok) throw new Error("Error al cargar listas");
        const data = await response.json();
        setLists(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error desconocido");
      } finally {
        setIsLoading(false);
      }
    };

    fetchLists();
  }, []);

  const toggleList = (listId: string) => {
    if (disabled) return;

    if (value.includes(listId)) {
      onChange(value.filter((id) => id !== listId));
    } else {
      onChange([...value, listId]);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
        <Loader2 className="w-4 h-4 animate-spin" />
        Cargando listas...
      </div>
    );
  }

  if (error) {
    return (
      <p className="text-sm text-red-500">{error}</p>
    );
  }

  if (lists.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-2">
        No tienes listas creadas.{" "}
        <a href="/lists/new" className="text-primary hover:underline">
          Crear una lista
        </a>
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {lists.map((list) => {
        const isSelected = value.includes(list.id);

        return (
          <button
            key={list.id}
            type="button"
            onClick={() => toggleList(list.id)}
            disabled={disabled}
            className={cn(
              "w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-all text-left",
              isSelected
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/50",
              disabled && "opacity-50 cursor-not-allowed"
            )}
          >
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: `${list.color}20` }}
            >
              <FolderOpen
                className="w-4 h-4"
                style={{ color: list.color }}
              />
            </div>

            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{list.name}</p>
              {list.description && (
                <p className="text-xs text-muted-foreground truncate">
                  {list.description}
                </p>
              )}
            </div>

            <div
              className={cn(
                "w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors",
                isSelected
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-muted-foreground/30"
              )}
            >
              {isSelected && <Check className="w-3 h-3" />}
            </div>
          </button>
        );
      })}
    </div>
  );
}
