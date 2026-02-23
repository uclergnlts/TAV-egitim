import Link from "next/link";
import Image from "next/image";

export default function HomePage() {
    return (
        <div className="flex min-h-screen flex-col bg-white text-slate-900">
            {/* Header */}
            <header className="border-b border-slate-200">
                <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
                    <div className="flex items-center gap-3">
                        <Image src="/tav-guvenlik-logo.png" alt="TAV Güvenlik" width={90} height={36} className="h-8 w-auto" priority />
                        <span className="text-sm font-semibold text-slate-700">Eğitim Paneli</span>
                    </div>
                    <Link
                        href="/login"
                        className="rounded-lg bg-slate-900 px-5 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
                    >
                        Giriş Yap
                    </Link>
                </div>
            </header>

            {/* Hero */}
            <main className="flex flex-1 items-center">
                <div className="mx-auto max-w-5xl px-6 py-16">
                    <div className="max-w-2xl">
                        <h1 className="text-3xl font-bold leading-tight text-slate-900 md:text-4xl">
                            Personel Eğitim Takip Sistemi
                        </h1>
                        <p className="mt-4 text-base leading-relaxed text-slate-600">
                            Eğitim kayıtları, katılım takibi ve raporlama işlemlerini tek bir platform üzerinden yönetin.
                        </p>
                        <Link
                            href="/login"
                            className="mt-8 inline-block rounded-lg bg-slate-900 px-6 py-3 text-sm font-medium text-white transition hover:bg-slate-800"
                        >
                            Panele Giriş
                        </Link>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="border-t border-slate-200">
                <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4 text-xs text-slate-400">
                    <p>TAV Havalimanları Holding &ndash; Eğitim Paneli</p>
                    <p>&copy; 2026</p>
                </div>
            </footer>
        </div>
    );
}
