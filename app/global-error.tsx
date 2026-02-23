"use client";

import { useEffect } from "react";

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error("Global Error:", error);
    }, [error]);

    return (
        <html lang="tr">
            <body className="min-h-screen bg-red-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-xl shadow-lg p-6 max-w-md w-full text-center space-y-4">
                    <h1 className="text-2xl font-bold text-red-700">Kritik Hata</h1>
                    <p className="text-gray-700">
                        Uygulama beklenmedik bir hata ile karşılaştı. Lütfen tekrar deneyin.
                    </p>
                    {error.digest && (
                        <p className="text-xs text-gray-500 font-mono">Hata Kodu: {error.digest}</p>
                    )}
                    <div className="flex gap-2 justify-center">
                        <button
                            onClick={reset}
                            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                        >
                            Tekrar Dene
                        </button>
                        <button
                            onClick={() => (window.location.href = "/")}
                            className="px-4 py-2 bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200"
                        >
                            Ana Sayfa
                        </button>
                    </div>
                </div>
            </body>
        </html>
    );
}
