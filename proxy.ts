import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { checkRateLimit, getClientIP, RateLimitPresets } from "./lib/rateLimit";

// JWT secret anahtar (build sırasında patlamaması için lazy evaluation)
let jwtSecretCache: Uint8Array | null = null;
const getJwtSecret = (): Uint8Array => {
  if (!jwtSecretCache) {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error("JWT_SECRET environment variable is required. Set it in .env file.");
    }
    jwtSecretCache = new TextEncoder().encode(secret);
  }

  return jwtSecretCache;
};

// Korumasız rotalar (herkes erişebilir)
const publicRoutes = ["/", "/login", "/api/auth/login", "/api/health", "/api/heartbeat"];

// Sadece ADMIN erişebilir
const adminOnlyRoutes = ["/admin", "/api/reports", "/api/export", "/api/personnel/import"];

// Sadece CHEF erişebilir
const chefOnlyRoutes = ["/chef"];

// Rate limit uygulanacak route'lar
const rateLimitedRoutes = [
  { path: "/api/auth/login", config: RateLimitPresets.strict },
  { path: "/api/import", config: RateLimitPresets.export },
  { path: "/api/reports", config: RateLimitPresets.export },
  { path: "/api/", config: RateLimitPresets.standard },
];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public route kontrolü
  if (publicRoutes.some((route) => pathname === route || pathname.startsWith("/api/auth/"))) {
    return NextResponse.next();
  }

  // Rate limiting kontrolü (sadece API route'ları için)
  if (pathname.startsWith("/api/")) {
    const clientIP = getClientIP(request);
    const rateLimitConfig =
      rateLimitedRoutes.find((r) => pathname.startsWith(r.path))?.config || RateLimitPresets.standard;

    const rateLimitResult = checkRateLimit(`api:${clientIP}:${pathname}`, rateLimitConfig);

    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        {
          success: false,
          message: "Çok fazla istek gönderdiniz. Lütfen bir süre bekleyin.",
        },
        {
          status: 429,
          headers: {
            "X-RateLimit-Limit": rateLimitResult.limit.toString(),
            "X-RateLimit-Remaining": rateLimitResult.remaining.toString(),
            "X-RateLimit-Reset": new Date(rateLimitResult.resetTime).toISOString(),
          },
        }
      );
    }
  }

  // Token kontrolü
  const token = request.cookies.get("auth_token")?.value;

  if (!token) {
    // API istekleri için 401
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ success: false, message: "Oturum açmanız gerekiyor" }, { status: 401 });
    }

    // Sayfa istekleri için login'e yönlendir
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Token doğrulama
  try {
    const { payload } = await jwtVerify(token, getJwtSecret());
    const userRole = payload.role as string;

    // ADMIN rotaları kontrolü
    if (adminOnlyRoutes.some((route) => pathname.startsWith(route))) {
      if (userRole !== "ADMIN") {
        if (pathname.startsWith("/api/")) {
          return NextResponse.json({ success: false, message: "Bu işlem için yetkiniz yok" }, { status: 403 });
        }

        return NextResponse.redirect(new URL("/chef", request.url));
      }
    }

    // CHEF rotaları kontrolü
    if (chefOnlyRoutes.some((route) => pathname.startsWith(route))) {
      if (userRole !== "CHEF" && userRole !== "ADMIN") {
        if (pathname.startsWith("/api/")) {
          return NextResponse.json({ success: false, message: "Bu işlem için yetkiniz yok" }, { status: 403 });
        }

        return NextResponse.redirect(new URL("/login", request.url));
      }
    }

    return NextResponse.next();
  } catch {
    // Geçersiz token: cookie'yi sil ve login'e yönlendir
    const response = pathname.startsWith("/api/")
      ? NextResponse.json({ success: false, message: "Oturum süresi dolmuş" }, { status: 401 })
      : NextResponse.redirect(new URL("/login", request.url));

    response.cookies.delete("auth_token");
    return response;
  }
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\..*|public).*)",
  ],
};
