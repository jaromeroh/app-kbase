"use client";

import { useState } from "react";
import { Button, Input } from "@/components/ui";
import { Plus, X, Link as LinkIcon } from "lucide-react";

interface RelatedLink {
  title: string;
  url: string;
}

interface RelatedLinksInputProps {
  value: RelatedLink[];
  onChange: (links: RelatedLink[]) => void;
  maxLinks?: number;
  disabled?: boolean;
}

export function RelatedLinksInput({
  value = [],
  onChange,
  maxLinks = 20,
  disabled = false,
}: RelatedLinksInputProps) {
  const [newTitle, setNewTitle] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleAdd = () => {
    setError(null);

    if (!newTitle.trim()) {
      setError("El título es requerido");
      return;
    }

    if (!newUrl.trim()) {
      setError("La URL es requerida");
      return;
    }

    try {
      new URL(newUrl);
    } catch {
      setError("URL inválida");
      return;
    }

    if (value.length >= maxLinks) {
      setError(`Máximo ${maxLinks} links permitidos`);
      return;
    }

    onChange([...value, { title: newTitle.trim(), url: newUrl.trim() }]);
    setNewTitle("");
    setNewUrl("");
  };

  const handleRemove = (index: number) => {
    const newLinks = value.filter((_, i) => i !== index);
    onChange(newLinks);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAdd();
    }
  };

  return (
    <div className="space-y-3">
      {/* Lista de links existentes */}
      {value.length > 0 && (
        <div className="space-y-2">
          {value.map((link, index) => (
            <div
              key={index}
              className="flex items-center gap-2 p-2 bg-muted/50 rounded-md group"
            >
              <LinkIcon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{link.title}</p>
                <a
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-muted-foreground hover:text-primary truncate block"
                >
                  {link.url}
                </a>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => handleRemove(index)}
                disabled={disabled}
                className="opacity-0 group-hover:opacity-100 transition-opacity h-7 w-7 p-0"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Formulario para añadir nuevo link */}
      {value.length < maxLinks && (
        <div className="space-y-2">
          <div className="flex gap-2">
            <Input
              placeholder="Título del link"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={disabled}
              className="flex-1"
            />
            <Input
              placeholder="https://..."
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={disabled}
              className="flex-1"
            />
            <Button
              type="button"
              variant="outline"
              onClick={handleAdd}
              disabled={disabled || !newTitle.trim() || !newUrl.trim()}
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          {error && <p className="text-xs text-red-500">{error}</p>}
        </div>
      )}
    </div>
  );
}
