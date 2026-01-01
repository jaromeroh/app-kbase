"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface FloatingActionButtonProps {
  href: string;
  label?: string;
  className?: string;
}

export function FloatingActionButton({
  href,
  label = "Agregar",
  className
}: FloatingActionButtonProps) {
  return (
    <Link
      href={href}
      title={label}
      className={cn(
        // Solo visible en mobile
        "md:hidden",
        // Posición fija
        "fixed bottom-6 right-6 z-50",
        // Tamaño y forma
        "h-14 w-14 rounded-full",
        // Colores y sombra
        "bg-primary text-primary-foreground shadow-lg",
        // Flex centrado
        "flex items-center justify-center",
        // Hover y transiciones
        "hover:bg-primary/90 hover:scale-105 active:scale-95",
        "transition-all duration-200",
        className
      )}
    >
      <Plus className="h-6 w-6" />
    </Link>
  );
}
