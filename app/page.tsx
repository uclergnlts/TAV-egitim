import Link from "next/link";
import Image from "next/image";

export default function Home() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col items-center justify-between p-8">
            <div className="flex-1 flex flex-col items-center justify-center space-y-12 w-full max-w-4xl">
                {/* Logo & Title */}
                <div className="space-y-6 text-center animate-fade-in-up">
                    <div className="flex justify-center">
                        <div className="bg-white p-6 rounded-2xl shadow-xl hover:shadow-2xl transition-shadow duration-300">
                            <Image
                                src="/tav-logo.svg"
                                alt="TAV Airports Logo"
                                width={300}
                                height={120}
                                priority
                                className="h-auto w-auto"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 tracking-tight">
                            Eğitim Takip Sistemi
                        </h1>
                        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                            Havalimanı Personeli Eğitim ve Sertifikasyon Yönetim Platformu
                        </p>
                    </div>
                </div>

                {/* Login Button */}
                <div className="animate-fade-in-up delay-100">
                    <Link
                        href="/login"
                        className="group relative inline-flex items-center justify-center px-8 py-4 text-lg font-bold text-white transition-all duration-200 bg-blue-600 font-pj rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600 hover:bg-blue-700 hover:scale-105 shadow-lg"
                    >
                        <span>Personel Girişi</span>
                        <svg
                            className="w-5 h-5 ml-2 -mr-1 transition-transform group-hover:translate-x-1"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M13 7l5 5m0 0l-5 5m5-5H6"
                            />
                        </svg>
                    </Link>
                </div>
            </div>

            {/* Footer */}
            <div className="w-full text-center space-y-2 animate-fade-in text-sm text-gray-500">
                <p>
                    © 2026 TAV Havalimanları Holding. Tüm hakları saklıdır.
                </p>
                <div className="pt-2 border-t border-gray-200 w-full max-w-xs mx-auto">
                    <p className="font-medium text-gray-400 text-xs">
                        Creator <a href="https://uclergnlts.com" target="_blank" rel="noopener noreferrer" className="hover:text-blue-600 transition-colors">uclergnlts.com</a>
                    </p>
                </div>
            </div>
        </div>
    );
}
