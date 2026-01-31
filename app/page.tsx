"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";

const features = [
    {
        icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
            </svg>
        ),
        title: "Eğitim Yönetimi",
        description: "Tüm eğitimleri tek platformda takip edin ve yönetin",
        color: "blue",
    },
    {
        icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
            </svg>
        ),
        title: "Sertifikasyon",
        description: "Personel sertifikalarını dijital ortamda yönetin",
        color: "green",
    },
    {
        icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
            </svg>
        ),
        title: "Raporlama",
        description: "Detaylı raporlar ve analizlerle içgörü elde edin",
        color: "purple",
    },
];

const stats = [
    { value: "10K+", label: "Personel" },
    { value: "500+", label: "Eğitim" },
    { value: "50K+", label: "Sertifika" },
    { value: "99.9%", label: "Uptime" },
];

export default function HomePage() {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    return (
        <div className="min-h-screen bg-slate-950 flex flex-col relative overflow-hidden">
            {/* Background Elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {/* Gradient Orbs */}
                <div className="absolute top-0 right-0 w-[1000px] h-[1000px] bg-blue-600/15 rounded-full blur-[150px] animate-float" />
                <div className="absolute bottom-0 left-0 w-[800px] h-[800px] bg-indigo-600/15 rounded-full blur-[120px] animate-float-delayed" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-500/10 rounded-full blur-[100px]" />
                
                {/* Grid Pattern */}
                <div 
                    className="absolute inset-0 opacity-[0.015]"
                    style={{
                        backgroundImage: `linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px),
                                         linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)`,
                        backgroundSize: '80px 80px'
                    }}
                />
            </div>

            {/* Header */}
            <header className="relative z-10 w-full px-6 py-4">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div className={`flex items-center gap-3 transition-all duration-700 ${mounted ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-8'}`}>
                        <div className="p-2 bg-white/5 rounded-xl">
                            <Image
                                src="/tav-guvenlik-logo.png"
                                alt="TAV"
                                width={80}
                                height={32}
                                className="h-8 w-auto brightness-110"
                            />
                        </div>
                    </div>
                    
                    <Link
                        href="/login"
                        className={`px-5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white text-sm font-medium rounded-xl transition-all duration-300 hover:scale-105 ${mounted ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'}`}
                    >
                        Giriş Yap
                    </Link>
                </div>
            </header>

            {/* Hero Section */}
            <main className="flex-1 flex flex-col items-center justify-center relative z-10 px-6 py-12">
                <div className="max-w-5xl mx-auto text-center">
                    {/* Badge */}
                    <div className={`inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-full mb-8 transition-all duration-700 delay-100 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                        <span className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
                        <span className="text-sm text-blue-300">ESB Havalimanı Personel Sistemi</span>
                    </div>

                    {/* Title */}
                    <h1 className={`text-5xl md:text-7xl font-bold text-white tracking-tight mb-6 transition-all duration-700 delay-200 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                        Eğitim Takip
                        <span className="block mt-2 bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-400 bg-clip-text text-transparent">
                            Sistemi
                        </span>
                    </h1>

                    {/* Description */}
                    <p className={`text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-12 leading-relaxed transition-all duration-700 delay-300 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                        Havalimanı personeli eğitim ve sertifikasyon yönetim platformu. 
                        Tüm eğitim süreçlerini dijital ortamda takip edin.
                    </p>

                    {/* CTA Buttons */}
                    <div className={`flex flex-col sm:flex-row items-center justify-center gap-4 mb-20 transition-all duration-700 delay-400 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                        <Link
                            href="/login"
                            className="group relative inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-2xl shadow-lg shadow-blue-600/25 hover:shadow-blue-600/40 transition-all duration-300 hover:scale-105 btn-lift"
                        >
                            <span>Sisteme Giriş</span>
                            <svg className="w-5 h-5 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                            </svg>
                        </Link>
                        
                        <a
                            href="#features"
                            className="inline-flex items-center gap-2 px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 font-medium rounded-2xl transition-all duration-300 hover:scale-105"
                        >
                            <span>Daha Fazla Bilgi</span>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.5 13.5L12 21m0 0l-7.5-7.5M12 21V3" />
                            </svg>
                        </a>
                    </div>

                    {/* Stats */}
                    <div className={`grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto mb-20 transition-all duration-700 delay-500 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                        {stats.map((stat, index) => (
                            <div key={stat.label} className="text-center p-4 glass rounded-2xl">
                                <div className="text-3xl md:text-4xl font-bold text-white mb-1">{stat.value}</div>
                                <div className="text-sm text-slate-400">{stat.label}</div>
                            </div>
                        ))}
                    </div>

                    {/* Features */}
                    <div id="features" className={`grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto transition-all duration-700 delay-600 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                        {features.map((feature, index) => (
                            <div
                                key={feature.title}
                                className="group p-6 glass rounded-2xl text-left card-hover cursor-default"
                                style={{ animationDelay: `${600 + index * 100}ms` }}
                            >
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-colors duration-300 ${
                                    feature.color === 'blue' ? 'bg-blue-500/10 text-blue-400 group-hover:bg-blue-500/20' :
                                    feature.color === 'green' ? 'bg-green-500/10 text-green-400 group-hover:bg-green-500/20' :
                                    'bg-purple-500/10 text-purple-400 group-hover:bg-purple-500/20'
                                }`}>
                                    {feature.icon}
                                </div>
                                <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                                <p className="text-sm text-slate-400 leading-relaxed">{feature.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="relative z-10 w-full px-6 py-8 border-t border-white/5">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-6 text-sm text-slate-500">
                        <span className="flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                            </svg>
                            ESB Havalimanı, Ankara
                        </span>
                    </div>
                    
                    <p className="text-sm text-slate-600">
                        © 2026 TAV Havalimanları Holding
                    </p>
                </div>
            </footer>
        </div>
    );
}
