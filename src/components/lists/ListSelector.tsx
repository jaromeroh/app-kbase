"use client";

import { useState, useEffect, useMemo } from "react";
import { Check, FolderOpen, Loader2, Plus, X, Search } from "lucide-react";
import {
  Button,
  Badge,
  Input,
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui";
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
  const [searchQuery, setSearchQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);

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

  // Listas seleccionadas con sus datos completos
  const selectedLists = useMemo(() => {
    return lists.filter((list) => value.includes(list.id));
  }, [lists, value]);

  // Listas filtradas por búsqueda
  const filteredLists = useMemo(() => {
    if (!searchQuery.trim()) return lists;
    const query = searchQuery.toLowerCase();
    return lists.filter(
      (list) =>
        list.name.toLowerCase().includes(query) ||
        list.description?.toLowerCase().includes(query)
    );
  }, [lists, searchQuery]);

  const toggleList = (listId: string) => {
    if (disabled) return;

    if (value.includes(listId)) {
      onChange(value.filter((id) => id !== listId));
    } else {
      onChange([...value, listId]);
    }
  };

  const removeList = (listId: string) => {
    if (disabled) return;
    onChange(value.filter((id) => id !== listId));
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
    return <p className="text-sm text-red-500">{error}</p>;
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
      {/* Chips de listas seleccionadas + botón añadir */}
      <div className="flex flex-wrap items-center gap-2 min-h-[36px]">
        {selectedLists.map((list) => (
          <Badge
            key={list.id}
            variant="secondary"
            className="flex items-center gap-1.5 pl-2 pr-1 py-1"
            style={{
              backgroundColor: `${list.color}20`,
              borderColor: list.color,
              borderWidth: 1,
            }}
          >
            <FolderOpen
              className="w-3 h-3 flex-shrink-0"
              style={{ color: list.color }}
            />
            <span className="text-xs font-medium">{list.name}</span>
            {!disabled && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removeList(list.id);
                }}
                className="ml-0.5 p-0.5 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
                title={`Quitar de ${list.name}`}
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </Badge>
        ))}

        {/* Botón para abrir popover */}
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={disabled}
              className="h-7 text-xs gap-1"
            >
              <Plus className="w-3 h-3" />
              {selectedLists.length === 0 ? "Añadir a lista" : "Añadir"}
            </Button>
          </PopoverTrigger>

          <PopoverContent className="w-72 p-0" align="start">
            {/* Búsqueda */}
            <div className="p-2 border-b">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Buscar lista..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 h-8 text-sm"
                  autoFocus
                />
              </div>
            </div>

            {/* Lista de opciones */}
            <div className="max-h-60 overflow-y-auto p-1">
              {filteredLists.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No se encontraron listas
                </p>
              ) : (
                filteredLists.map((list) => {
                  const isSelected = value.includes(list.id);

                  return (
                    <button
                      key={list.id}
                      type="button"
                      onClick={() => toggleList(list.id)}
                      className={cn(
                        "w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-left transition-colors",
                        "hover:bg-muted",
                        isSelected && "bg-muted"
                      )}
                    >
                      {/* Checkbox visual */}
                      <div
                        className={cn(
                          "w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-colors",
                          isSelected
                            ? "bg-primary border-primary text-primary-foreground"
                            : "border-muted-foreground/30"
                        )}
                      >
                        {isSelected && <Check className="w-3 h-3" />}
                      </div>

                      {/* Icono de lista */}
                      <div
                        className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: `${list.color}20` }}
                      >
                        <FolderOpen
                          className="w-3 h-3"
                          style={{ color: list.color }}
                        />
                      </div>

                      {/* Nombre */}
                      <span className="text-sm truncate flex-1">{list.name}</span>
                    </button>
                  );
                })
              )}
            </div>

            {/* Footer con link a crear lista */}
            <div className="p-2 border-t">
              <a
                href="/lists"
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Gestionar listas →
              </a>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Texto de ayuda cuando no hay selección */}
      {selectedLists.length === 0 && (
        <p className="text-xs text-muted-foreground">
          Opcional: asigna este contenido a una o más listas
        </p>
      )}
    </div>
  );
}
