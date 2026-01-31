"use client";

import { useState, useRef, useEffect } from "react";
import { Command } from "cmdk";

interface Option {
    value: string;
    label: string;
    group?: string;
}

interface SearchableSelectProps {
    options: Option[];
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    label?: string;
    required?: boolean;
    disabled?: boolean;
    className?: string;
    emptyMessage?: string;
}

export function SearchableSelect({
    options,
    value,
    onChange,
    placeholder = "Ara veya seç...",
    label,
    required = false,
    disabled = false,
    className = "",
    emptyMessage = "Sonuç bulunamadı"
}: SearchableSelectProps) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");
    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const selectedOption = options.find(opt => opt.value === value);

    // Close on outside click
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Focus input when opened
    useEffect(() => {
        if (open && inputRef.current) {
            inputRef.current.focus();
        }
    }, [open]);

    const handleSelect = (selectedValue: string) => {
        onChange(selectedValue);
        setOpen(false);
        setSearch("");
    };

    const filteredOptions = options.filter(opt =>
        opt.label.toLowerCase().includes(search.toLowerCase())
    );

    // Group options if they have group property
    const groupedOptions = filteredOptions.reduce((acc, opt) => {
        const group = opt.group || "Diğer";
        if (!acc[group]) acc[group] = [];
        acc[group].push(opt);
        return acc;
    }, {} as Record<string, Option[]>);

    return (
        <div ref={containerRef} className={`relative ${className}`}>
            {label && (
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    {label}
                    {required && <span className="text-red-500 ml-1">*</span>}
                </label>
            )}

            <button
                type="button"
                onClick={() => !disabled && setOpen(!open)}
                disabled={disabled}
                className={`
                    w-full h-11 px-3 text-left border rounded-lg shadow-sm
                    flex items-center justify-between
                    transition-colors duration-200
                    ${disabled
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200'
                        : 'bg-white border-gray-300 hover:border-gray-400 cursor-pointer'
                    }
                    ${open ? 'ring-2 ring-blue-500 border-blue-500' : ''}
                `}
            >
                <span className={`truncate ${!selectedOption ? 'text-gray-400' : 'text-gray-900'}`}>
                    {selectedOption?.label || placeholder}
                </span>
                <svg
                    className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {open && (
                <div className="absolute z-50 w-full mt-1 bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden">
                    <Command className="w-full">
                        <div className="flex items-center border-b border-gray-200 px-3 py-2">
                            <svg className="w-5 h-5 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            <Command.Input
                                ref={inputRef}
                                value={search}
                                onValueChange={setSearch}
                                placeholder="Ara..."
                                className="flex-1 outline-none text-sm bg-transparent"
                            />
                            {search && (
                                <button
                                    type="button"
                                    onClick={() => setSearch("")}
                                    className="text-gray-400 hover:text-gray-600"
                                    title="Aramayı temizle"
                                    aria-label="Aramayı temizle"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            )}
                        </div>

                        <Command.List className="max-h-64 overflow-auto py-1">
                            {filteredOptions.length === 0 ? (
                                <div className="px-4 py-3 text-sm text-gray-500 text-center">
                                    {emptyMessage}
                                </div>
                            ) : (
                                Object.entries(groupedOptions).map(([group, groupOptions]) => (
                                    <Command.Group
                                        key={group}
                                        heading={group}
                                        className="px-2 py-1"
                                    >
                                        <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-2 py-1">
                                            {group}
                                        </div>
                                        {groupOptions.map(option => (
                                            <Command.Item
                                                key={option.value}
                                                value={option.value}
                                                onSelect={() => handleSelect(option.value)}
                                                className={`
                                                    px-3 py-2 rounded-md cursor-pointer text-sm
                                                    flex items-center justify-between
                                                    ${value === option.value
                                                        ? 'bg-blue-50 text-blue-700'
                                                        : 'text-gray-700 hover:bg-gray-100'
                                                    }
                                                `}
                                            >
                                                <span className="truncate">{option.label}</span>
                                                {value === option.value && (
                                                    <svg className="w-4 h-4 text-blue-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                    </svg>
                                                )}
                                            </Command.Item>
                                        ))}
                                    </Command.Group>
                                ))
                            )}
                        </Command.List>
                    </Command>
                </div>
            )}
        </div>
    );
}
