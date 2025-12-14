import NextAuth from "next-auth"
import Resend from "next-auth/providers/resend"
import { SupabaseAdapter } from "@auth/supabase-adapter"
import authConfig from "./auth.config"

// Extender tipos de NextAuth
declare module "next-auth" {
  interface Session {
    user: {
      id?: string
      name?: string | null
      email?: string | null
      image?: string | null
      role?: "admin" | "viewer"
    }
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    role?: "admin" | "viewer"
  }
}

/**
 * Configuración completa de Auth.js con adapter de Supabase
 * Este archivo incluye la conexión a base de datos
 * NO se usa en el middleware (Edge Runtime)
 */
export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: SupabaseAdapter({
    url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    secret: process.env.SUPABASE_SERVICE_ROLE_KEY!,
  }),

  // Combinar providers de la config base + Resend (requiere adapter)
  providers: [
    ...authConfig.providers,
    Resend({
      apiKey: process.env.AUTH_RESEND_KEY,
      from: "noreply@tonior.xyz",
    }),
  ],

  // Heredar pages de la config base
  pages: authConfig.pages,

  // JWT strategy permite usar el adapter solo para verificación de email
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 días
  },

  callbacks: {
    // Heredar el callback authorized de la config base
    ...authConfig.callbacks,

    /**
     * Callback de inicio de sesión
     * Verifica si el usuario está en la whitelist
     */
    async signIn({ user }) {
      if (!user.email) {
        return false
      }

      // Verificar whitelist usando fetch directo
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/authorized_users?email=eq.${encodeURIComponent(user.email)}&select=email`,
        {
          headers: {
            apikey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
            Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}`,
          },
        }
      )

      const data = await response.json()
      return Array.isArray(data) && data.length > 0
    },

    /**
     * Callback JWT - Persiste el rol en el token
     */
    async jwt({ token, user }) {
      if (user?.email) {
        // Obtener rol del usuario
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/authorized_users?email=eq.${encodeURIComponent(user.email)}&select=role`,
          {
            headers: {
              apikey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
              Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}`,
            },
          }
        )

        const data = await response.json()
        token.role = data?.[0]?.role || "viewer"
      }
      return token
    },

    /**
     * Callback de sesión - Pasa datos del token a la sesión
     */
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub as string
        session.user.role = token.role as "admin" | "viewer"
      }
      return session
    },
  },

  // Heredar cookies de la config base
  cookies: authConfig.cookies,
})
