"use client";

import { useState, useRef } from "react";
import * as XLSX from "xlsx";

interface ExcelImportProps {
    onImport: (sicils: string[]) => void;
    className?: string;
}

export function ExcelImport({ onImport, className = "" }: ExcelImportProps) {
    const [isDragging, setIsDragging] = useState(false);
    const [preview, setPreview] = useState<string[]>([]);
    const [showPreview, setShowPreview] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const processFile = (file: File) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = e.target?.result;
                const workbook = XLSX.read(data, { type: "binary" });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

                // Extract sicil numbers from first column
                const sicils: string[] = [];
                jsonData.forEach((row) => {
                    const firstCell = row[0];
                    if (firstCell && typeof firstCell === "string" || typeof firstCell === "number") {
                        const sicil = String(firstCell).trim();
                        if (sicil && sicil.length > 0) {
                            sicils.push(sicil);
                        }
                    }
                });

                setPreview(sicils);
                setShowPreview(true);
            } catch (err) {
                console.error("Excel parse error:", err);
                alert("Excel dosyası okunurken hata oluştu.");
            }
        };
        reader.readAsBinaryString(file);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            processFile(file);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files[0];
        if (file && (file.name.endsWith('.xlsx') || file.name.endsWith('.xls'))) {
            processFile(file);
        } else {
            alert("Lütfen geçerli bir Excel dosyası yükleyin (.xlsx veya .xls)");
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleConfirm = () => {
        onImport(preview);
        setShowPreview(false);
        setPreview([]);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const handleCancel = () => {
        setShowPreview(false);
        setPreview([]);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    return (
        <div className={className}>
            <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileChange}
                className="hidden"
                id="excel-upload"
            />
            
            <label
                htmlFor="excel-upload"
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                className={`
                    flex flex-col items-center justify-center
                    w-full h-24 
                    border-2 border-dashed rounded-lg
                    cursor-pointer
                    transition-colors duration-200
                    ${isDragging 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-300 bg-gray-50 hover:bg-gray-100'
                    }
                `}
            >
                <div className="flex flex-col items-center justify-center pt-2 pb-2">
                    <svg className="w-6 h-6 text-gray-400 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <p className="text-xs text-gray-500">
                        <span className="font-semibold">Excel'den yükle</span>
                    </p>
                    <p className="text-xs text-gray-400">.xlsx veya sürükle-bırak</p>
                </div>
            </label>

            {/* Preview Modal */}
            {showPreview && (
                <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
                        <div className="bg-gray-50 px-6 py-4 border-b border-gray-100">
                            <h3 className="font-bold text-lg text-gray-800">
                                Excel İçe Aktarım Önizleme
                            </h3>
                            <p className="text-sm text-gray-500">
                                {preview.length} sicil numarası bulundu
                            </p>
                        </div>
                        
                        <div className="p-4">
                            <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">#</th>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Sicil No</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {preview.slice(0, 20).map((sicil, index) => (
                                            <tr key={index}>
                                                <td className="px-4 py-2 text-sm text-gray-500">{index + 1}</td>
                                                <td className="px-4 py-2 text-sm font-mono text-gray-900">{sicil}</td>
                                            </tr>
                                        ))}
                                        {preview.length > 20 && (
                                            <tr>
                                                <td colSpan={2} className="px-4 py-2 text-sm text-gray-400 text-center">
                                                    ... ve {preview.length - 20} sicil daha
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3">
                            <button
                                onClick={handleCancel}
                                className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50"
                            >
                                İptal
                            </button>
                            <button
                                onClick={handleConfirm}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
                            >
                                Ekle ({preview.length})
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
