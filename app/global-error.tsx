"use client";

import { useEffect } from "react";
import Image from "next/image";

/**
 * Global Error Boundary
 * Catches errors that bubble up to the root layout
 */
export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Log to error tracking service
        console.error("Global Error:", error);
        
        // Send to error tracking service (e.g., Sentry)
        // if (typeof window !== "undefined" && window.Sentry) {
        //     window.Sentry.captureException(error);
        // }
    }, [error]);

    const handleReload = () => {
        window.location.reload();
    };

    const handleGoHome = () => {
        window.location.href = "/";
    };

    return (
        <html lang="tr">
            <body className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
                <div className="w-full max-w-md">
                    {/* Card */}
                    <div className="bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border border-white/20">
                        {/* Logo */}
                        <div className="flex justify-center mb-8">
                            <div className="bg-white/20 backdrop-blur-sm p-4 rounded-2xl">
                                <Image
                                    src="/tav-guvenlik-logo.png"
                                    alt="TAV Güvenlik Logo"
                                    width={200}
                                    height={80}
                                    priority
                                    className="h-auto w-auto"
                                />
                            </div>
                        </div>

                        {/* Error Icon */}
                        <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                            <svg
                                className="w-10 h-10 text-red-300"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                                />
                            </svg>
                        </div>

                        {/* Error Message */}
                        <div className="text-center mb-8">
                            <h1 className="text-2xl font-bold text-white mb-3">
                                Kritik Hata
                            </h1>
                            <p className="text-blue-200/80">
                                Uygulama yüklenirken kritik bir hata oluştu. 
                                Lütfen sayfayı yenileyin veya ana sayfaya dönün.
                            </p>
                            {error.digest && (
                                <p className="text-xs text-blue-300/60 mt-4 font-mono">
                                    Hata Kodu: {error.digest}
                                </p>
                            )}
                        </div>

                        {/* Error Details (Development only) */}
                        {process.env.NODE_ENV === "development" && (
                            <div className="mb-6 p-4 bg-black/30 rounded-lg overflow-auto max-h-40">
                                <p className="text-xs font-mono text-red-300 mb-2">
                                    {error.message}
                                </p>
                                <pre className="text-xs font-mono text-gray-400 whitespace-pre-wrap">
                                    {error.stack}
                                </pre>
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div className="space-y-3">
                            <button
                                onClick={reset}
                                className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-transparent"
                            >
                                Tekrar Dene
                            </button>
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    onClick={handleReload}
                                    className="px-4 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-medium transition-all border border-white/10"
                                >
                                    Sayfayı Yenile
                                </button>
                                <button
                                    onClick={handleGoHome}
                                    className="px-4 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-medium transition-all border border-white/10"
                                >
                                    Ana Sayfa
                                </button>
                            </div>
                        </div>

                        {/* Support Info */}
                        <div className="mt-8 pt-6 border-t border-white/10 text-center">
                            <p className="text-sm text-blue-200/60">
                                Sorun devam ederse lütfen sistem yöneticisi ile iletişime geçin.
                            </p>
                        </div>
                    </div>
                </div>
            </body>
        </html>
    );
}
