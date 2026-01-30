/**
 * Error Boundary Component Tests
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ErrorBoundary } from "@/components/ErrorBoundary";

// Component that throws an error
const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
    if (shouldThrow) {
        throw new Error("Test error");
    }
    return <div>No error</div>;
};

describe("ErrorBoundary", () => {
    // Suppress console.error for expected errors
    beforeEach(() => {
        vi.spyOn(console, "error").mockImplementation(() => {});
    });

    it("should render children when no error", () => {
        render(
            <ErrorBoundary>
                <div data-testid="child">Child content</div>
            </ErrorBoundary>
        );

        expect(screen.getByTestId("child")).toBeInTheDocument();
    });

    it("should render error UI when child throws", () => {
        render(
            <ErrorBoundary>
                <ThrowError shouldThrow={true} />
            </ErrorBoundary>
        );

        expect(screen.getByText("Bir Hata Oluştu")).toBeInTheDocument();
        expect(screen.getByText("Tekrar Dene")).toBeInTheDocument();
    });

    it("should call onError callback when error occurs", () => {
        const onError = vi.fn();
        
        render(
            <ErrorBoundary onError={onError}>
                <ThrowError shouldThrow={true} />
            </ErrorBoundary>
        );

        expect(onError).toHaveBeenCalled();
        expect(onError.mock.calls[0][0]).toBeInstanceOf(Error);
    });

    it("should render custom fallback when provided", () => {
        const customFallback = <div data-testid="custom-fallback">Custom error</div>;
        
        render(
            <ErrorBoundary fallback={customFallback}>
                <ThrowError shouldThrow={true} />
            </ErrorBoundary>
        );

        expect(screen.getByTestId("custom-fallback")).toBeInTheDocument();
    });

    it("should reset error state when retry button clicked", () => {
        const { rerender } = render(
            <ErrorBoundary>
                <ThrowError shouldThrow={true} />
            </ErrorBoundary>
        );

        expect(screen.getByText("Bir Hata Oluştu")).toBeInTheDocument();

        // Click retry
        fireEvent.click(screen.getByText("Tekrar Dene"));

        // Re-render with no error
        rerender(
            <ErrorBoundary>
                <ThrowError shouldThrow={false} />
            </ErrorBoundary>
        );

        expect(screen.getByText("No error")).toBeInTheDocument();
    });

    it("should show reload button", () => {
        const reloadMock = vi.fn();
        Object.defineProperty(window, "location", {
            value: { reload: reloadMock },
            writable: true,
        });

        render(
            <ErrorBoundary>
                <ThrowError shouldThrow={true} />
            </ErrorBoundary>
        );

        expect(screen.getByText("Sayfayı Yenile")).toBeInTheDocument();
    });

    it("should show home button", () => {
        render(
            <ErrorBoundary>
                <ThrowError shouldThrow={true} />
            </ErrorBoundary>
        );

        expect(screen.getByText("Ana Sayfa")).toBeInTheDocument();
    });
});
