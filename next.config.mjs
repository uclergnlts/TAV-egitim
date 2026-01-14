/** @type {import('next').NextConfig} */
const nextConfig = {
    // Performans optimizasyonları
    reactStrictMode: true,

    // API timeout ayarları
    experimental: {
        serverActions: {
            bodySizeLimit: '2mb',
        },
    },
};

export default nextConfig;
