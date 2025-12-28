"use client";

import { useSession, signOut } from "next-auth/react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui";
import { LogOut, User, Menu } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

interface HeaderProps {
  onMenuClick?: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const { data: session } = useSession();
  const [displayName, setDisplayName] = useState<string | null>(null);

  // Obtener el nombre personalizado de las preferencias
  useEffect(() => {
    if (session?.user) {
      fetch("/api/settings")
        .then((res) => res.ok ? res.json() : null)
        .then((prefs) => {
          if (prefs?.display_name) {
            setDisplayName(prefs.display_name);
          }
        })
        .catch(() => {});
    }
  }, [session]);

  const userName = displayName || session?.user?.name || "Usuario";

  return (
    <header className="h-14 md:h-16 border-b border-border bg-surface px-4 md:px-6 flex items-center justify-between">
      {/* Lado izquierdo: Hamburger (móvil) + Logo (móvil) */}
      <div className="flex items-center gap-3">
        {/* Hamburger button - solo móvil */}
        <button
          onClick={onMenuClick}
          className="md:hidden p-2 -ml-2 rounded-md hover:bg-muted transition-colors"
          aria-label="Abrir menú"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Logo - solo móvil (en desktop está en sidebar) */}
        <Link href="/content" className="md:hidden">
          <span className="font-semibold text-lg">KBase</span>
        </Link>
      </div>

      {/* Lado derecho: User menu */}
      <div className="flex items-center gap-2 md:gap-4">
        {session?.user && (
          <>
            <div className="flex items-center gap-2 md:gap-3">
              {session.user.image ? (
                <Image
                  src={session.user.image}
                  alt={userName}
                  width={32}
                  height={32}
                  className="rounded-full w-8 h-8"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                  <User className="w-4 h-4 text-muted-foreground" />
                </div>
              )}
              <div>
                <p className="text-sm font-medium">{userName}</p>
                <p className="text-xs text-muted-foreground hidden sm:block">
                  {session.user.email}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="p-2"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </>
        )}
      </div>
    </header>
  );
}
