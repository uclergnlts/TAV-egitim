/**
 * Kimlik Doğrulama Kütüphanesi
 * JWT tabanlı giriş/çıkış işlemleri
 */

import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { db, users, type User } from "@/lib/db";
import { eq } from "drizzle-orm";
import { compare } from "bcryptjs";

// JWT Secret anahtar (lazy evaluation for build time compatibility)
let _jwtSecret: Uint8Array | null = null;
const getJwtSecret = (): Uint8Array => {
    if (!_jwtSecret) {
        if (!process.env.JWT_SECRET && process.env.NODE_ENV === "production") {
            throw new Error("JWT_SECRET environment variable is required in production");
        }
        _jwtSecret = new TextEncoder().encode(
            process.env.JWT_SECRET || "fallback-secret-key-for-development-only"
        );
    }
    return _jwtSecret;
};

// Token geçerlilik süresi (24 saat)
const TOKEN_EXPIRATION = "24h";

// Cookie adı
const AUTH_COOKIE = "auth_token";

// ============================================
// Tip Tanımları
// ============================================

/** JWT Token içeriği */
export interface TokenPayload {
    userId: string;
    sicilNo: string;
    fullName: string;
    role: "CHEF" | "ADMIN";
}

/** Giriş sonucu */
export interface LoginResult {
    success: boolean;
    message: string;
    user?: {
        id: string;
        sicilNo: string;
        fullName: string;
        role: "CHEF" | "ADMIN";
    };
}

// ============================================
// Giriş / Çıkış İşlemleri
// ============================================

/**
 * Kullanıcı girişi yapar
 * Sicil ve şifre kontrolü sonrası JWT token oluşturur
 */
export async function login(
    sicilNo: string,
    password: string
): Promise<LoginResult> {
    try {
        // Kullanıcıyı veritabanında bul
        const user = await db.query.users.findFirst({
            where: eq(users.sicilNo, sicilNo),
        });

        if (!user) {
            return {
                success: false,
                message: "Sicil numarası veya şifre hatalı",
            };
        }

        // Hesap aktif mi kontrol et
        if (!user.isActive) {
            return {
                success: false,
                message: "Hesabınız pasif durumda. Yönetici ile iletişime geçin.",
            };
        }

        // Şifreyi doğrula
        const isValidPassword = await compare(password, user.passwordHash);

        if (!isValidPassword) {
            return {
                success: false,
                message: "Sicil numarası veya şifre hatalı",
            };
        }

        // JWT token oluştur
        const token = await createToken({
            userId: user.id,
            sicilNo: user.sicilNo,
            fullName: user.fullName,
            role: user.role,
        });

        // Token'ı cookie'ye kaydet
        const cookieStore = await cookies();
        cookieStore.set(AUTH_COOKIE, token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 60 * 60 * 24, // 24 saat
            path: "/",
        });

        return {
            success: true,
            message: "Giriş başarılı",
            user: {
                id: user.id,
                sicilNo: user.sicilNo,
                fullName: user.fullName,
                role: user.role,
            },
        };
    } catch {
        return {
            success: false,
            message: "Bir hata oluştu. Lütfen tekrar deneyin.",
        };
    }
}

/** Çıkış yapar, auth cookie'yi siler */
export async function logout(): Promise<void> {
    const cookieStore = await cookies();
    cookieStore.delete(AUTH_COOKIE);
}

// ============================================
// Token İşlemleri
// ============================================

/** JWT token oluşturur */
async function createToken(payload: TokenPayload): Promise<string> {
    return new SignJWT(payload as unknown as Record<string, unknown>)
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime(TOKEN_EXPIRATION)
        .sign(getJwtSecret());
}

/** JWT token doğrular, payload döner */
export async function verifyToken(
    token: string
): Promise<TokenPayload | null> {
    try {
        const { payload } = await jwtVerify(token, getJwtSecret());
        return payload as unknown as TokenPayload;
    } catch {
        return null;
    }
}

/** Mevcut oturumu kontrol eder */
export async function getSession(): Promise<TokenPayload | null> {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get(AUTH_COOKIE)?.value;

        if (!token) {
            return null;
        }

        return verifyToken(token);
    } catch {
        return null;
    }
}

// ============================================
// Yetki Kontrolleri
// ============================================

/**
 * Kullanıcının belirli role sahip olup olmadığını kontrol eder
 * ADMIN her role sahiptir
 */
export async function hasRole(
    requiredRole: "CHEF" | "ADMIN"
): Promise<boolean> {
    const session = await getSession();

    if (!session) {
        return false;
    }

    // ADMIN her işlemi yapabilir
    if (session.role === "ADMIN") {
        return true;
    }

    return session.role === requiredRole;
}

/** Sadece ADMIN yetkisi kontrolü */
export async function isAdmin(): Promise<boolean> {
    const session = await getSession();
    return session?.role === "ADMIN";
}

/** Sadece ŞEF yetkisi kontrolü */
export async function isChef(): Promise<boolean> {
    const session = await getSession();
    return session?.role === "CHEF";
}
