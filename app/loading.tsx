export default function Loading() {
    return (
        <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center">
            <div className="flex flex-col items-center space-y-4">
                <div className="relative w-16 h-16">
                    {/* Outer ring */}
                    <div className="absolute inset-0 border-4 border-blue-100 rounded-full animate-pulse"></div>
                    {/* Inner spinner */}
                    <div className="absolute inset-0 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
                </div>
                <div className="text-blue-600 font-medium animate-pulse">
                    Yükleniyor...
                </div>
            </div>
        </div>
    );
}
