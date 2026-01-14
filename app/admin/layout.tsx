/**
 * Admin Panel Layout (Server Component)
 * Handles session and redirects, delegates to client component for UI
 */

import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import AdminLayoutClient from "./AdminLayoutClient";

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await getSession();

    if (!session) {
        redirect("/login");
    }

    // Şef ise şef paneline yönlendir
    if (session.role === "CHEF") {
        redirect("/chef");
    }

    return (
        <AdminLayoutClient
            session={{
                fullName: session.fullName,
                sicilNo: session.sicilNo,
            }}
        >
            {children}
        </AdminLayoutClient>
    );
}
