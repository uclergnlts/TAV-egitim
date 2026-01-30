/**
 * Şef Panel Layout (Server Component)
 * Handles session and redirects, delegates to client component for UI
 */

// Force dynamic rendering (no static prerendering)
export const dynamic = 'force-dynamic';

import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import ChefLayoutClient from "./ChefLayoutClient";
import { ErrorBoundary } from "@/components/ErrorBoundary";

export default async function ChefLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await getSession();

    if (!session) {
        redirect("/login");
    }

    // Admin ise admin paneline yönlendir
    if (session.role === "ADMIN") {
        redirect("/admin");
    }

    return (
        <ErrorBoundary>
            <ChefLayoutClient
                session={{
                    fullName: session.fullName,
                    sicilNo: session.sicilNo,
                }}
            >
                {children}
            </ChefLayoutClient>
        </ErrorBoundary>
    );
}
