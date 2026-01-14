/**
 * Şef Panel Layout (Server Component)
 * Handles session and redirects, delegates to client component for UI
 */

import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import ChefLayoutClient from "./ChefLayoutClient";

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
        <ChefLayoutClient
            session={{
                fullName: session.fullName,
                sicilNo: session.sicilNo,
            }}
        >
            {children}
        </ChefLayoutClient>
    );
}
