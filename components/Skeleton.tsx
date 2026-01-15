"use client";

import React from "react";

interface SkeletonProps {
    className?: string;
    width?: string | number;
    height?: string | number;
}

/**
 * Base Skeleton component with pulse animation
 */
export function Skeleton({ className = "", width, height }: SkeletonProps) {
    const style: React.CSSProperties = {};
    if (width) style.width = typeof width === "number" ? `${width}px` : width;
    if (height) style.height = typeof height === "number" ? `${height}px` : height;

    return (
        <div
            className={`bg-gray-200 animate-pulse rounded ${className}`}
            style={style}
        />
    );
}

/**
 * Text skeleton with natural line width variation
 */
export function SkeletonText({ lines = 1, className = "" }: { lines?: number; className?: string }) {
    const widths = ["100%", "92%", "85%", "78%", "95%"];

    return (
        <div className={`space-y-2 ${className}`}>
            {Array.from({ length: lines }).map((_, i) => (
                <Skeleton
                    key={i}
                    height={16}
                    className="rounded"
                    width={widths[i % widths.length]}
                />
            ))}
        </div>
    );
}

/**
 * Circle skeleton for avatars
 */
export function SkeletonCircle({ size = 40 }: { size?: number }) {
    return (
        <div
            className="bg-gray-200 animate-pulse rounded-full"
            style={{ width: size, height: size }}
        />
    );
}

/**
 * Card skeleton
 */
export function SkeletonCard({ className = "" }: { className?: string }) {
    return (
        <div className={`bg-white rounded-xl border p-4 ${className}`}>
            <div className="flex items-center gap-3 mb-4">
                <SkeletonCircle size={40} />
                <div className="flex-1">
                    <Skeleton height={16} width="60%" className="mb-2" />
                    <Skeleton height={12} width="40%" />
                </div>
            </div>
            <SkeletonText lines={3} />
        </div>
    );
}

interface TableSkeletonProps {
    rows?: number;
    columns?: number;
    showHeader?: boolean;
}

/**
 * Table skeleton for loading states
 */
export function TableSkeleton({ rows = 5, columns = 6, showHeader = true }: TableSkeletonProps) {
    return (
        <div className="bg-white rounded-xl border overflow-hidden">
            {showHeader && (
                <div className="bg-gray-50 border-b px-4 py-3 flex gap-4">
                    {Array.from({ length: columns }).map((_, i) => (
                        <Skeleton
                            key={i}
                            height={14}
                            width={`${60 + Math.random() * 40}%`}
                            className="flex-1"
                        />
                    ))}
                </div>
            )}
            <div className="divide-y divide-gray-100">
                {Array.from({ length: rows }).map((_, rowIdx) => (
                    <div key={rowIdx} className="px-4 py-3 flex gap-4 items-center">
                        {Array.from({ length: columns }).map((_, colIdx) => (
                            <Skeleton
                                key={colIdx}
                                height={16}
                                width={colIdx === 0 ? "80px" : `${50 + Math.random() * 50}%`}
                                className="flex-1"
                            />
                        ))}
                    </div>
                ))}
            </div>
        </div>
    );
}

/**
 * Summary cards skeleton
 */
export function SummaryCardsSkeleton({ count = 4 }: { count?: number }) {
    return (
        <div className={`grid grid-cols-2 md:grid-cols-${count} gap-4`}>
            {Array.from({ length: count }).map((_, i) => (
                <div key={i} className="bg-white rounded-xl border p-4">
                    <Skeleton height={14} width="60%" className="mb-2" />
                    <Skeleton height={28} width="40%" />
                </div>
            ))}
        </div>
    );
}
