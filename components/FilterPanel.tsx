"use client";

import React, { useState, useCallback } from "react";

export type FilterOperator = "eq" | "ne" | "gt" | "gte" | "lt" | "lte" | "contains" | "startsWith" | "endsWith" | "in" | "between";

export interface FilterField {
    key: string;
    label: string;
    type: "text" | "number" | "date" | "select" | "multiselect" | "boolean";
    options?: { value: string; label: string }[];
    placeholder?: string;
}

export interface FilterValue {
    field: string;
    operator: FilterOperator;
    value: string | string[] | number | number[] | Date | Date[] | boolean;
}

interface FilterPanelProps {
    fields: FilterField[];
    filters: FilterValue[];
    onChange: (filters: FilterValue[]) => void;
    onApply: () => void;
    onReset: () => void;
    loading?: boolean;
}

const operatorLabels: Record<FilterOperator, string> = {
    eq: "Eşittir",
    ne: "Eşit Değil",
    gt: "Büyüktür",
    gte: "Büyük Eşittir",
    lt: "Küçüktür",
    lte: "Küçük Eşittir",
    contains: "İçerir",
    startsWith: "İle Başlar",
    endsWith: "İle Biter",
    in: "İçinde",
    between: "Arasında",
};

const getOperatorsForType = (type: FilterField["type"]): FilterOperator[] => {
    switch (type) {
        case "text":
            return ["eq", "ne", "contains", "startsWith", "endsWith"];
        case "number":
            return ["eq", "ne", "gt", "gte", "lt", "lte", "between"];
        case "date":
            return ["eq", "ne", "gt", "gte", "lt", "lte", "between"];
        case "select":
            return ["eq", "ne", "in"];
        case "multiselect":
            return ["in"];
        case "boolean":
            return ["eq"];
        default:
            return ["eq"];
    }
};

export function FilterPanel({
    fields,
    filters,
    onChange,
    onApply,
    onReset,
    loading = false,
}: FilterPanelProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [newFilter, setNewFilter] = useState<Partial<FilterValue>>({
        field: fields[0]?.key || "",
        operator: "eq",
        value: "",
    });

    const handleAddFilter = useCallback(() => {
        if (!newFilter.field || !newFilter.operator) return;

        const field = fields.find((f) => f.key === newFilter.field);
        if (!field) return;

        let value = newFilter.value;
        if (field.type === "number" && typeof value === "string") {
            value = value === "" ? 0 : parseFloat(value);
        }

        const filter: FilterValue = {
            field: newFilter.field,
            operator: newFilter.operator as FilterOperator,
            value: value || "",
        };

        onChange([...filters, filter]);
        setNewFilter({
            field: fields[0]?.key || "",
            operator: "eq",
            value: "",
        });
    }, [newFilter, filters, fields, onChange]);

    const handleRemoveFilter = useCallback(
        (index: number) => {
            onChange(filters.filter((_, i) => i !== index));
        },
        [filters, onChange]
    );

    const handleUpdateFilter = useCallback(
        (index: number, updates: Partial<FilterValue>) => {
            const updated = [...filters];
            updated[index] = { ...updated[index], ...updates };
            onChange(updated);
        },
        [filters, onChange]
    );

    const selectedField = fields.find((f) => f.key === newFilter.field);
    const availableOperators = selectedField
        ? getOperatorsForType(selectedField.type)
        : [];

    const renderFilterInput = (
        field: FilterField,
        value: unknown,
        onChange: (value: unknown) => void
    ) => {
        switch (field.type) {
            case "select":
                return (
                    <select
                        value={(value as string) || ""}
                        onChange={(e) => onChange(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    >
                        <option value="">Seçin...</option>
                        {field.options?.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                                {opt.label}
                            </option>
                        ))}
                    </select>
                );

            case "multiselect":
                return (
                    <select
                        multiple
                        value={(value as string[]) || []}
                        onChange={(e) => {
                            const selected = Array.from(e.target.selectedOptions).map(
                                (o) => o.value
                            );
                            onChange(selected);
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                        size={Math.min(field.options?.length || 3, 5)}
                    >
                        {field.options?.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                                {opt.label}
                            </option>
                        ))}
                    </select>
                );

            case "boolean":
                return (
                    <select
                        value={String(value)}
                        onChange={(e) => onChange(e.target.value === "true")}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    >
                        <option value="true">Evet</option>
                        <option value="false">Hayır</option>
                    </select>
                );

            case "number":
                return (
                    <input
                        type="number"
                        value={(value as number) || ""}
                        onChange={(e) => onChange(e.target.value === "" ? "" : parseFloat(e.target.value))}
                        placeholder={field.placeholder}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    />
                );

            case "date":
                return (
                    <input
                        type="date"
                        value={(value as string) || ""}
                        onChange={(e) => onChange(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    />
                );

            default:
                return (
                    <input
                        type="text"
                        value={(value as string) || ""}
                        onChange={(e) => onChange(e.target.value)}
                        placeholder={field.placeholder}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    />
                );
        }
    };

    return (
        <div className="bg-white rounded-xl border shadow-sm">
            {/* Header */}
            <div
                className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex items-center gap-2">
                    <svg
                        className="w-5 h-5 text-gray-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                        />
                    </svg>
                    <span className="font-medium text-gray-700">Filtreler</span>
                    {filters.length > 0 && (
                        <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full">
                            {filters.length}
                        </span>
                    )}
                </div>
                <svg
                    className={`w-5 h-5 text-gray-400 transition-transform ${
                        isExpanded ? "rotate-180" : ""
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                    />
                </svg>
            </div>

            {/* Expanded Content */}
            {isExpanded && (
                <div className="border-t px-4 py-4 space-y-4">
                    {/* Active Filters */}
                    {filters.length > 0 && (
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">
                                Aktif Filtreler
                            </label>
                            <div className="flex flex-wrap gap-2">
                                {filters.map((filter, index) => {
                                    const field = fields.find((f) => f.key === filter.field);
                                    return (
                                        <div
                                            key={index}
                                            className="flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg text-sm"
                                        >
                                            <span className="font-medium">{field?.label}</span>
                                            <span className="text-blue-500">
                                                {operatorLabels[filter.operator]}
                                            </span>
                                            <span>
                                                {Array.isArray(filter.value)
                                                    ? filter.value.join(", ")
                                                    : String(filter.value)}
                                            </span>
                                            <button
                                                onClick={() => handleRemoveFilter(index)}
                                                className="ml-1 text-blue-400 hover:text-blue-600"
                                            >
                                                <svg
                                                    className="w-4 h-4"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    viewBox="0 0 24 24"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={2}
                                                        d="M6 18L18 6M6 6l12 12"
                                                    />
                                                </svg>
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Add New Filter */}
                    <div className="space-y-3">
                        <label className="text-sm font-medium text-gray-700">
                            Yeni Filtre Ekle
                        </label>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                            {/* Field Select */}
                            <select
                                aria-label="Filtre alanı"
                                value={newFilter.field}
                                onChange={(e) =>
                                    setNewFilter({
                                        ...newFilter,
                                        field: e.target.value,
                                        operator: "eq",
                                        value: "",
                                    })
                                }
                                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                            >
                                {fields.map((field) => (
                                    <option key={field.key} value={field.key}>
                                        {field.label}
                                    </option>
                                ))}
                            </select>

                            {/* Operator Select */}
                            <select
                                aria-label="Operatör"
                                value={newFilter.operator}
                                onChange={(e) =>
                                    setNewFilter({
                                        ...newFilter,
                                        operator: e.target.value as FilterOperator,
                                    })
                                }
                                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                            >
                                {availableOperators.map((op) => (
                                    <option key={op} value={op}>
                                        {operatorLabels[op]}
                                    </option>
                                ))}
                            </select>

                            {/* Value Input */}
                            <div className="md:col-span-2">
                                {selectedField &&
                                    renderFilterInput(selectedField, newFilter.value, (value) =>
                                        setNewFilter({ ...newFilter, value: value as FilterValue["value"] })
                                    )}
                            </div>
                        </div>

                        <button
                            onClick={handleAddFilter}
                            disabled={!newFilter.field || !newFilter.operator}
                            className="w-full md:w-auto px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Filtre Ekle
                        </button>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-4 border-t">
                        <button
                            onClick={onApply}
                            disabled={loading}
                            className="flex-1 md:flex-none px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50"
                        >
                            {loading ? "Uygulanıyor..." : "Uygula"}
                        </button>
                        <button
                            onClick={onReset}
                            disabled={loading || filters.length === 0}
                            className="flex-1 md:flex-none px-6 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium disabled:opacity-50"
                        >
                            Sıfırla
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default FilterPanel;
