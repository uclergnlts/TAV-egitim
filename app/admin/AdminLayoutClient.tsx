"use client";

/**
 * Admin Panel Layout - Client Component
 * Mobile-responsive with drawer navigation
 */

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

interface AdminLayoutClientProps {
    children: React.ReactNode;
    session: {
        fullName: string;
        sicilNo: string;
    };
}

const navItems = [
    { href: "/admin", label: "Dashboard", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" },
    { type: "header", label: "Yönetim" },
    { href: "/admin/trainings", label: "Eğitim Kataloğu", icon: "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" },
    { href: "/admin/personnel", label: "Personel", icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" },
    { href: "/admin/trainers", label: "Eğitmenler", icon: "M19 11a7 7 0 0 1-7 7m0 0a7 7 0 0 1-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 0 1-3-3V5a3 3 0 1 1 6 0v6a3 3 0 0 1-3 3z" },
    { type: "header", label: "Tanımlamalar" },
    { href: "/admin/definitions/locations", label: "Eğitim Yerleri", icon: "M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" },
    { href: "/admin/definitions/documents", label: "Belge Türleri", icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" },
    { type: "header", label: "Raporlar" },
    { href: "/admin/reports/monthly", label: "Aylık Tablo", icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" },
    { href: "/admin/reports/yearly", label: "Yıllık Pivot", icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" },
    { href: "/admin/reports/detail", label: "Detay Liste", icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" },
    { type: "divider" },
    { href: "/admin/audit-logs", label: "Denetim Kayıtları", icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z", isDanger: true },
    { type: "divider" },
    { type: "header", label: "Veri Yükleme" },
    { href: "/admin/import/personnel", label: "Personel Import", icon: "M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" },
    { href: "/admin/import/attendance", label: "Katılım Import", icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" },
];

export default function AdminLayoutClient({ children, session }: AdminLayoutClientProps) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const pathname = usePathname();

    const isActive = (href: string) => pathname === href;

    const renderNavItem = (item: any, index: number) => {
        if (item.type === "header") {
            return (
                <div key={index} className="pt-4 pb-2 px-4 text-xs font-semibold text-gray-400 uppercase">
                    {item.label}
                </div>
            );
        }
        if (item.type === "divider") {
            return <div key={index} className="my-2 border-t border-gray-700"></div>;
        }
        return (
            <Link
                key={index}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${isActive(item.href)
                        ? "bg-blue-600 text-white"
                        : item.isDanger
                            ? "hover:bg-red-900/50 text-red-200"
                            : "hover:bg-gray-700"
                    }`}
            >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                </svg>
                <span>{item.label}</span>
            </Link>
        );
    };

    const Sidebar = () => (
        <>
            {/* Logo */}
            <div className="p-6 border-b border-gray-700">
                <div className="flex items-center space-x-3">
                    <div className="bg-white/10 p-2 rounded-lg backdrop-blur-sm">
                        <Image
                            src="/tav-logo.svg"
                            alt="TAV Logo"
                            width={40}
                            height={40}
                            className="w-auto h-8"
                        />
                    </div>
                    <div>
                        <h1 className="font-bold">TAV Eğitim</h1>
                        <p className="text-xs text-gray-400">Admin Panel</p>
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <nav className="p-4 space-y-1 overflow-y-auto flex-1">
                {navItems.map(renderNavItem)}
            </nav>

            {/* User info at bottom */}
            <div className="p-4 border-t border-gray-700">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium">{session.fullName}</p>
                        <p className="text-xs text-gray-400">{session.sicilNo}</p>
                    </div>
                    <form action="/api/auth/logout" method="POST">
                        <button
                            type="submit"
                            className="p-2 text-gray-400 hover:text-red-400 rounded-lg transition-colors"
                            title="Çıkış Yap"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                        </button>
                    </form>
                </div>
            </div>
        </>
    );

    return (
        <div className="min-h-screen bg-gray-100">
            {/* Mobile Header */}
            <header className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-gray-900 text-white h-16 flex items-center justify-between px-4">
                <button
                    onClick={() => setSidebarOpen(true)}
                    className="p-2 hover:bg-gray-800 rounded-lg"
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                </button>
                <div className="flex items-center space-x-2">
                    <Image src="/tav-logo.svg" alt="TAV Logo" width={32} height={32} className="h-6 w-auto" />
                    <span className="font-bold">TAV Eğitim</span>
                </div>
                <div className="w-10"></div>
            </header>

            {/* Mobile Overlay */}
            {sidebarOpen && (
                <div
                    className="lg:hidden fixed inset-0 bg-black/50 z-40"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar - Desktop (fixed) */}
            <aside className="hidden lg:flex fixed inset-y-0 left-0 w-64 bg-gradient-to-b from-gray-900 to-gray-800 text-white flex-col">
                <Sidebar />
            </aside>

            {/* Sidebar - Mobile (drawer) */}
            <aside
                className={`lg:hidden fixed inset-y-0 left-0 w-72 bg-gradient-to-b from-gray-900 to-gray-800 text-white z-50 transform transition-transform duration-300 flex flex-col ${sidebarOpen ? "translate-x-0" : "-translate-x-full"
                    }`}
            >
                <button
                    onClick={() => setSidebarOpen(false)}
                    className="absolute top-4 right-4 p-2 hover:bg-gray-700 rounded-lg"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
                <Sidebar />
            </aside>

            {/* Main Content */}
            <main className="lg:ml-64 p-4 lg:p-8 pt-20 lg:pt-8">{children}</main>
        </div>
    );
}
