"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function LoginPage() {
    const router = useRouter();
    const [sicilNo, setSicilNo] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [showForgotModal, setShowForgotModal] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const response = await fetch("/api/auth/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    sicil_no: sicilNo,
                    password: password,
                }),
            });

            const data = await response.json();

            if (!data.success) {
                setError(data.message);
                setLoading(false);
                return;
            }

            // Rol bazlı yönlendirme
            if (data.role === "ADMIN") {
                router.push("/admin");
            } else {
                router.push("/chef");
            }
        } catch {
            setError("Bağlantı hatası. Lütfen tekrar deneyin.");
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
            {/* Animated Background Grid */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {/* Gradient Orbs */}
                <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-blue-600/20 rounded-full blur-[120px] animate-float opacity-60" />
                <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-indigo-600/20 rounded-full blur-[100px] animate-float-delayed opacity-60" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[80px]" />
                
                {/* Grid Pattern */}
                <div 
                    className="absolute inset-0 opacity-[0.02]"
                    style={{
                        backgroundImage: `linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px),
                                         linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)`,
                        backgroundSize: '60px 60px'
                    }}
                />
            </div>

            {/* Main Content */}
            <div className={`w-full max-w-md relative z-10 transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                {/* Logo Card */}
                <div className="text-center mb-8">
                    <div className={`inline-flex items-center justify-center p-6 rounded-3xl glass mb-6 transition-all duration-700 delay-100 ${mounted ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}`}>
                        <Image
                            src="/tav-guvenlik-logo.png"
                            alt="TAV Güvenlik"
                            width={180}
                            height={72}
                            priority
                            className="h-14 w-auto brightness-110"
                        />
                    </div>
                    
                    <h1 className={`text-3xl font-bold text-white tracking-tight mb-2 transition-all duration-700 delay-200 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                        Eğitim Portalı
                    </h1>
                    <p className={`text-slate-400 text-sm transition-all duration-700 delay-300 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                        Personel eğitim ve sertifikasyon yönetimi
                    </p>
                </div>

                {/* Login Card */}
                <div className={`glass rounded-3xl p-8 shadow-2xl shadow-black/20 transition-all duration-700 delay-400 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Error Message */}
                        {error && (
                            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 animate-shake">
                                <div className="flex items-center gap-3 text-red-400">
                                    <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <span className="text-sm">{error}</span>
                                </div>
                            </div>
                        )}

                        {/* Sicil No Field */}
                        <div className={`transition-all duration-700 delay-500 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                            <label htmlFor="sicilNo" className="block text-sm font-medium text-slate-300 mb-2">
                                Sicil Numarası
                            </label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <svg className="w-5 h-5 text-slate-500 group-focus-within:text-blue-400 transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                                    </svg>
                                </div>
                                <input
                                    id="sicilNo"
                                    type="text"
                                    value={sicilNo}
                                    onChange={(e) => setSicilNo(e.target.value)}
                                    placeholder="Sicil numaranızı girin"
                                    required
                                    className="w-full pl-12 pr-4 py-3.5 bg-slate-900/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all duration-300 input-animated"
                                />
                            </div>
                        </div>

                        {/* Password Field */}
                        <div className={`transition-all duration-700 delay-600 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                            <label htmlFor="password" className="block text-sm font-medium text-slate-300 mb-2">
                                Şifre
                            </label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <svg className="w-5 h-5 text-slate-500 group-focus-within:text-blue-400 transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                                    </svg>
                                </div>
                                <input
                                    id="password"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Şifrenizi girin"
                                    required
                                    className="w-full pl-12 pr-4 py-3.5 bg-slate-900/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all duration-300 input-animated"
                                />
                            </div>
                        </div>

                        {/* Forgot Password */}
                        <div className={`flex justify-end transition-all duration-700 delay-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                            <button
                                type="button"
                                onClick={() => setShowForgotModal(true)}
                                className="text-sm text-slate-400 hover:text-blue-400 transition-colors underline-animation"
                            >
                                Şifremi unuttum
                            </button>
                        </div>

                        {/* Submit Button */}
                        <div className={`transition-all duration-700 delay-800 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-4 px-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl shadow-lg shadow-blue-600/25 hover:shadow-blue-600/40 hover:from-blue-500 hover:to-indigo-500 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-950 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed btn-lift"
                            >
                                {loading ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                        </svg>
                                        Giriş yapılıyor...
                                    </span>
                                ) : (
                                    <span className="flex items-center justify-center gap-2">
                                        Giriş Yap
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                                        </svg>
                                    </span>
                                )}
                            </button>
                        </div>
                    </form>
                </div>

                {/* Footer */}
                <p className={`text-center text-xs text-slate-500 mt-8 transition-all duration-700 delay-900 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                    © 2026 TAV Havalimanları Holding. Tüm hakları saklıdır.
                </p>
            </div>

            {/* Forgot Password Modal */}
            {showForgotModal && (
                <div 
                    className="fixed inset-0 bg-slate-950/80 modal-backdrop flex items-center justify-center z-50 p-4 animate-fade-in-scale"
                    onClick={(e) => e.target === e.currentTarget && setShowForgotModal(false)}
                >
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 max-w-md w-full animate-fade-in-scale">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="p-3 bg-blue-500/10 rounded-xl">
                                <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-white">Şifremi Unuttum</h3>
                                <p className="text-sm text-slate-400">Şifre sıfırlama talebi</p>
                            </div>
                        </div>
                        
                        <div className="bg-slate-800/50 rounded-xl p-4 mb-6">
                            <p className="text-sm text-slate-300 leading-relaxed">
                                Şifrenizi sıfırlamak için lütfen sistem yöneticinizle iletişime geçin. 
                                Güvenlik nedeniyle şifre sıfırlama işlemleri yönetici tarafından yapılmaktadır.
                            </p>
                        </div>

                        <div className="flex items-center gap-3 p-4 bg-blue-500/5 border border-blue-500/20 rounded-xl mb-6">
                            <svg className="w-5 h-5 text-blue-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                            </svg>
                            <div className="text-sm">
                                <p className="text-slate-400">Destek:</p>
                                <p className="text-blue-400 font-medium">it.destek@tav.aero</p>
                            </div>
                        </div>

                        <button
                            onClick={() => setShowForgotModal(false)}
                            className="w-full py-3 px-4 bg-slate-800 hover:bg-slate-700 text-white font-medium rounded-xl transition-colors duration-200"
                        >
                            Anladım
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
