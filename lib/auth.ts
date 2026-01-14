/**
 * Authentication Library
 * JWT tabanlı kimlik doğrulama
 * Referans: 04-ACCESS-CONTROL.md, 16-PERMISSION-MATRIX.md
 */

import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { db, users, type User } from "@/lib/db";
import { eq } from "drizzle-orm";
import { compare } from "bcryptjs";

// JWT Secret key
const JWT_SECRET = new TextEncoder().encode(
    process.env.JWT_SECRET || "fallback-secret-key-for-development-only"
);

// Token expiration time (24 hours)
const TOKEN_EXPIRATION = "24h";

// Cookie name
const AUTH_COOKIE = "auth_token";

/**
 * JWT Token payload type
 */
export interface TokenPayload {
    userId: string;
    sicilNo: string;
    fullName: string;
    role: "CHEF" | "ADMIN";
}

/**
 * Login result type
 */
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

/**
 * Kullanıcı girişi yapar
 */
export async function login(
    sicilNo: string,
    password: string
): Promise<LoginResult> {
    try {
        // 1. Kullanıcıyı bul
        const user = await db.query.users.findFirst({
            where: eq(users.sicilNo, sicilNo),
        });

        if (!user) {
            return {
                success: false,
                message: "Sicil numarası veya şifre hatalı",
            };
        }

        // 2. Aktif mi kontrol et
        if (!user.isActive) {
            return {
                success: false,
                message: "Hesabınız pasif durumda. Yönetici ile iletişime geçin.",
            };
        }

        // 3. Şifre kontrolü
        const isValidPassword = await compare(password, user.passwordHash);

        if (!isValidPassword) {
            return {
                success: false,
                message: "Sicil numarası veya şifre hatalı",
            };
        }

        // 4. JWT token oluştur
        const token = await createToken({
            userId: user.id,
            sicilNo: user.sicilNo,
            fullName: user.fullName,
            role: user.role,
        });

        // 5. Cookie'ye kaydet
        const cookieStore = await cookies();
        cookieStore.set(AUTH_COOKIE, token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 60 * 60 * 24, // 24 hours
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
    } catch (error) {
        console.error("Login error:", error);
        return {
            success: false,
            message: "Bir hata oluştu. Lütfen tekrar deneyin.",
        };
    }
}

/**
 * Çıkış yapar
 */
export async function logout(): Promise<void> {
    const cookieStore = await cookies();
    cookieStore.delete(AUTH_COOKIE);
}

/**
 * JWT token oluşturur
 */
async function createToken(payload: TokenPayload): Promise<string> {
    return new SignJWT(payload as unknown as Record<string, unknown>)
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime(TOKEN_EXPIRATION)
        .sign(JWT_SECRET);
}

/**
 * JWT token doğrular ve payload döner
 */
export async function verifyToken(
    token: string
): Promise<TokenPayload | null> {
    try {
        const { payload } = await jwtVerify(token, JWT_SECRET);
        return payload as unknown as TokenPayload;
    } catch {
        return null;
    }
}

/**
 * Mevcut oturumu kontrol eder
 */
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

/**
 * Kullanıcının belirli bir role sahip olup olmadığını kontrol eder
 */
export async function hasRole(
    requiredRole: "CHEF" | "ADMIN"
): Promise<boolean> {
    const session = await getSession();

    if (!session) {
        return false;
    }

    // ADMIN her role sahiptir
    if (session.role === "ADMIN") {
        return true;
    }

    return session.role === requiredRole;
}

/**
 * Sadece ADMIN yetkisi kontrolü
 */
export async function isAdmin(): Promise<boolean> {
    const session = await getSession();
    return session?.role === "ADMIN";
}

/**
 * Sadece ŞEF yetkisi kontrolü
 */
export async function isChef(): Promise<boolean> {
    const session = await getSession();
    return session?.role === "CHEF";
}
