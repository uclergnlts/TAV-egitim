import Link from "next/link";
import Image from "next/image";

export default function Home() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 flex flex-col items-center justify-between p-6 md:p-8 relative overflow-hidden">
            {/* Animated Background Elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/5 rounded-full blur-3xl"></div>
            </div>

            {/* Grid Pattern Overlay */}
            <div
                className="absolute inset-0 opacity-[0.03]"
                style={{
                    backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                                     linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
                    backgroundSize: '50px 50px'
                }}
            ></div>

            <div className="flex-1 flex flex-col items-center justify-center space-y-12 w-full max-w-5xl z-10">
                {/* Logo & Title */}
                <div className="space-y-8 text-center">
                    <div className="flex justify-center">
                        <div className="bg-white/10 backdrop-blur-xl p-8 rounded-3xl shadow-2xl border border-white/20 hover:scale-105 transition-transform duration-500">
                            <Image
                                src="/tav-guvenlik-logo.png"
                                alt="TAV Güvenlik Logo"
                                width={300}
                                height={120}
                                priority
                                className="h-auto w-auto"
                            />
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h1 className="text-4xl md:text-6xl font-bold text-white tracking-tight">
                            Eğitim Takip Sistemi
                        </h1>
                        <p className="text-lg md:text-xl text-blue-200/80 max-w-2xl mx-auto">
                            Havalimanı Personeli Eğitim ve Sertifikasyon Yönetim Platformu
                        </p>
                    </div>
                </div>

                {/* Features Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-3xl">
                    <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-5 border border-white/10 text-center hover:bg-white/10 transition-colors">
                        <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center mx-auto mb-3">
                            <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                            </svg>
                        </div>
                        <h3 className="text-white font-semibold mb-1">Eğitim Yönetimi</h3>
                        <p className="text-blue-200/60 text-sm">Tüm eğitimleri tek platformda takip edin</p>
                    </div>

                    <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-5 border border-white/10 text-center hover:bg-white/10 transition-colors">
                        <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center mx-auto mb-3">
                            <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <h3 className="text-white font-semibold mb-1">Sertifikasyon</h3>
                        <p className="text-blue-200/60 text-sm">Personel sertifikalarını yönetin</p>
                    </div>

                    <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-5 border border-white/10 text-center hover:bg-white/10 transition-colors">
                        <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center mx-auto mb-3">
                            <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                        </div>
                        <h3 className="text-white font-semibold mb-1">Raporlama</h3>
                        <p className="text-blue-200/60 text-sm">Detaylı raporlar ve analizler</p>
                    </div>
                </div>

                {/* Login Button */}
                <div className="flex flex-col items-center gap-4">
                    <Link
                        href="/login"
                        className="group relative inline-flex items-center justify-center px-10 py-4 text-lg font-bold text-white transition-all duration-300 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 hover:from-blue-500 hover:to-indigo-500 hover:scale-105 hover:shadow-xl hover:shadow-blue-500/25 shadow-lg"
                    >
                        <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                        </svg>
                        <span>Giriş Yap</span>
                        <svg
                            className="w-5 h-5 ml-3 transition-transform group-hover:translate-x-1"
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
                    <p className="text-blue-200/50 text-sm">
                        Şef veya Admin hesabınızla giriş yapın
                    </p>
                </div>
            </div>

            {/* Footer */}
            <div className="w-full text-center space-y-3 z-10 mt-8">
                <div className="flex items-center justify-center gap-6 text-blue-200/40 text-xs">
                    <span>🛫 ESB Havalimanı</span>
                    <span className="w-1 h-1 bg-blue-400/30 rounded-full"></span>
                    <span>📍 Ankara, Türkiye</span>
                </div>
                <p className="text-blue-200/30 text-sm">
                    © 2026 TAV Havalimanları Holding. Tüm hakları saklıdır.
                </p>
                <p className="text-blue-200/20 text-xs pt-2 border-t border-white/5 max-w-xs mx-auto">
                    Created by <a href="https://uclergnlts.com" target="_blank" rel="noopener noreferrer" className="hover:text-blue-400 transition-colors">uclergnlts.com</a>
                </p>
            </div>
        </div>
    );
}
