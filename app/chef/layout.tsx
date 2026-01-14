/**
 * Şef Panel Layout
 * Sadece ŞEF rolü erişebilir
 */

import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import Link from "next/link";

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
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white shadow-sm border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        {/* Logo & Title */}
                        <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-lg flex items-center justify-center">
                                <svg
                                    className="w-5 h-5 text-white"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                                    />
                                </svg>
                            </div>
                            <div>
                                <h1 className="text-lg font-semibold text-gray-900">
                                    TAV Eğitim Paneli
                                </h1>
                                <p className="text-xs text-gray-500">Şef Paneli</p>
                            </div>
                        </div>

                        {/* Navigation */}
                        <nav className="flex items-center space-x-4">
                            <Link
                                href="/chef"
                                className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                Katılım Girişi
                            </Link>
                            <Link
                                href="/chef/history"
                                className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                Kayıt Geçmişi
                            </Link>
                        </nav>

                        {/* User Info */}
                        <div className="flex items-center space-x-4">
                            <div className="text-right">
                                <p className="text-sm font-medium text-gray-900">
                                    {session.fullName}
                                </p>
                                <p className="text-xs text-gray-500">{session.sicilNo}</p>
                            </div>
                            <form action="/api/auth/logout" method="POST">
                                <button
                                    type="submit"
                                    className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                    title="Çıkış Yap"
                                >
                                    <svg
                                        className="w-5 h-5"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                                        />
                                    </svg>
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {children}
            </main>
        </div>
    );
}
