import Image from "next/image";

export default function Loading() {
    return (
        <div className="fixed inset-0 bg-white/90 backdrop-blur-sm z-50 flex items-center justify-center">
            <div className="flex flex-col items-center space-y-6">
                <div className="relative">
                    <Image
                        src="/tav-guvenlik-logo.png"
                        alt="Loading..."
                        width={150}
                        height={60}
                        className="animate-pulse h-auto w-auto"
                    />
                </div>
                <div className="flex flex-col items-center gap-2">
                    <div className="h-1 w-32 bg-gray-200 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-600 animate-[loading_1s_ease-in-out_infinite]" style={{ width: '50%' }}></div>
                    </div>
                </div>
            </div>
        </div>
    );
}
