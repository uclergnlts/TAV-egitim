"use client";

import { useState, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";

interface ValidationResult {
    sicil_no: string;
    fullName: string;
    gorevi?: string;
    found: boolean;
}

interface SicilValidatorProps {
    sicilNos: string;
    onValidationChange?: (results: ValidationResult[], isValid: boolean) => void;
    className?: string;
}

async function validateSicils(sicils: string[]): Promise<ValidationResult[]> {
    if (sicils.length === 0) return [];
    
    const res = await fetch("/api/personnel/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sicil_nos: sicils })
    });
    const data = await res.json();
    
    if (!data.success) return sicils.map(s => ({ sicil_no: s, fullName: "?", found: false }));
    
    interface PersonnelData {
        sicil_no: string;
        fullName: string;
        gorevi?: string;
    }
    
    const foundMap = new Map<string, PersonnelData>(data.data.map((p: PersonnelData) => [p.sicil_no, p]));
    return sicils.map(sicil => {
        const found = foundMap.get(sicil);
        return found
            ? { sicil_no: sicil, fullName: found.fullName, gorevi: found.gorevi, found: true }
            : { sicil_no: sicil, fullName: "Bulunamadı", found: false };
    });
}

export function SicilValidator({
    sicilNos,
    onValidationChange,
    className = ""
}: SicilValidatorProps) {
    const [parsedSicils, setParsedSicils] = useState<string[]>([]);
    
    // Parse sicil numbers from input
    useEffect(() => {
        const sicils = sicilNos
            .split(/[\n,]+/)
            .map(s => s.trim())
            .filter(s => s.length > 0);
        setParsedSicils(sicils);
    }, [sicilNos]);

    // Validate sicils
    const { data: validationResults = [], isLoading } = useQuery({
        queryKey: ['validate-sicils', parsedSicils],
        queryFn: () => validateSicils(parsedSicils),
        enabled: parsedSicils.length > 0,
        staleTime: 30000, // 30 seconds
    });

    // Notify parent of validation changes
    useEffect(() => {
        if (onValidationChange) {
            const isValid = validationResults.length > 0 && validationResults.every(r => r.found);
            onValidationChange(validationResults, isValid);
        }
    }, [validationResults, onValidationChange]);

    const foundCount = validationResults.filter(r => r.found).length;
    const notFoundCount = validationResults.filter(r => !r.found).length;
    const totalCount = validationResults.length;

    if (totalCount === 0) return null;

    return (
        <div className={`space-y-2 ${className}`}>
            {/* Summary */}
            <div className="flex items-center gap-2 text-sm">
                {isLoading ? (
                    <span className="text-gray-500 flex items-center gap-1">
                        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Doğrulanıyor...
                    </span>
                ) : (
                    <>
                        <span className="text-green-600 font-medium">
                            ✓ {foundCount} bulundu
                        </span>
                        {notFoundCount > 0 && (
                            <>
                                <span className="text-gray-300">|</span>
                                <span className="text-red-600 font-medium">
                                    ✗ {notFoundCount} bulunamadı
                                </span>
                            </>
                        )}
                        <span className="text-gray-400">({totalCount} toplam)</span>
                    </>
                )}
            </div>

            {/* Detailed List */}
            {!isLoading && totalCount > 0 && (
                <div className="max-h-32 overflow-y-auto border border-gray-200 rounded-lg divide-y divide-gray-100">
                    {validationResults.map((result) => (
                        <div
                            key={result.sicil_no}
                            className={`px-3 py-2 flex items-center justify-between text-sm ${
                                result.found ? 'bg-green-50/50' : 'bg-red-50/50'
                            }`}
                        >
                            <div className="flex items-center gap-2">
                                <span className={`font-mono font-medium ${
                                    result.found ? 'text-green-700' : 'text-red-700'
                                }`}>
                                    {result.sicil_no}
                                </span>
                                <span className={result.found ? 'text-gray-700' : 'text-red-600'}>
                                    {result.fullName}
                                </span>
                                {result.gorevi && result.found && (
                                    <span className="text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                                        {result.gorevi}
                                    </span>
                                )}
                            </div>
                            {result.found ? (
                                <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            ) : (
                                <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Warning for not found */}
            {notFoundCount > 0 && (
                <div className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg border border-red-100">
                    <strong>Uyarı:</strong> {notFoundCount} sicil numarası sistemde bulunamadı. 
                    Lütfen kontrol edin veya listeden kaldırın.
                </div>
            )}
        </div>
    );
}
