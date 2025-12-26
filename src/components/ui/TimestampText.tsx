"use client";

import { useMemo } from "react";
import { findTimestamps, getYouTubeUrlWithTime } from "@/lib/utils";

interface TimestampTextProps {
  text: string;
  videoUrl?: string | null;
  className?: string;
  /** Si se proporciona, los timestamps llamarán a esta función en lugar de abrir un enlace */
  onTimestampClick?: (seconds: number) => void;
}

/**
 * Componente que renderiza texto con timestamps clickeables
 * Los timestamps en formato (0:51), (1:01-2:31), etc. se convierten en enlaces
 * que abren el video en ese momento específico o llaman a onTimestampClick
 */
export function TimestampText({ text, videoUrl, className, onTimestampClick }: TimestampTextProps) {
  const parts = useMemo(() => {
    // Si no hay videoUrl ni onTimestampClick, no procesar timestamps
    if (!videoUrl && !onTimestampClick) {
      return [{ type: "text" as const, content: text }];
    }

    const timestamps = findTimestamps(text);
    if (timestamps.length === 0) {
      return [{ type: "text" as const, content: text }];
    }

    const result: Array<
      | { type: "text"; content: string }
      | { type: "timestamp"; content: string; url: string; seconds: number }
    > = [];

    let lastIndex = 0;

    for (const ts of timestamps) {
      // Añadir texto antes del timestamp
      if (ts.index > lastIndex) {
        result.push({
          type: "text",
          content: text.slice(lastIndex, ts.index),
        });
      }

      // Añadir el timestamp como enlace
      result.push({
        type: "timestamp",
        content: ts.match,
        url: videoUrl ? getYouTubeUrlWithTime(videoUrl, ts.seconds) : "#",
        seconds: ts.seconds,
      });

      lastIndex = ts.index + ts.match.length;
    }

    // Añadir texto restante después del último timestamp
    if (lastIndex < text.length) {
      result.push({
        type: "text",
        content: text.slice(lastIndex),
      });
    }

    return result;
  }, [text, videoUrl, onTimestampClick]);

  return (
    <span className={className}>
      {parts.map((part, index) => {
        if (part.type === "text") {
          return <span key={index}>{part.content}</span>;
        }

        // Si hay onTimestampClick, usar botón en lugar de enlace
        if (onTimestampClick) {
          return (
            <button
              key={index}
              onClick={() => onTimestampClick(part.seconds)}
              className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
              title={`Ir a ${part.content.slice(1, -1)} en el video`}
            >
              {part.content}
            </button>
          );
        }

        return (
          <a
            key={index}
            href={part.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
            title={`Ir a ${part.content.slice(1, -1)} en el video`}
          >
            {part.content}
          </a>
        );
      })}
    </span>
  );
}
