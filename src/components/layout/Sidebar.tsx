"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Video,
  FileText,
  BookOpen,
  FolderOpen,
  Settings,
  ListTodo,
} from "lucide-react";
import { ThemeToggle } from "@/components/ui";

const navItems = [
  { href: "/content", icon: FolderOpen, label: "Todo el Contenido" },
  { href: "/videos", icon: Video, label: "Videos" },
  { href: "/articles", icon: FileText, label: "Artículos" },
  { href: "/books", icon: BookOpen, label: "Libros" },
  { href: "/lists", icon: ListTodo, label: "Mis Listas" },
];

interface SidebarContentProps {
  onNavigate?: () => void;
}

// Contenido reutilizable del sidebar (para desktop y mobile drawer)
export function SidebarContent({ onNavigate }: SidebarContentProps) {
  const pathname = usePathname();

  return (
    <>
      {/* Logo */}
      <div className="p-4 border-b border-border">
        <Link href="/content" className="block" onClick={onNavigate}>
          <span className="font-semibold text-xl">Knowledge Base</span>
        </Link>
      </div>

      {/* Navegacion */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/content" && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md transition-colors text-sm",
                isActive
                  ? "bg-muted text-foreground font-medium"
                  : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
              )}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-border space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Tema</span>
          <ThemeToggle />
        </div>
        <Link
          href="/settings"
          onClick={onNavigate}
          className="flex items-center gap-2 px-3 py-2 rounded-md text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          <Settings className="w-4 h-4" />
          Configuración
        </Link>
      </div>
    </>
  );
}

// Sidebar desktop (oculto en móvil)
export function Sidebar() {
  return (
    <aside className="hidden md:flex w-64 h-screen bg-surface border-r border-border flex-col">
      <SidebarContent />
    </aside>
  );
}
