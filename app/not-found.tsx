import Link from "next/link";
import Image from "next/image";

export default function NotFound() {
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
            <div className="text-center space-y-6 max-w-md mx-auto">
                {/* Logo */}
                <div className="flex justify-center mb-8">
                    <Image
                        src="/tav-guvenlik-logo.png"
                        alt="TAV Güvenlik Logo"
                        width={200}
                        height={80}
                        className="opacity-80 h-auto w-auto"
                    />
                </div>

                {/* Text */}
                <h1 className="text-6xl font-bold text-gray-900">404</h1>
                <h2 className="text-2xl font-semibold text-gray-800">
                    Sayfa Bulunamadı
                </h2>
                <p className="text-gray-500">
                    Aradığınız sayfa mevcut değil veya taşınmış olabilir.
                    Lütfen adresi kontrol edin veya ana sayfaya dönün.
                </p>

                {/* Action */}
                <div className="pt-4">
                    <Link
                        href="/"
                        className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                        <svg
                            className="mr-2 -ml-1 w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                            />
                        </svg>
                        Ana Sayfaya Dön
                    </Link>
                </div>
            </div>
        </div>
    );
}
