"use client";

/**
 * Şef Panel Layout
 * Sadece ŞEF rolü erişebilir
 * Mobile-responsive with hamburger menu
 */

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";

interface ChefLayoutProps {
    children: React.ReactNode;
    session: {
        fullName: string;
        sicilNo: string;
    };
}

export default function ChefLayoutClient({ children, session }: ChefLayoutProps) {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white shadow-sm border-b sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        {/* Logo & Title */}
                        <div className="flex items-center space-x-3">
                            <Image
                                src="/tav-logo.svg"
                                alt="TAV Logo"
                                width={40}
                                height={40}
                                className="w-auto h-8"
                            />
                            <div className="hidden sm:block">
                                <h1 className="text-lg font-semibold text-gray-900">
                                    TAV Eğitim Paneli
                                </h1>
                                <p className="text-xs text-gray-500">Şef Paneli</p>
                            </div>
                        </div>

                        {/* Desktop Navigation */}
                        <nav className="hidden md:flex items-center space-x-4">
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

                        {/* User Info (Desktop) */}
                        <div className="hidden md:flex items-center space-x-4">
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

                        {/* Mobile Menu Button */}
                        <button
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className="md:hidden p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                            aria-label="Menu"
                        >
                            {mobileMenuOpen ? (
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            ) : (
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                </svg>
                            )}
                        </button>
                    </div>
                </div>

                {/* Mobile Menu Dropdown */}
                {mobileMenuOpen && (
                    <div className="md:hidden bg-white border-t border-gray-100 shadow-lg">
                        <div className="px-4 py-3 border-b border-gray-100">
                            <p className="text-sm font-medium text-gray-900">{session.fullName}</p>
                            <p className="text-xs text-gray-500">{session.sicilNo}</p>
                        </div>
                        <nav className="px-4 py-2 space-y-1">
                            <Link
                                href="/chef"
                                onClick={() => setMobileMenuOpen(false)}
                                className="block px-3 py-3 text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-lg transition-colors"
                            >
                                📝 Katılım Girişi
                            </Link>
                            <Link
                                href="/chef/history"
                                onClick={() => setMobileMenuOpen(false)}
                                className="block px-3 py-3 text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-lg transition-colors"
                            >
                                📋 Kayıt Geçmişi
                            </Link>
                        </nav>
                        <div className="px-4 py-3 border-t border-gray-100">
                            <form action="/api/auth/logout" method="POST">
                                <button
                                    type="submit"
                                    className="w-full flex items-center justify-center gap-2 px-4 py-3 text-red-600 font-medium hover:bg-red-50 rounded-lg transition-colors"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                    </svg>
                                    Çıkış Yap
                                </button>
                            </form>
                        </div>
                    </div>
                )}
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
                {children}
            </main>
        </div>
    );
}
