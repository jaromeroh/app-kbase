import NextAuth from "next-auth"
import authConfig from "./auth.config"

/**
 * Middleware de autenticación - Compatible con Edge Runtime
 * Usa la configuración base SIN adapter de base de datos
 * El callback 'authorized' en auth.config.ts maneja la lógica
 */
export const { auth: middleware } = NextAuth(authConfig)

export const config = {
  matcher: [
    "/content/:path*",
    "/videos/:path*",
    "/articles/:path*",
    "/books/:path*",
    "/lists/:path*",
    "/settings/:path*",
    "/login",
  ],
}
