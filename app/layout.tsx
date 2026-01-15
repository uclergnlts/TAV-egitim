import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/components/ToastProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: "TAV Eğitim Paneli",
    description: "Havalimanı Personel Eğitim Takip Sistemi",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="tr" suppressHydrationWarning={true}>
            <body className={inter.className} suppressHydrationWarning={true}>
                <ToastProvider>
                    {children}
                </ToastProvider>
            </body>
        </html>
    );
}
