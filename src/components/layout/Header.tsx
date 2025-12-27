"use client";

import { useSession, signOut } from "next-auth/react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui";
import { LogOut, User } from "lucide-react";
import Image from "next/image";

export function Header() {
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
    <header className="h-16 border-b border-border bg-surface px-6 flex items-center justify-between">
      {/* Search placeholder - se puede expandir después */}
      <div className="flex-1" />

      {/* User menu */}
      <div className="flex items-center gap-4">
        {session?.user && (
          <>
            <div className="flex items-center gap-3">
              {session.user.image ? (
                <Image
                  src={session.user.image}
                  alt={userName}
                  width={32}
                  height={32}
                  className="rounded-full"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                  <User className="w-4 h-4 text-muted-foreground" />
                </div>
              )}
              <div className="hidden sm:block">
                <p className="text-sm font-medium">{userName}</p>
                <p className="text-xs text-muted-foreground">
                  {session.user.email}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => signOut({ callbackUrl: "/login" })}
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </>
        )}
      </div>
    </header>
  );
}
