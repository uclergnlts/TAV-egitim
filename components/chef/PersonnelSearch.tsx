"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Command } from "cmdk";
import { useQuery } from "@tanstack/react-query";

interface Personnel {
    id: string;
    sicilNo: string;
    fullName: string;
    gorevi?: string;
    grup?: string;
}

interface PersonnelSearchProps {
    onSelect: (personnel: Personnel) => void;
    selectedSicils?: string[];
    label?: string;
    placeholder?: string;
    className?: string;
}

async function searchPersonnel(query: string): Promise<Personnel[]> {
    if (!query || query.length < 2) return [];
    
    const res = await fetch(`/api/personnel/search?q=${encodeURIComponent(query)}`);
    const data = await res.json();
    return data.success ? data.data : [];
}

export function PersonnelSearch({
    onSelect,
    selectedSicils = [],
    label = "Personel Ara",
    placeholder = "Ad, soyad veya sicil no ile ara...",
    className = ""
}: PersonnelSearchProps) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");
    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Debounced search
    const { data: results = [], isLoading } = useQuery({
        queryKey: ['personnel-search', search],
        queryFn: () => searchPersonnel(search),
        enabled: search.length >= 2,
        staleTime: 60000, // 1 minute
    });

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

    const handleSelect = useCallback((personnel: Personnel) => {
        onSelect(personnel);
        setSearch("");
        setOpen(false);
        if (inputRef.current) {
            inputRef.current.focus();
        }
    }, [onSelect]);

    // Filter out already selected
    const filteredResults = results.filter(p => !selectedSicils.includes(p.sicilNo));

    return (
        <div ref={containerRef} className={`relative ${className}`}>
            {label && (
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    {label}
                </label>
            )}

            <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                </div>
                <input
                    ref={inputRef}
                    type="text"
                    value={search}
                    onChange={(e) => {
                        setSearch(e.target.value);
                        setOpen(true);
                    }}
                    onFocus={() => setOpen(true)}
                    placeholder={placeholder}
                    className="w-full h-11 pl-10 pr-4 border border-gray-300 rounded-lg shadow-sm
                        focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                        text-sm bg-white"
                />
                {isLoading && (
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                        <svg className="animate-spin h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                    </div>
                )}
            </div>

            {open && search.length >= 2 && (
                <div className="absolute z-50 w-full mt-1 bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden">
                    <Command className="w-full">
                        <Command.List className="max-h-64 overflow-auto py-1">
                            {isLoading ? (
                                <div className="px-4 py-3 text-sm text-gray-500 text-center">
                                    Aranıyor...
                                </div>
                            ) : filteredResults.length === 0 ? (
                                <div className="px-4 py-3 text-sm text-gray-500 text-center">
                                    Sonuç bulunamadı
                                </div>
                            ) : (
                                <Command.Group>
                                    {filteredResults.map((person) => (
                                        <Command.Item
                                            key={person.id}
                                            value={person.sicilNo}
                                            onSelect={() => handleSelect(person)}
                                            className="px-4 py-3 cursor-pointer hover:bg-gray-50 border-b border-gray-50 last:border-0"
                                        >
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <div className="font-medium text-gray-900">
                                                        {person.fullName}
                                                    </div>
                                                    <div className="text-sm text-gray-500 flex items-center gap-2 mt-0.5">
                                                        <span className="font-mono bg-gray-100 px-1.5 py-0.5 rounded text-xs">
                                                            {person.sicilNo}
                                                        </span>
                                                        {person.gorevi && (
                                                            <span>• {person.gorevi}</span>
                                                        )}
                                                        {person.grup && (
                                                            <span className="text-xs bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded">
                                                                {person.grup}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleSelect(person);
                                                    }}
                                                    className="text-blue-600 hover:text-blue-800 text-sm font-medium px-3 py-1 rounded-md hover:bg-blue-50 transition-colors"
                                                >
                                                    Ekle
                                                </button>
                                            </div>
                                        </Command.Item>
                                    ))}
                                </Command.Group>
                            )}
                        </Command.List>
                    </Command>
                </div>
            )}
        </div>
    );
}
