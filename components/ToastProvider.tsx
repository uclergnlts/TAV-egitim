"use client";

import React, { createContext, useContext, useState, useCallback } from "react";

export type ToastType = "success" | "error" | "warning" | "info";

interface Toast {
    id: string;
    type: ToastType;
    message: string;
    duration?: number;
}

interface ToastContextValue {
    showToast: (type: ToastType, message: string, duration?: number) => void;
    success: (message: string, duration?: number) => void;
    error: (message: string, duration?: number) => void;
    warning: (message: string, duration?: number) => void;
    info: (message: string, duration?: number) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error("useToast must be used within a ToastProvider");
    }
    return context;
}

const toastStyles: Record<ToastType, { bg: string; border: string; icon: string }> = {
    success: {
        bg: "bg-green-50",
        border: "border-green-200",
        icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
    },
    error: {
        bg: "bg-red-50",
        border: "border-red-200",
        icon: "M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
    },
    warning: {
        bg: "bg-yellow-50",
        border: "border-yellow-200",
        icon: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
    },
    info: {
        bg: "bg-blue-50",
        border: "border-blue-200",
        icon: "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
    }
};

const toastColors: Record<ToastType, { text: string; iconColor: string }> = {
    success: { text: "text-green-800", iconColor: "text-green-500" },
    error: { text: "text-red-800", iconColor: "text-red-500" },
    warning: { text: "text-yellow-800", iconColor: "text-yellow-500" },
    info: { text: "text-blue-800", iconColor: "text-blue-500" }
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const removeToast = useCallback((id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    const showToast = useCallback((type: ToastType, message: string, duration = 4000) => {
        const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2)}`;
        const toast: Toast = { id, type, message, duration };

        setToasts((prev) => [...prev, toast]);

        // Auto dismiss
        if (duration > 0) {
            setTimeout(() => removeToast(id), duration);
        }
    }, [removeToast]);

    const success = useCallback((message: string, duration?: number) => showToast("success", message, duration), [showToast]);
    const error = useCallback((message: string, duration?: number) => showToast("error", message, duration), [showToast]);
    const warning = useCallback((message: string, duration?: number) => showToast("warning", message, duration), [showToast]);
    const info = useCallback((message: string, duration?: number) => showToast("info", message, duration), [showToast]);

    return (
        <ToastContext.Provider value={{ showToast, success, error, warning, info }}>
            {children}

            {/* Toast Container - Top Right */}
            <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
                {toasts.map((toast) => (
                    <div
                        key={toast.id}
                        className={`pointer-events-auto min-w-[300px] max-w-md p-4 rounded-xl shadow-lg border ${toastStyles[toast.type].bg} ${toastStyles[toast.type].border} animate-slideInRight`}
                    >
                        <div className="flex items-start gap-3">
                            <svg
                                className={`w-5 h-5 flex-shrink-0 mt-0.5 ${toastColors[toast.type].iconColor}`}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d={toastStyles[toast.type].icon}
                                />
                            </svg>
                            <p className={`text-sm font-medium ${toastColors[toast.type].text} flex-1`}>
                                {toast.message}
                            </p>
                            <button
                                onClick={() => removeToast(toast.id)}
                                className={`flex-shrink-0 p-1 rounded-full hover:bg-black/5 transition-colors ${toastColors[toast.type].text}`}
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* Progress bar */}
                        {toast.duration && toast.duration > 0 && (
                            <div className="mt-3 h-1 w-full bg-black/10 rounded-full overflow-hidden">
                                <div
                                    className={`h-full ${toast.type === 'success' ? 'bg-green-400' : toast.type === 'error' ? 'bg-red-400' : toast.type === 'warning' ? 'bg-yellow-400' : 'bg-blue-400'} rounded-full`}
                                    style={{
                                        animation: `shrink ${toast.duration}ms linear forwards`
                                    }}
                                />
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Animations */}
            <style jsx global>{`
                @keyframes slideInRight {
                    from {
                        opacity: 0;
                        transform: translateX(100%);
                    }
                    to {
                        opacity: 1;
                        transform: translateX(0);
                    }
                }
                @keyframes shrink {
                    from { width: 100%; }
                    to { width: 0%; }
                }
                .animate-slideInRight {
                    animation: slideInRight 0.3s ease-out forwards;
                }
            `}</style>
        </ToastContext.Provider>
    );
}
