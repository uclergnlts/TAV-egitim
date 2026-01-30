"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
    onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
}

/**
 * React Error Boundary Component
 * Catches JavaScript errors anywhere in the child component tree
 */
export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null,
        };
    }

    static getDerivedStateFromError(error: Error): State {
        // Update state so the next render will show the fallback UI
        return {
            hasError: true,
            error,
            errorInfo: null,
        };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        // Log error details
        console.error("ErrorBoundary caught an error:", error, errorInfo);
        
        this.setState({
            error,
            errorInfo,
        });

        // Call optional error handler
        this.props.onError?.(error, errorInfo);

        // Send to error tracking service (e.g., Sentry)
        // if (typeof window !== "undefined" && window.Sentry) {
        //     window.Sentry.captureException(error, { extra: errorInfo });
        // }
    }

    handleReset = () => {
        this.setState({
            hasError: false,
            error: null,
            errorInfo: null,
        });
    };

    handleReload = () => {
        window.location.reload();
    };

    handleGoHome = () => {
        window.location.href = "/";
    };

    render() {
        if (this.state.hasError) {
            // Custom fallback UI
            if (this.props.fallback) {
                return this.props.fallback;
            }

            // Default error UI
            return (
                <div className="min-h-[400px] flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-lg border border-red-100 p-8 max-w-lg w-full">
                        {/* Error Icon */}
                        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
                            <svg
                                className="w-8 h-8 text-red-500"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                                />
                            </svg>
                        </div>

                        {/* Error Message */}
                        <div className="text-center mb-6">
                            <h2 className="text-xl font-bold text-gray-900 mb-2">
                                Bir Hata Oluştu
                            </h2>
                            <p className="text-gray-600 text-sm">
                                Bu bileşen yüklenirken beklenmedik bir hata oluştu.
                            </p>
                        </div>

                        {/* Error Details (Development only) */}
                        {process.env.NODE_ENV === "development" && this.state.error && (
                            <div className="mb-6 p-4 bg-gray-50 rounded-lg overflow-auto max-h-48">
                                <p className="text-xs font-mono text-red-600 mb-2">
                                    {this.state.error.toString()}
                                </p>
                                {this.state.errorInfo && (
                                    <pre className="text-xs font-mono text-gray-600 whitespace-pre-wrap">
                                        {this.state.errorInfo.componentStack}
                                    </pre>
                                )}
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex flex-col gap-3">
                            <button
                                onClick={this.handleReset}
                                className="w-full px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                                Tekrar Dene
                            </button>
                            <div className="flex gap-3">
                                <button
                                    onClick={this.handleReload}
                                    className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                                >
                                    Sayfayı Yenile
                                </button>
                                <button
                                    onClick={this.handleGoHome}
                                    className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                                >
                                    Ana Sayfa
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

/**
 * Hook to create an error boundary wrapper
 */
export function withErrorBoundary<P extends object>(
    Component: React.ComponentType<P>,
    fallback?: ReactNode
) {
    return function WithErrorBoundary(props: P) {
        return (
            <ErrorBoundary fallback={fallback}>
                <Component {...props} />
            </ErrorBoundary>
        );
    };
}

export default ErrorBoundary;
