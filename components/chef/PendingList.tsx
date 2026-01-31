"use client";

import { useEffect, useCallback } from "react";

interface PersonnelInfo {
    sicil_no: string;
    fullName: string;
    gorevi: string;
    found: boolean;
}

interface PendingRecord {
    id: string;
    sicil_nos: string[];
    personnel_details: PersonnelInfo[];
    training_name: string;
    training_topic_name?: string;
    trainer_name: string;
    egitim_yeri: string;
    ic_dis_egitim: string;
    baslama_tarihi: string;
    bitis_tarihi: string;
    baslama_saati: string;
    bitis_saati: string;
    duration: number;
}

interface PendingListProps {
    records: PendingRecord[];
    selectedIds: string[];
    onSelectAll: () => void;
    onToggleSelect: (id: string) => void;
    onRemove: (id: string) => void;
    onBulkDelete: () => void;
    onEdit: (record: PendingRecord, mode: 'TRAINING' | 'DATE' | 'TRAINER' | 'PERSONNEL') => void;
    onExportExcel: () => void;
    onExportPDF: () => void;
    onSave: () => void;
    isLoading: boolean;
}

const EditIcon = ({ className }: { className?: string }) => (
    <svg className={className || "w-4 h-4"} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
    </svg>
);

const TrashIcon = ({ className }: { className?: string }) => (
    <svg className={className || "w-4 h-4"} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
);

export function PendingList({
    records,
    selectedIds,
    onSelectAll,
    onToggleSelect,
    onRemove,
    onBulkDelete,
    onEdit,
    onExportExcel,
    onExportPDF,
    onSave,
    isLoading,
}: PendingListProps) {
    // Keyboard shortcuts
    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        // Ctrl/Cmd + A: Select all
        if ((e.ctrlKey || e.metaKey) && e.key === 'a' && records.length > 0) {
            e.preventDefault();
            onSelectAll();
        }
        // Ctrl/Cmd + S: Save
        if ((e.ctrlKey || e.metaKey) && e.key === 's' && records.length > 0) {
            e.preventDefault();
            onSave();
        }
        // Delete: Bulk delete selected
        if (e.key === 'Delete' && selectedIds.length > 0) {
            onBulkDelete();
        }
    }, [records.length, selectedIds.length, onSelectAll, onSave, onBulkDelete]);

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown]);

    if (records.length === 0) return null;

    return (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden mb-12 animate-slideUp">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                <div>
                    <h2 className="text-xl font-bold text-gray-800">Eklenecek Kayıtlar</h2>
                    <p className="text-sm text-gray-500">Aşağıdaki tablodan detayları inceleyebilir ve düzenleyebilirsiniz.</p>
                    <p className="text-xs text-gray-400 mt-1">
                        Kısayollar: Ctrl+A (Tümünü Seç) | Ctrl+S (Kaydet) | Delete (Seçilenleri Sil)
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <button
                        onClick={onExportExcel}
                        className="bg-green-50 text-green-700 px-3 py-2 rounded-lg text-sm font-medium hover:bg-green-100 transition-colors flex items-center gap-1.5"
                        title="Excel olarak indir"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <span className="hidden sm:inline">Excel</span>
                    </button>
                    <button
                        onClick={onExportPDF}
                        className="bg-red-50 text-red-700 px-3 py-2 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors flex items-center gap-1.5"
                        title="PDF olarak indir"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                        <span className="hidden sm:inline">PDF</span>
                    </button>
                    {selectedIds.length > 0 && (
                        <button
                            onClick={onBulkDelete}
                            className="bg-red-100 text-red-700 px-3 py-2 rounded-lg text-sm font-bold hover:bg-red-200 transition-colors"
                        >
                            Sil ({selectedIds.length})
                        </button>
                    )}
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50/50">
                        <tr>
                            <th className="w-10 px-4 py-4">
                                <input
                                    type="checkbox"
                                    title="Tümünü Seç"
                                    onChange={onSelectAll}
                                    checked={records.length > 0 && selectedIds.length === records.length}
                                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Eğitim Detayları</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sicil No</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ad Soyad</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Grubu</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Eğitmen / Yer</th>
                            <th className="relative px-6 py-3">
                                <span className="sr-only">İşlemler</span>
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                        {records.flatMap((record, recordIndex) =>
                            record.personnel_details.map((person, personIndex) => {
                                const isFirstOfGroup = personIndex === 0;
                                const rowSpan = record.personnel_details.length;
                                const rowKey = `${record.id}-${person.sicil_no}`;

                                return (
                                    <tr key={rowKey} className={`hover:bg-blue-50/30 transition-colors ${selectedIds.includes(record.id) ? 'bg-blue-50' : ''} ${!isFirstOfGroup ? 'border-t border-gray-50' : ''}`}>
                                        {isFirstOfGroup && (
                                            <td className="px-4 py-4 whitespace-nowrap" rowSpan={rowSpan}>
                                                <input
                                                    type="checkbox"
                                                    title="Kayıt Seç"
                                                    checked={selectedIds.includes(record.id)}
                                                    onChange={() => onToggleSelect(record.id)}
                                                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                />
                                            </td>
                                        )}

                                        {isFirstOfGroup && (
                                            <td className="px-6 py-4" rowSpan={rowSpan}>
                                                <div className="group relative flex items-start gap-2">
                                                    <div>
                                                        <div className="font-bold text-gray-900">{record.training_name}</div>
                                                        {record.training_topic_name && <div className="text-xs text-orange-600 mt-1">{record.training_topic_name}</div>}
                                                        <div className="text-xs text-gray-500 mt-1">{record.duration} dk • {record.baslama_tarihi}</div>
                                                        <div className="text-xs text-gray-400">{record.baslama_saati} - {record.bitis_saati}</div>
                                                    </div>
                                                    <button
                                                        onClick={() => onEdit(record, 'TRAINING')}
                                                        className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-blue-100 text-blue-600 rounded-md transition-all absolute -right-2 top-0"
                                                        title="Eğitimi Düzenle"
                                                    >
                                                        <EditIcon className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            </td>
                                        )}

                                        <td className="px-6 py-3">
                                            <span className={`font-mono font-bold text-sm px-2 py-1 rounded ${person.found ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
                                                {person.sicil_no}
                                            </span>
                                        </td>

                                        <td className="px-6 py-3">
                                            <span className={`font-medium text-sm ${person.found ? 'text-gray-900' : 'text-red-500'}`}>
                                                {person.fullName}
                                            </span>
                                        </td>

                                        <td className="px-6 py-3">
                                            <span className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded">
                                                {person.gorevi || '-'}
                                            </span>
                                        </td>

                                        {isFirstOfGroup && (
                                            <td className="px-6 py-4" rowSpan={rowSpan}>
                                                <div className="group relative flex items-start gap-2">
                                                    <div>
                                                        <div className="text-sm font-medium text-gray-900">{record.trainer_name}</div>
                                                        <div className="text-xs text-gray-500 mt-0.5">{record.egitim_yeri}</div>
                                                        <div className="text-xs text-gray-400">({record.ic_dis_egitim})</div>
                                                    </div>
                                                    <button
                                                        onClick={() => onEdit(record, 'TRAINER')}
                                                        className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-blue-100 text-blue-600 rounded-md transition-all absolute -right-2 top-0"
                                                        title="Eğitmen/Yer Düzenle"
                                                    >
                                                        <EditIcon className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            </td>
                                        )}

                                        {isFirstOfGroup && (
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium" rowSpan={rowSpan}>
                                                <div className="flex flex-col gap-2 items-end">
                                                    <button
                                                        onClick={() => onEdit(record, 'PERSONNEL')}
                                                        className="text-blue-500 hover:text-blue-700 p-2 hover:bg-blue-50 rounded-lg transition-colors"
                                                        title="Katılımcıları Düzenle"
                                                    >
                                                        <EditIcon className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => onRemove(record.id)}
                                                        className="text-red-400 hover:text-red-600 p-2 hover:bg-red-50 rounded-lg transition-colors"
                                                        title="Listeden Kaldır"
                                                    >
                                                        <TrashIcon className="w-4 h-4" />
                                                    </button>
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

            <div className="bg-gray-50 px-6 py-6 border-t border-gray-200">
                <div className="flex justify-end">
                    <button
                        onClick={onSave}
                        disabled={isLoading}
                        className={`px-8 py-4 bg-green-600 hover:bg-green-700 text-white font-bold text-lg rounded-xl shadow-lg flex items-center gap-3 transition-all transform hover:scale-105 ${isLoading ? 'opacity-70 cursor-wait' : ''}`}
                    >
                        {isLoading ? (
                            <>
                                <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                <span>GÖNDERİLİYOR...</span>
                            </>
                        ) : (
                            <>
                                <span>TÜMÜNÜ KAYDET VE TAMAMLA</span>
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
