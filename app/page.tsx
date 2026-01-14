import Link from "next/link";

export default function Home() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
            <div className="text-center space-y-8 p-8">
                {/* Logo & Title */}
                <div className="space-y-4">
                    <div className="w-20 h-20 mx-auto bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl flex items-center justify-center shadow-xl">
                        <svg
                            className="w-10 h-10 text-white"
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
                    <h1 className="text-4xl font-bold text-gray-900">
                        TAV Eğitim Paneli
                    </h1>
                    <p className="text-lg text-gray-600 max-w-md mx-auto">
                        Havalimanı Personel Eğitim Takip Sistemi
                    </p>
                </div>

                {/* Login Button */}
                <div className="space-y-4">
                    <Link
                        href="/login"
                        className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl shadow-lg hover:from-blue-700 hover:to-indigo-700 transform hover:scale-105 transition-all duration-200"
                    >
                        <svg
                            className="w-5 h-5 mr-2"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
                            />
                        </svg>
                        Giriş Yap
                    </Link>
                </div>

                {/* Footer */}
                <p className="text-sm text-gray-500">
                    © 2026 TAV Havalimanları Holding
                </p>
            </div>
        </div>
    );
}
