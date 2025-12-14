import Google from "next-auth/providers/google"
import GitHub from "next-auth/providers/github"
import type { NextAuthConfig } from "next-auth"

/**
 * Configuración base de Auth.js - Compatible con Edge Runtime
 * Este archivo NO incluye el adapter ni providers de email
 * Se usa en el middleware para verificación rápida
 *
 * NOTA: El provider Resend (Magic Link) se agrega solo en auth.ts
 * porque requiere adapter de base de datos
 */
export default {
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
      // Permitir vincular cuentas OAuth a usuarios existentes con el mismo email
      // Seguro para apps con whitelist donde confiamos en la verificación del proveedor
      allowDangerousEmailAccountLinking: true,
    }),
    GitHub({
      clientId: process.env.AUTH_GITHUB_ID,
      clientSecret: process.env.AUTH_GITHUB_SECRET,
      allowDangerousEmailAccountLinking: true,
    }),
  ],

  pages: {
    signIn: "/login",
    error: "/login",
  },

  callbacks: {
    /**
     * Callback de autorización - Usado por el middleware
     * Solo verifica si está autenticado, no hace llamadas a DB
     */
    authorized({ auth, request }) {
      const isAuthenticated = !!auth?.user
      const pathname = request.nextUrl.pathname

      // Rutas protegidas que requieren autenticación
      const protectedRoutes = ["/content", "/videos", "/articles", "/books", "/lists", "/settings"]
      const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route))

      if (isProtectedRoute) {
        return isAuthenticated
      }

      return true
    },
  },

  // Configuración de cookies para subdominios
  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === "production"
        ? "__Secure-authjs.session-token"
        : "authjs.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
        domain: process.env.NODE_ENV === "production"
          ? ".tonior.xyz"
          : undefined,
      },
    },
  },
} satisfies NextAuthConfig
