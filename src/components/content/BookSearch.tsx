"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { Search, Loader2, BookOpen, X } from "lucide-react";
import {
  Input,
  Button,
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui";
import { cn } from "@/lib/utils";
import type { BookSearchResult } from "@/app/api/books/route";

interface BookSearchProps {
  onSelect: (book: BookSearchResult) => void;
  disabled?: boolean;
  selectedBook?: { title: string; cover_image_url: string | null } | null;
  onClear?: () => void;
}

export function BookSearch({
  onSelect,
  disabled = false,
  selectedBook,
  onClear,
}: BookSearchProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState<BookSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Debounced search
  const performSearch = useCallback(async (query: string) => {
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }

    setIsSearching(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/books?q=${encodeURIComponent(query)}`
      );

      if (!response.ok) {
        throw new Error("Error al buscar libros");
      }

      const data = await response.json();
      setResults(data.results || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Debounce search
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (searchQuery.trim().length >= 2) {
      searchTimeoutRef.current = setTimeout(() => {
        performSearch(searchQuery);
      }, 300);
    } else {
      setResults([]);
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery, performSearch]);

  const handleSelect = (book: BookSearchResult) => {
    onSelect(book);
    setIsOpen(false);
    setSearchQuery("");
    setResults([]);
  };

  const handleClear = () => {
    if (onClear) {
      onClear();
    }
    setSearchQuery("");
    setResults([]);
  };

  // Si hay un libro seleccionado, mostrar la tarjeta del libro
  if (selectedBook) {
    return (
      <div className="flex items-center gap-3 p-3 border rounded-lg bg-muted/30">
        {/* Portada */}
        {selectedBook.cover_image_url ? (
          <img
            src={selectedBook.cover_image_url}
            alt={selectedBook.title}
            className="w-12 h-16 object-cover rounded shadow-sm flex-shrink-0"
          />
        ) : (
          <div className="w-12 h-16 bg-muted rounded flex items-center justify-center flex-shrink-0">
            <BookOpen className="w-6 h-6 text-muted-foreground" />
          </div>
        )}

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm truncate">{selectedBook.title}</p>
          <p className="text-xs text-muted-foreground">Libro seleccionado</p>
        </div>

        {/* Botón cambiar */}
        {!disabled && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="flex-shrink-0"
          >
            <X className="w-4 h-4 mr-1" />
            Cambiar
          </Button>
        )}
      </div>
    );
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          className="w-full justify-start text-left font-normal"
        >
          <Search className="w-4 h-4 mr-2 text-muted-foreground" />
          <span className="text-muted-foreground">
            Buscar libro en Google Books...
          </span>
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-96 p-0" align="start">
        {/* Campo de búsqueda */}
        <div className="p-3 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              ref={inputRef}
              type="text"
              placeholder="Título, autor o URL de Google Books..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-8"
              autoFocus
            />
            {isSearching && (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />
            )}
          </div>
        </div>

        {/* Resultados */}
        <div className="max-h-80 overflow-y-auto">
          {error && (
            <p className="text-sm text-red-500 p-4 text-center">{error}</p>
          )}

          {!error && searchQuery.length < 2 && (
            <p className="text-sm text-muted-foreground p-4 text-center">
              Escribe al menos 2 caracteres para buscar
            </p>
          )}

          {!error && searchQuery.length >= 2 && !isSearching && results.length === 0 && (
            <p className="text-sm text-muted-foreground p-4 text-center">
              No se encontraron libros
            </p>
          )}

          {results.length > 0 && (
            <div className="p-2 space-y-1">
              {results.map((book) => (
                <button
                  key={book.id}
                  type="button"
                  onClick={() => handleSelect(book)}
                  className={cn(
                    "w-full flex items-start gap-3 p-2 rounded-lg text-left transition-colors",
                    "hover:bg-muted"
                  )}
                >
                  {/* Portada */}
                  {book.cover_image_url ? (
                    <img
                      src={book.cover_image_url}
                      alt={book.title}
                      className="w-10 h-14 object-cover rounded shadow-sm flex-shrink-0"
                    />
                  ) : (
                    <div className="w-10 h-14 bg-muted rounded flex items-center justify-center flex-shrink-0">
                      <BookOpen className="w-5 h-5 text-muted-foreground" />
                    </div>
                  )}

                  {/* Info */}
                  <div className="flex-1 min-w-0 py-0.5">
                    <p className="font-medium text-sm line-clamp-2">
                      {book.title}
                    </p>
                    {book.author && (
                      <p className="text-xs text-muted-foreground truncate mt-0.5">
                        {book.author}
                      </p>
                    )}
                    {book.published_year && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {book.published_year}
                      </p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-2 border-t bg-muted/30">
          <p className="text-xs text-muted-foreground text-center">
            Puedes pegar una URL de Google Books para libros difíciles de encontrar
          </p>
        </div>
      </PopoverContent>
    </Popover>
  );
}
