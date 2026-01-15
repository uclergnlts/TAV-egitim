/**
 * Next.js Middleware
 * Rol bazlı yetkilendirme ve route koruması
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(
    process.env.JWT_SECRET || "fallback-secret-key-for-development-only"
);

// Korumasız rotalar (herkes erişebilir)
const publicRoutes = ["/", "/login", "/api/auth/login"];

// Sadece ADMIN erişebilir
const adminOnlyRoutes = [
    "/admin",
    "/api/reports",
    "/api/export",
    "/api/personnel/import",
];

// Sadece CHEF erişebilir
const chefOnlyRoutes = ["/chef"];

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Public route kontrolü
    if (publicRoutes.some((route) => pathname === route || pathname.startsWith("/api/auth/"))) {
        return NextResponse.next();
    }

    // Token kontrolü
    const token = request.cookies.get("auth_token")?.value;

    if (!token) {
        // API istekleri için 401
        if (pathname.startsWith("/api/")) {
            return NextResponse.json(
                { success: false, message: "Oturum açmanız gerekiyor" },
                { status: 401 }
            );
        }
        // Sayfa istekleri için login'e yönlendir
        return NextResponse.redirect(new URL("/login", request.url));
    }

    // Token doğrulama
    try {
        const { payload } = await jwtVerify(token, JWT_SECRET);
        const userRole = payload.role as string;

        // ADMIN rotaları kontrolü
        if (adminOnlyRoutes.some((route) => pathname.startsWith(route))) {
            if (userRole !== "ADMIN") {
                if (pathname.startsWith("/api/")) {
                    return NextResponse.json(
                        { success: false, message: "Bu işlem için yetkiniz yok" },
                        { status: 403 }
                    );
                }
                return NextResponse.redirect(new URL("/chef", request.url));
            }
        }

        // CHEF rotaları kontrolü
        if (chefOnlyRoutes.some((route) => pathname.startsWith(route))) {
            if (userRole !== "CHEF" && userRole !== "ADMIN") {
                if (pathname.startsWith("/api/")) {
                    return NextResponse.json(
                        { success: false, message: "Bu işlem için yetkiniz yok" },
                        { status: 403 }
                    );
                }
                return NextResponse.redirect(new URL("/login", request.url));
            }
        }

        return NextResponse.next();
    } catch {
        // Geçersiz token - cookie'yi sil ve login'e yönlendir
        const response = pathname.startsWith("/api/")
            ? NextResponse.json(
                { success: false, message: "Oturum süresi dolmuş" },
                { status: 401 }
            )
            : NextResponse.redirect(new URL("/login", request.url));

        response.cookies.delete("auth_token");
        return response;
    }
}

export const config = {
    matcher: [
        /*
         * Match all request paths except:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public files
         */
        "/((?!_next/static|_next/image|favicon.ico|.*\\..*|public).*)",
    ],
};
