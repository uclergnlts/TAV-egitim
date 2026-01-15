"use client";

import React, { useState, useRef, useEffect } from "react";

export type SortDirection = "asc" | "desc" | null;

export interface Column<T> {
    key: string;
    label: string;
    sortable?: boolean;
    className?: string;
    headerClassName?: string;
    render?: (row: T, index: number) => React.ReactNode;
}

export interface TableAction<T> {
    label: string;
    icon?: React.ReactNode;
    onClick: (row: T) => void;
    className?: string;
    show?: (row: T) => boolean;
    danger?: boolean;
}

interface EnhancedTableProps<T> {
    data: T[];
    columns: Column<T>[];
    actions?: TableAction<T>[];
    keyField: keyof T;
    sortKey?: string;
    sortDirection?: SortDirection;
    onSort?: (key: string, direction: SortDirection) => void;
    selectedRows?: Set<string>;
    onSelectRow?: (id: string) => void;
    onSelectAll?: (selected: boolean) => void;
    selectable?: boolean;
    loading?: boolean;
    emptyMessage?: string;
    className?: string;
}

export function EnhancedTable<T extends Record<string, any>>({
    data,
    columns,
    actions,
    keyField,
    sortKey,
    sortDirection,
    onSort,
    selectedRows,
    onSelectRow,
    onSelectAll,
    selectable = false,
    loading = false,
    emptyMessage = "Kayıt bulunamadı",
    className = "",
}: EnhancedTableProps<T>) {
    const [openMenuId, setOpenMenuId] = useState<string | null>(null);
    const menuRef = useRef<HTMLDivElement>(null);

    // Close menu on outside click
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setOpenMenuId(null);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSort = (key: string) => {
        if (!onSort) return;
        let newDirection: SortDirection = "asc";
        if (sortKey === key) {
            if (sortDirection === "asc") newDirection = "desc";
            else if (sortDirection === "desc") newDirection = null;
        }
        onSort(key, newDirection);
    };

    const allSelected = data.length > 0 && selectedRows?.size === data.length;
    const someSelected = selectedRows && selectedRows.size > 0 && selectedRows.size < data.length;

    return (
        <div className={`bg-white rounded-xl border shadow-sm overflow-hidden ${className}`}>
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            {selectable && (
                                <th className="w-12 px-4 py-3">
                                    <input
                                        type="checkbox"
                                        checked={allSelected}
                                        ref={(el) => {
                                            if (el) el.indeterminate = !!someSelected;
                                        }}
                                        onChange={(e) => onSelectAll?.(e.target.checked)}
                                        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    />
                                </th>
                            )}
                            {columns.map((col) => (
                                <th
                                    key={col.key}
                                    className={`px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider ${col.sortable ? "cursor-pointer select-none hover:bg-gray-100 transition-colors" : ""
                                        } ${col.headerClassName || ""}`}
                                    onClick={() => col.sortable && handleSort(col.key)}
                                >
                                    <div className="flex items-center gap-1">
                                        <span>{col.label}</span>
                                        {col.sortable && (
                                            <span className="flex flex-col text-[10px] leading-none">
                                                <svg
                                                    className={`w-3 h-3 ${sortKey === col.key && sortDirection === "asc"
                                                        ? "text-blue-600"
                                                        : "text-gray-300"
                                                        }`}
                                                    fill="currentColor"
                                                    viewBox="0 0 24 24"
                                                >
                                                    <path d="M12 5l-8 8h16z" />
                                                </svg>
                                                <svg
                                                    className={`w-3 h-3 -mt-1 ${sortKey === col.key && sortDirection === "desc"
                                                        ? "text-blue-600"
                                                        : "text-gray-300"
                                                        }`}
                                                    fill="currentColor"
                                                    viewBox="0 0 24 24"
                                                >
                                                    <path d="M12 19l8-8H4z" />
                                                </svg>
                                            </span>
                                        )}
                                    </div>
                                </th>
                            ))}
                            {actions && actions.length > 0 && (
                                <th className="w-16 px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">
                                    İşlem
                                </th>
                            )}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {loading ? (
                            <tr>
                                <td colSpan={columns.length + (selectable ? 1 : 0) + (actions ? 1 : 0)} className="px-4 py-8 text-center">
                                    <div className="flex items-center justify-center gap-2 text-gray-500">
                                        <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                        </svg>
                                        Yükleniyor...
                                    </div>
                                </td>
                            </tr>
                        ) : data.length === 0 ? (
                            <tr>
                                <td colSpan={columns.length + (selectable ? 1 : 0) + (actions ? 1 : 0)} className="px-4 py-8 text-center text-gray-500">
                                    {emptyMessage}
                                </td>
                            </tr>
                        ) : (
                            data.map((row, idx) => {
                                const rowId = String(row[keyField]);
                                const isSelected = selectedRows?.has(rowId);

                                return (
                                    <tr
                                        key={rowId}
                                        className={`transition-colors ${isSelected
                                            ? "bg-blue-50 hover:bg-blue-100"
                                            : "hover:bg-gray-50"
                                            }`}
                                    >
                                        {selectable && (
                                            <td className="px-4 py-3">
                                                <input
                                                    type="checkbox"
                                                    checked={isSelected || false}
                                                    onChange={() => onSelectRow?.(rowId)}
                                                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                />
                                            </td>
                                        )}
                                        {columns.map((col) => (
                                            <td key={col.key} className={`px-4 py-3 text-sm ${col.className || ""}`}>
                                                {col.render ? col.render(row, idx) : row[col.key]}
                                            </td>
                                        ))}
                                        {actions && actions.length > 0 && (
                                            <td className="px-4 py-3 text-center relative">
                                                <div ref={openMenuId === rowId ? menuRef : undefined}>
                                                    <button
                                                        onClick={() => setOpenMenuId(openMenuId === rowId ? null : rowId)}
                                                        className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                                                    >
                                                        <svg className="w-5 h-5 text-gray-500" fill="currentColor" viewBox="0 0 24 24">
                                                            <circle cx="12" cy="5" r="2" />
                                                            <circle cx="12" cy="12" r="2" />
                                                            <circle cx="12" cy="19" r="2" />
                                                        </svg>
                                                    </button>

                                                    {/* Dropdown Menu */}
                                                    {openMenuId === rowId && (
                                                        <div className="absolute right-4 top-full mt-1 bg-white rounded-lg shadow-lg border py-1 z-20 min-w-[140px]">
                                                            {actions
                                                                .filter((action) => !action.show || action.show(row))
                                                                .map((action, actionIdx) => (
                                                                    <button
                                                                        key={actionIdx}
                                                                        onClick={() => {
                                                                            action.onClick(row);
                                                                            setOpenMenuId(null);
                                                                        }}
                                                                        className={`w-full px-4 py-2 text-left text-sm flex items-center gap-2 hover:bg-gray-50 transition-colors ${action.danger ? "text-red-600 hover:bg-red-50" : "text-gray-700"
                                                                            } ${action.className || ""}`}
                                                                    >
                                                                        {action.icon}
                                                                        {action.label}
                                                                    </button>
                                                                ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                        )}
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
