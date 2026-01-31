"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { MONTHS_TR } from "@/lib/utils";
import { useToast } from "@/components/ToastProvider";
import * as XLSX from "xlsx";

interface AttendanceRow {
    id: string;
    sicil_no: string;
    ad_soyad: string;
    tc_kimlik_no: string;
    gorevi: string;
    proje_adi: string;
    grup: string;
    egitim_kodu: string;
    egitim_alt_basligi: string | null;
    baslama_tarihi: string;
    bitis_tarihi: string;
    egitim_suresi_dk: number;
    baslama_saati: string;
    bitis_saati: string;
    egitim_yeri: string;
    egitmen_adi: string | null;
    sonuc_belgesi_turu: string;
    ic_dis_egitim: string;
    egitim_detayli_aciklama: string | null;
    veri_giren_sicil: string;
    veri_giren_ad_soyad: string;
    veri_giris_tarihi: string;
    personel_durumu: string;
}

// Tarih modları
type DateMode = 'month' | 'range';

// Sıralama tipi
type SortDirection = 'asc' | 'desc';
interface SortConfig {
    key: keyof AttendanceRow | null;
    direction: SortDirection;
}

// Inline Editable Cell Component
interface EditableCellProps {
    value: string;
    rowId: string;
    field: string;
    type?: 'text' | 'date' | 'time' | 'number' | 'select';
    options?: { value: string; label: string }[];
    onSave: (rowId: string, field: string, value: string) => Promise<void>;
    className?: string;
}

function EditableCell({ value, rowId, field, type = 'text', options, onSave, className = '' }: EditableCellProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [editValue, setEditValue] = useState(value);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        setEditValue(value);
    }, [value]);

    const handleSave = async () => {
        if (editValue === value) {
            setIsEditing(false);
            return;
        }

        setIsSaving(true);
        try {
            await onSave(rowId, field, editValue);
            setIsEditing(false);
        } catch (err) {
            setEditValue(value); // Revert on error
        } finally {
            setIsSaving(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSave();
        } else if (e.key === 'Escape') {
            setEditValue(value);
            setIsEditing(false);
        }
    };

    const handleBlur = () => {
        handleSave();
    };

    if (isEditing) {
        if (type === 'select' && options) {
            return (
                <select
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onBlur={handleBlur}
                    onKeyDown={handleKeyDown}
                    disabled={isSaving}
                    className={`w-full px-1 py-0.5 text-xs border border-blue-500 rounded focus:ring-1 focus:ring-blue-500 ${className}`}
                    autoFocus
                >
                    {options.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                </select>
            );
        }

        return (
            <input
                type={type}
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onBlur={handleBlur}
                onKeyDown={handleKeyDown}
                disabled={isSaving}
                className={`w-full px-1 py-0.5 text-xs border border-blue-500 rounded focus:ring-1 focus:ring-blue-500 ${className}`}
                autoFocus
            />
        );
    }

    return (
        <div
            onClick={() => setIsEditing(true)}
            className={`cursor-pointer hover:bg-blue-50 hover:text-blue-700 rounded px-1 py-0.5 transition-colors ${className} ${isSaving ? 'opacity-50' : ''}`}
            title="Düzenlemek için tıklayın"
        >
            {value || '-'}
        </div>
    );
}

// Status Toggle Component
interface StatusToggleProps {
    value: string;
    rowId: string;
    onSave: (rowId: string, field: string, value: string) => Promise<void>;
}

function StatusToggle({ value, rowId, onSave }: StatusToggleProps) {
    const [isSaving, setIsSaving] = useState(false);

    const toggleStatus = async () => {
        const newStatus = value === 'CALISAN' ? 'AYRILDI' : 'CALISAN';
        setIsSaving(true);
        try {
            await onSave(rowId, 'personel_durumu', newStatus);
        } finally {
            setIsSaving(false);
        }
    };

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'CALISAN':
                return 'bg-green-100 text-green-800 hover:bg-green-200';
            case 'AYRILDI':
                return 'bg-red-100 text-red-800 hover:bg-red-200';
            case 'PASIF':
                return 'bg-gray-200 text-gray-600 hover:bg-gray-300';
            case 'IZINLI':
                return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200';
            default:
                return 'bg-gray-100 text-gray-700 hover:bg-gray-200';
        }
    };

    return (
        <button
            onClick={toggleStatus}
            disabled={isSaving}
            className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors cursor-pointer ${getStatusStyle(value)} ${isSaving ? 'opacity-50' : ''}`}
            title="Durumu değiştirmek için tıklayın (Çalışan ↔ Ayrıldı)"
        >
            {isSaving ? '...' : value}
        </button>
    );
}

// Inline Text Area Component for longer text
interface EditableTextAreaProps {
    value: string | null;
    rowId: string;
    field: string;
    onSave: (rowId: string, field: string, value: string) => Promise<void>;
    className?: string;
    maxLength?: number;
}

function EditableTextArea({ value, rowId, field, onSave, className = '', maxLength = 200 }: EditableTextAreaProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [editValue, setEditValue] = useState(value || '');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        setEditValue(value || '');
    }, [value]);

    const handleSave = async () => {
        const currentValue = value || '';
        if (editValue === currentValue) {
            setIsEditing(false);
            return;
        }

        setIsSaving(true);
        try {
            await onSave(rowId, field, editValue);
            setIsEditing(false);
        } catch (err) {
            setEditValue(currentValue);
        } finally {
            setIsSaving(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && e.ctrlKey) {
            handleSave();
        } else if (e.key === 'Escape') {
            setEditValue(value || '');
            setIsEditing(false);
        }
    };

    if (isEditing) {
        return (
            <div className="relative">
                <textarea
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onBlur={handleSave}
                    onKeyDown={handleKeyDown}
                    disabled={isSaving}
                    maxLength={maxLength}
                    rows={2}
                    className={`w-full px-1 py-0.5 text-xs border border-blue-500 rounded focus:ring-1 focus:ring-blue-500 resize-none ${className}`}
                    autoFocus
                />
                <div className="text-[9px] text-gray-400 mt-0.5">
                    Ctrl+Enter: Kaydet | Esc: İptal
                </div>
            </div>
        );
    }

    const displayValue = value || '-';
    return (
        <div
            onClick={() => setIsEditing(true)}
            className={`cursor-pointer hover:bg-blue-50 hover:text-blue-700 rounded px-1 py-0.5 transition-colors truncate ${className} ${isSaving ? 'opacity-50' : ''}`}
            title={displayValue}
        >
            {displayValue}
        </div>
    );
}

// Sortable Header Component
interface SortableHeaderProps {
    label: string;
    sortKey: keyof AttendanceRow;
    currentSort: SortConfig;
    onSort: (key: keyof AttendanceRow) => void;
    className?: string;
}

function SortableHeader({ label, sortKey, currentSort, onSort, className = '' }: SortableHeaderProps) {
    const isActive = currentSort.key === sortKey;

    return (
        <th
            onClick={() => onSort(sortKey)}
            className={`px-3 py-3 text-left font-semibold text-gray-700 cursor-pointer hover:bg-gray-200 transition-colors select-none ${className}`}
        >
            <div className="flex items-center gap-1">
                <span>{label}</span>
                <span className="text-gray-400">
                    {isActive ? (
                        currentSort.direction === 'asc' ? '↑' : '↓'
                    ) : (
                        '↕'
                    )}
                </span>
            </div>
        </th>
    );
}

export default function MonthlyReportPage() {
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;

    // Tarih modu - aylık veya tarih aralığı
    const [dateMode, setDateMode] = useState<DateMode>('month');
    
    // Aylık mod için
    const [year, setYear] = useState(currentYear);
    const [month, setMonth] = useState(currentMonth);
    
    // Tarih aralığı modu için
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    const [data, setData] = useState<{
        rows: AttendanceRow[];
        total_participation: number;
        total_minutes: number;
    } | null>(null);
    const [loading, setLoading] = useState(false);
    
    // Silme modalı
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [deleteLoading, setDeleteLoading] = useState(false);
    
    // Arama ve filtreleme
    const [searchTerm, setSearchTerm] = useState('');
    
    // Sıralama
    const [sortConfig, setSortConfig] = useState<SortConfig>({ key: null, direction: 'asc' });
    
    // Toplu seçim
    const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
    const [bulkDeleteLoading, setBulkDeleteLoading] = useState(false);
    const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
    
    // Sayfalama
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(50);
    
    const toast = useToast();

    // İlk yüklemede veri çek
    useEffect(() => {
        loadData();
    }, []);

    // Ay değiştiğinde yeniden yükle (sadece month modunda)
    useEffect(() => {
        if (dateMode === 'month') {
            loadData();
        }
    }, [year, month]);

    // Arama veya sıralama değiştiğinde sayfayı sıfırla
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, sortConfig]);

    const loadData = async () => {
        setLoading(true);
        try {
            let url = '/api/reports/monthly';
            if (dateMode === 'range' && startDate && endDate) {
                url += `?startDate=${startDate}&endDate=${endDate}`;
            } else {
                url += `?year=${year}&month=${month}`;
            }
            
            const res = await fetch(url);
            const result = await res.json();
            if (result.success) {
                setData(result.data);
                setSelectedRows(new Set()); // Seçimleri temizle
            }
        } catch (err) {
            console.error("Failed to load data:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleSearchRange = () => {
        if (!startDate || !endDate) {
            toast.error("Lütfen başlangıç ve bitiş tarihlerini seçin");
            return;
        }
        if (startDate > endDate) {
            toast.error("Başlangıç tarihi bitiş tarihinden sonra olamaz");
            return;
        }
        loadData();
    };

    // Hızlı tarih seçimi
    const setQuickRange = (type: 'thisMonth' | 'lastMonth' | 'last3Months' | 'thisYear') => {
        const now = new Date();
        let start: Date, end: Date;
        
        switch (type) {
            case 'thisMonth':
                start = new Date(now.getFullYear(), now.getMonth(), 1);
                end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
                break;
            case 'lastMonth':
                start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                end = new Date(now.getFullYear(), now.getMonth(), 0);
                break;
            case 'last3Months':
                start = new Date(now.getFullYear(), now.getMonth() - 2, 1);
                end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
                break;
            case 'thisYear':
                start = new Date(now.getFullYear(), 0, 1);
                end = new Date(now.getFullYear(), 11, 31);
                break;
        }
        
        setStartDate(start.toISOString().split('T')[0]);
        setEndDate(end.toISOString().split('T')[0]);
    };

    const handleDelete = async (id: string) => {
        setDeleteLoading(true);
        try {
            const res = await fetch(`/api/attendances?id=${id}`, {
                method: "DELETE",
            });
            const result = await res.json();
            if (result.success) {
                toast.success("Kayıt başarıyla silindi");
                loadData();
                setDeleteId(null);
            } else {
                toast.error(result.message || "Silme işlemi başarısız");
            }
        } catch (err) {
            console.error("Delete failed:", err);
            toast.error("Silme işlemi başarısız");
        } finally {
            setDeleteLoading(false);
        }
    };

    // Toplu silme
    const handleBulkDelete = async () => {
        if (selectedRows.size === 0) return;
        
        setBulkDeleteLoading(true);
        try {
            const res = await fetch('/api/attendances', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ids: Array.from(selectedRows) })
            });
            const result = await res.json();
            if (result.success) {
                toast.success(`${result.deletedCount} kayıt silindi`);
                loadData();
                setShowBulkDeleteConfirm(false);
                setSelectedRows(new Set());
            } else {
                toast.error(result.message || "Toplu silme başarısız");
            }
        } catch (err) {
            console.error("Bulk delete failed:", err);
            toast.error("Toplu silme işlemi başarısız");
        } finally {
            setBulkDeleteLoading(false);
        }
    };

    // Inline edit handler - auto save
    const handleInlineEdit = useCallback(async (rowId: string, field: string, value: string) => {
        try {
            const res = await fetch('/api/attendances', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: rowId,
                    field: field,
                    value: value
                })
            });
            const result = await res.json();
            if (result.success) {
                // Update local state
                setData(prev => {
                    if (!prev) return prev;
                    return {
                        ...prev,
                        rows: prev.rows.map(row => 
                            row.id === rowId 
                                ? { ...row, [field]: value }
                                : row
                        )
                    };
                });
                toast.success("Güncellendi");
            } else {
                toast.error(result.message || "Güncelleme başarısız");
                throw new Error(result.message);
            }
        } catch (err) {
            console.error("Inline edit failed:", err);
            toast.error("Güncelleme başarısız");
            throw err;
        }
    }, [toast]);

    // Sıralama işleyici
    const handleSort = (key: keyof AttendanceRow) => {
        setSortConfig(current => ({
            key,
            direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc'
        }));
    };

    // Satır seçim işleyicileri
    const toggleRowSelection = (id: string) => {
        setSelectedRows(prev => {
            const newSet = new Set(prev);
            if (newSet.has(id)) {
                newSet.delete(id);
            } else {
                newSet.add(id);
            }
            return newSet;
        });
    };

    const toggleAllSelection = () => {
        if (selectedRows.size === filteredAndSortedRows.length) {
            setSelectedRows(new Set());
        } else {
            setSelectedRows(new Set(filteredAndSortedRows.map(row => row.id)));
        }
    };

    // Filtreleme ve sıralama
    const filteredAndSortedRows = useMemo(() => {
        if (!data?.rows) return [];
        
        let rows = [...data.rows];
        
        // Arama filtresi
        if (searchTerm) {
            const searchLower = searchTerm.toLowerCase();
            rows = rows.filter(row =>
                row.sicil_no.toLowerCase().includes(searchLower) ||
                row.ad_soyad.toLowerCase().includes(searchLower) ||
                row.egitim_kodu.toLowerCase().includes(searchLower) ||
                row.proje_adi.toLowerCase().includes(searchLower) ||
                row.grup.toLowerCase().includes(searchLower) ||
                (row.egitim_alt_basligi?.toLowerCase().includes(searchLower) ?? false)
            );
        }
        
        // Sıralama
        if (sortConfig.key) {
            rows.sort((a, b) => {
                const aValue = a[sortConfig.key!];
                const bValue = b[sortConfig.key!];
                
                if (aValue === null || aValue === undefined) return 1;
                if (bValue === null || bValue === undefined) return -1;
                
                if (typeof aValue === 'string' && typeof bValue === 'string') {
                    return sortConfig.direction === 'asc' 
                        ? aValue.localeCompare(bValue, 'tr')
                        : bValue.localeCompare(aValue, 'tr');
                }
                
                if (typeof aValue === 'number' && typeof bValue === 'number') {
                    return sortConfig.direction === 'asc' 
                        ? aValue - bValue 
                        : bValue - aValue;
                }
                
                return 0;
            });
        }
        
        return rows;
    }, [data?.rows, searchTerm, sortConfig]);

    // Sayfalama
    const paginatedRows = useMemo(() => {
        const start = (currentPage - 1) * rowsPerPage;
        return filteredAndSortedRows.slice(start, start + rowsPerPage);
    }, [filteredAndSortedRows, currentPage, rowsPerPage]);

    const totalPages = Math.ceil(filteredAndSortedRows.length / rowsPerPage);

    const exportToExcel = () => {
        if (!filteredAndSortedRows.length) return;

        const exportData = filteredAndSortedRows.map(row => ({
            "Sicil No": row.sicil_no,
            "Ad Soyad": row.ad_soyad,
            "TC Kimlik": row.tc_kimlik_no,
            "Görevi": row.gorevi,
            "Proje": row.proje_adi,
            "Grup": row.grup,
            "Eğitim Kodu": row.egitim_kodu,
            "Eğitim Alt Başlık": row.egitim_alt_basligi || "",
            "Eğitim Başlama Tarihi": row.baslama_tarihi,
            "Eğitim Bitiş Tarihi": row.bitis_tarihi,
            "Eğitim Süresi (dk)": row.egitim_suresi_dk,
            "Eğitim Başlama Saati": row.baslama_saati,
            "Eğitim Bitiş Saati": row.bitis_saati,
            "Eğitim Yeri": row.egitim_yeri,
            "Eğitmen Adı": row.egitmen_adi || "",
            "Sonuç Belgesi": row.sonuc_belgesi_turu,
            "İç/Dış Eğitim": row.ic_dis_egitim === 'IC' ? 'İç' : 'Dış',
            "Eğitim Detay": row.egitim_detayli_aciklama || "",
            "Veri Giren": `${row.veri_giren_sicil} - ${row.veri_giren_ad_soyad}`,
            "Veri Giriş Tarihi": row.veri_giris_tarihi ? new Date(row.veri_giris_tarihi).toLocaleString("tr-TR") : "",
            "Personel Durumu": row.personel_durumu
        }));

        const ws = XLSX.utils.json_to_sheet(exportData);
        const colWidths = Object.keys(exportData[0] || {}).map(() => ({ wch: 16 }));
        ws['!cols'] = colWidths;

        const wb = XLSX.utils.book_new();
        
        let sheetName: string;
        let fileName: string;
        if (dateMode === 'range') {
            sheetName = `${startDate}_${endDate}`;
            fileName = `Rapor_${startDate}_${endDate}.xlsx`;
        } else {
            sheetName = `${MONTHS_TR[month - 1]} ${year}`;
            fileName = `Aylik_Rapor_${MONTHS_TR[month - 1]}_${year}.xlsx`;
        }
        
        XLSX.utils.book_append_sheet(wb, ws, sheetName.substring(0, 31));
        XLSX.writeFile(wb, fileName);
    };

    const years = Array.from({ length: 10 }, (_, i) => currentYear - 5 + i);

    const totalMinutes = data?.total_minutes || 0;
    const uniqueTrainings = new Set(data?.rows.map(r => r.egitim_kodu) || []).size;

    // Options for select fields
    const documentTypeOptions = [
        { value: 'EGITIM_KATILIM_CIZELGESI', label: 'Eğitim Katılım Çizelgesi' },
        { value: 'SERTIFIKA', label: 'Sertifika' }
    ];

    const icDisOptions = [
        { value: 'IC', label: 'İç' },
        { value: 'DIS', label: 'Dış' }
    ];

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Aylık Genel Tablo</h1>
                    <p className="text-sm text-gray-500">Seçili döneme ait tüm katılım kayıtları</p>
                </div>

                <div className="flex flex-wrap gap-2">
                    {/* Yenile Butonu */}
                    <button
                        onClick={loadData}
                        disabled={loading}
                        className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 font-medium flex items-center gap-2 disabled:opacity-50 text-sm"
                    >
                        <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        <span>Yenile</span>
                    </button>

                    <button
                        onClick={exportToExcel}
                        disabled={!filteredAndSortedRows.length}
                        className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 font-medium flex items-center gap-2 disabled:opacity-50 text-sm"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <span>Excel İndir</span>
                    </button>
                </div>
            </div>

            {/* Tarih Seçimi */}
            <div className="bg-white rounded-xl shadow-sm border p-4">
                {/* Mod Seçimi */}
                <div className="flex gap-2 mb-4">
                    <button
                        onClick={() => setDateMode('month')}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                            dateMode === 'month' 
                                ? 'bg-blue-600 text-white' 
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                    >
                        Ay Seçimi
                    </button>
                    <button
                        onClick={() => setDateMode('range')}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                            dateMode === 'range' 
                                ? 'bg-blue-600 text-white' 
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                    >
                        Tarih Aralığı
                    </button>
                </div>

                {dateMode === 'month' ? (
                    <div className="flex flex-wrap items-center gap-2">
                        <select
                            value={year}
                            onChange={(e) => setYear(parseInt(e.target.value))}
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                            title="Yıl"
                        >
                            {years.map((y) => (
                                <option key={y} value={y}>{y}</option>
                            ))}
                        </select>

                        <select
                            value={month}
                            onChange={(e) => setMonth(parseInt(e.target.value))}
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                            title="Ay"
                        >
                            {MONTHS_TR.map((m, i) => (
                                <option key={i} value={i + 1}>{m}</option>
                            ))}
                        </select>
                    </div>
                ) : (
                    <div className="space-y-3">
                        <div className="flex flex-wrap items-center gap-2">
                            <div className="flex items-center gap-2">
                                <label className="text-sm text-gray-600">Başlangıç:</label>
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                                    title="Başlangıç Tarihi"
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <label className="text-sm text-gray-600">Bitiş:</label>
                                <input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                                    title="Bitiş Tarihi"
                                />
                            </div>
                            <button
                                onClick={handleSearchRange}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm"
                            >
                                Ara
                            </button>
                        </div>
                        
                        <div className="flex flex-wrap gap-2">
                            <span className="text-xs text-gray-500 self-center">Hızlı seçim:</span>
                            <button
                                onClick={() => setQuickRange('thisMonth')}
                                className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                            >
                                Bu Ay
                            </button>
                            <button
                                onClick={() => setQuickRange('lastMonth')}
                                className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                            >
                                Geçen Ay
                            </button>
                            <button
                                onClick={() => setQuickRange('last3Months')}
                                className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                            >
                                Son 3 Ay
                            </button>
                            <button
                                onClick={() => setQuickRange('thisYear')}
                                className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                            >
                                Bu Yıl
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Summary Cards */}
            {data && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="bg-white rounded-xl shadow-sm border p-4">
                        <p className="text-sm text-gray-500">Toplam Katılım</p>
                        <p className="text-2xl font-bold text-gray-900">{data.total_participation}</p>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm border p-4">
                        <p className="text-sm text-gray-500">Toplam Dakika</p>
                        <p className="text-2xl font-bold text-blue-600">{totalMinutes.toLocaleString()}</p>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm border p-4">
                        <p className="text-sm text-gray-500">Toplam Saat</p>
                        <p className="text-2xl font-bold text-green-600">{(totalMinutes / 60).toFixed(1)}</p>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm border p-4">
                        <p className="text-sm text-gray-500">Farklı Eğitim</p>
                        <p className="text-2xl font-bold text-purple-600">{uniqueTrainings}</p>
                    </div>
                </div>
            )}

            {/* Search and Filters */}
            {data && (
                <div className="bg-white rounded-xl shadow-sm border p-4">
                    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                        <div className="flex-1 max-w-md">
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Sicil No, Ad Soyad, Eğitim Kodu, Proje, Grup ara..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                                />
                                <svg className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                            <span>Filtrelenen: <strong>{filteredAndSortedRows.length}</strong> / {data.rows.length}</span>
                            
                            {/* Sayfa başı kayıt seçimi */}
                            <select
                                value={rowsPerPage}
                                onChange={(e) => {
                                    setRowsPerPage(parseInt(e.target.value));
                                    setCurrentPage(1);
                                }}
                                className="px-2 py-1 border border-gray-300 rounded text-sm"
                                title="Sayfa başı kayıt sayısı"
                            >
                                <option value={25}>25</option>
                                <option value={50}>50</option>
                                <option value={100}>100</option>
                                <option value={200}>200</option>
                            </select>
                        </div>
                    </div>

                    {/* Toplu İşlemler */}
                    {selectedRows.size > 0 && (
                        <div className="mt-4 p-3 bg-blue-50 rounded-lg flex items-center justify-between">
                            <span className="text-sm text-blue-800">
                                <strong>{selectedRows.size}</strong> kayıt seçildi
                            </span>
                            <button
                                onClick={() => setShowBulkDeleteConfirm(true)}
                                className="px-3 py-1.5 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 flex items-center gap-1"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                                Seçilenleri Sil
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Table */}
            {loading ? (
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
            ) : data?.rows.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm border p-8 text-center">
                    <p className="text-gray-500">Bu dönem için kayıt bulunmuyor.</p>
                </div>
            ) : filteredAndSortedRows.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm border p-8 text-center">
                    <p className="text-gray-500">Arama kriterlerine uygun kayıt bulunamadı.</p>
                </div>
            ) : (
                <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                    <div className="p-3 bg-gray-50 border-b flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-600">Detaylı Tablo (Inline Düzenleme Aktif)</span>
                        <span className="text-xs text-gray-500">Hücrelere tıklayarak düzenleyin | Sütun başlıklarına tıklayarak sıralayın</span>
                    </div>
                    <div className="overflow-x-auto" style={{ maxHeight: '60vh' }}>
                        <table className="min-w-max w-full divide-y divide-gray-200 text-xs">
                            <thead className="bg-gray-100 sticky top-0 z-10">
                                <tr>
                                    {/* Checkbox */}
                                    <th className="px-2 py-3 text-center bg-gray-100 border-r">
                                        <input
                                            type="checkbox"
                                            checked={selectedRows.size === filteredAndSortedRows.length && filteredAndSortedRows.length > 0}
                                            onChange={toggleAllSelection}
                                            className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                            title="Tümünü seç"
                                        />
                                    </th>
                                    {/* Personel Bilgileri */}
                                    <SortableHeader label="Sicil No" sortKey="sicil_no" currentSort={sortConfig} onSort={handleSort} className="bg-blue-50 border-r" />
                                    <SortableHeader label="Ad Soyad" sortKey="ad_soyad" currentSort={sortConfig} onSort={handleSort} className="bg-blue-50" />
                                    <th className="px-3 py-3 text-left font-semibold text-gray-700 bg-blue-50">TC Kimlik</th>
                                    <SortableHeader label="Görevi" sortKey="gorevi" currentSort={sortConfig} onSort={handleSort} className="bg-blue-50" />
                                    <SortableHeader label="Proje" sortKey="proje_adi" currentSort={sortConfig} onSort={handleSort} className="bg-blue-50" />
                                    <SortableHeader label="Grup" sortKey="grup" currentSort={sortConfig} onSort={handleSort} className="bg-blue-50 border-r" />
                                    {/* Eğitim Bilgileri */}
                                    <SortableHeader label="Eğitim Kodu" sortKey="egitim_kodu" currentSort={sortConfig} onSort={handleSort} className="bg-green-50" />
                                    <th className="px-3 py-3 text-left font-semibold text-gray-700 bg-green-50 border-r">Alt Başlık</th>
                                    {/* Zaman Bilgileri */}
                                    <SortableHeader label="Baş. Tarihi" sortKey="baslama_tarihi" currentSort={sortConfig} onSort={handleSort} className="bg-yellow-50" />
                                    <SortableHeader label="Bit. Tarihi" sortKey="bitis_tarihi" currentSort={sortConfig} onSort={handleSort} className="bg-yellow-50" />
                                    <SortableHeader label="Süre (dk)" sortKey="egitim_suresi_dk" currentSort={sortConfig} onSort={handleSort} className="bg-yellow-50 text-right" />
                                    <th className="px-3 py-3 text-left font-semibold text-gray-700 bg-yellow-50">Baş. Saati</th>
                                    <th className="px-3 py-3 text-left font-semibold text-gray-700 bg-yellow-50 border-r">Bit. Saati</th>
                                    {/* Detay Bilgileri */}
                                    <th className="px-3 py-3 text-left font-semibold text-gray-700 bg-orange-50">Eğitim Yeri</th>
                                    <th className="px-3 py-3 text-left font-semibold text-gray-700 bg-orange-50 border-r">Eğitmen Adı</th>
                                    {/* Belge & Diğer */}
                                    <th className="px-3 py-3 text-left font-semibold text-gray-700 bg-purple-50">Sonuç Belgesi</th>
                                    <th className="px-3 py-3 text-left font-semibold text-gray-700 bg-purple-50">İç/Dış</th>
                                    <th className="px-3 py-3 text-left font-semibold text-gray-700 bg-purple-50 border-r">Eğitim Detay</th>
                                    {/* Audit */}
                                    <th className="px-3 py-3 text-left font-semibold text-gray-700 bg-red-50">Veri Giren</th>
                                    <th className="px-3 py-3 text-left font-semibold text-gray-700 bg-red-50">Giriş Tar.</th>
                                    <SortableHeader label="Durum" sortKey="personel_durumu" currentSort={sortConfig} onSort={handleSort} className="bg-gray-200" />
                                    <th className="px-3 py-3 text-center font-semibold text-gray-700 bg-gray-100">İşlem</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 bg-white">
                                {paginatedRows.map((row) => (
                                    <tr 
                                        key={row.id} 
                                        className={`hover:bg-gray-50 transition-colors ${selectedRows.has(row.id) ? 'bg-blue-50' : ''}`}
                                    >
                                        <td className="px-2 py-2 text-center border-r">
                                            <input
                                                type="checkbox"
                                                checked={selectedRows.has(row.id)}
                                                onChange={() => toggleRowSelection(row.id)}
                                                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                            />
                                        </td>
                                        <td className="px-3 py-2 font-mono font-medium text-blue-700 bg-blue-50/30 border-r whitespace-nowrap">{row.sicil_no}</td>
                                        <td className="px-3 py-2 whitespace-nowrap">
                                            <EditableCell
                                                value={row.ad_soyad}
                                                rowId={row.id}
                                                field="ad_soyad"
                                                onSave={handleInlineEdit}
                                            />
                                        </td>
                                        <td className="px-3 py-2 text-gray-500 font-mono text-[10px]">{row.tc_kimlik_no}</td>
                                        <td className="px-3 py-2 whitespace-nowrap">
                                            <EditableCell
                                                value={row.gorevi}
                                                rowId={row.id}
                                                field="gorevi"
                                                onSave={handleInlineEdit}
                                            />
                                        </td>
                                        <td className="px-3 py-2 whitespace-nowrap">
                                            <EditableCell
                                                value={row.proje_adi}
                                                rowId={row.id}
                                                field="proje_adi"
                                                onSave={handleInlineEdit}
                                            />
                                        </td>
                                        <td className="px-3 py-2 border-r">
                                            <EditableCell
                                                value={row.grup}
                                                rowId={row.id}
                                                field="grup"
                                                onSave={handleInlineEdit}
                                            />
                                        </td>
                                        <td className="px-3 py-2 font-bold text-green-700 whitespace-nowrap">
                                            <EditableCell
                                                value={row.egitim_kodu}
                                                rowId={row.id}
                                                field="egitim_kodu"
                                                onSave={handleInlineEdit}
                                            />
                                        </td>
                                        <td className="px-3 py-2 text-gray-600 border-r max-w-[150px]">
                                            <EditableTextArea
                                                value={row.egitim_alt_basligi}
                                                rowId={row.id}
                                                field="egitim_alt_basligi"
                                                onSave={handleInlineEdit}
                                                className="max-w-[140px]"
                                            />
                                        </td>
                                        <td className="px-3 py-2 whitespace-nowrap font-mono text-[11px]">
                                            <EditableCell
                                                value={row.baslama_tarihi}
                                                rowId={row.id}
                                                field="baslama_tarihi"
                                                type="date"
                                                onSave={handleInlineEdit}
                                            />
                                        </td>
                                        <td className="px-3 py-2 whitespace-nowrap font-mono text-[11px]">
                                            <EditableCell
                                                value={row.bitis_tarihi}
                                                rowId={row.id}
                                                field="bitis_tarihi"
                                                type="date"
                                                onSave={handleInlineEdit}
                                            />
                                        </td>
                                        <td className="px-3 py-2 text-right font-bold text-orange-700">
                                            <EditableCell
                                                value={row.egitim_suresi_dk.toString()}
                                                rowId={row.id}
                                                field="egitim_suresi_dk"
                                                type="number"
                                                onSave={handleInlineEdit}
                                                className="text-right"
                                            />
                                        </td>
                                        <td className="px-3 py-2 font-mono text-[11px]">
                                            <EditableCell
                                                value={row.baslama_saati}
                                                rowId={row.id}
                                                field="baslama_saati"
                                                type="time"
                                                onSave={handleInlineEdit}
                                            />
                                        </td>
                                        <td className="px-3 py-2 font-mono text-[11px] border-r">
                                            <EditableCell
                                                value={row.bitis_saati}
                                                rowId={row.id}
                                                field="bitis_saati"
                                                type="time"
                                                onSave={handleInlineEdit}
                                            />
                                        </td>
                                        <td className="px-3 py-2 max-w-[120px]">
                                            <EditableCell
                                                value={row.egitim_yeri}
                                                rowId={row.id}
                                                field="egitim_yeri"
                                                onSave={handleInlineEdit}
                                                className="truncate"
                                            />
                                        </td>
                                        <td className="px-3 py-2 border-r whitespace-nowrap">
                                            <EditableCell
                                                value={row.egitmen_adi || ''}
                                                rowId={row.id}
                                                field="egitmen_adi"
                                                onSave={handleInlineEdit}
                                            />
                                        </td>
                                        <td className="px-3 py-2 max-w-[120px] text-[10px]">
                                            <EditableCell
                                                value={row.sonuc_belgesi_turu}
                                                rowId={row.id}
                                                field="sonuc_belgesi_turu"
                                                type="select"
                                                options={documentTypeOptions}
                                                onSave={handleInlineEdit}
                                            />
                                        </td>
                                        <td className="px-3 py-2">
                                            <EditableCell
                                                value={row.ic_dis_egitim}
                                                rowId={row.id}
                                                field="ic_dis_egitim"
                                                type="select"
                                                options={icDisOptions}
                                                onSave={handleInlineEdit}
                                            />
                                        </td>
                                        <td className="px-3 py-2 border-r max-w-[150px]">
                                            <EditableTextArea
                                                value={row.egitim_detayli_aciklama}
                                                rowId={row.id}
                                                field="egitim_detayli_aciklama"
                                                onSave={handleInlineEdit}
                                                className="text-gray-500 text-[10px] max-w-[140px]"
                                            />
                                        </td>
                                        <td className="px-3 py-2 text-gray-500 text-[10px] whitespace-nowrap">{row.veri_giren_sicil} - {row.veri_giren_ad_soyad}</td>
                                        <td className="px-3 py-2 text-gray-400 text-[10px] whitespace-nowrap">
                                            {row.veri_giris_tarihi ? new Date(row.veri_giris_tarihi).toLocaleString("tr-TR") : "-"}
                                        </td>
                                        <td className="px-3 py-2">
                                            <StatusToggle
                                                value={row.personel_durumu}
                                                rowId={row.id}
                                                onSave={handleInlineEdit}
                                            />
                                        </td>
                                        <td className="px-3 py-2 text-center">
                                            <button
                                                onClick={() => setDeleteId(row.id)}
                                                className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                                                title="Sil"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    
                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="p-3 bg-gray-50 border-t flex items-center justify-between">
                            <div className="text-sm text-gray-600">
                                Sayfa {currentPage} / {totalPages} ({filteredAndSortedRows.length} kayıt)
                            </div>
                            <div className="flex gap-1">
                                <button
                                    onClick={() => setCurrentPage(1)}
                                    disabled={currentPage === 1}
                                    className="px-2 py-1 text-sm bg-white border rounded hover:bg-gray-50 disabled:opacity-50"
                                >
                                    «
                                </button>
                                <button
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                    className="px-2 py-1 text-sm bg-white border rounded hover:bg-gray-50 disabled:opacity-50"
                                >
                                    ‹
                                </button>
                                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                    let pageNum;
                                    if (totalPages <= 5) {
                                        pageNum = i + 1;
                                    } else if (currentPage <= 3) {
                                        pageNum = i + 1;
                                    } else if (currentPage >= totalPages - 2) {
                                        pageNum = totalPages - 4 + i;
                                    } else {
                                        pageNum = currentPage - 2 + i;
                                    }
                                    return (
                                        <button
                                            key={pageNum}
                                            onClick={() => setCurrentPage(pageNum)}
                                            className={`px-3 py-1 text-sm rounded ${
                                                currentPage === pageNum
                                                    ? 'bg-blue-600 text-white'
                                                    : 'bg-white border hover:bg-gray-50'
                                            }`}
                                        >
                                            {pageNum}
                                        </button>
                                    );
                                })}
                                <button
                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages}
                                    className="px-2 py-1 text-sm bg-white border rounded hover:bg-gray-50 disabled:opacity-50"
                                >
                                    ›
                                </button>
                                <button
                                    onClick={() => setCurrentPage(totalPages)}
                                    disabled={currentPage === totalPages}
                                    className="px-2 py-1 text-sm bg-white border rounded hover:bg-gray-50 disabled:opacity-50"
                                >
                                    »
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deleteId && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl shadow-xl p-6 max-w-md w-full mx-4">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-red-100 rounded-full">
                                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-bold text-gray-900">Kaydı Sil</h3>
                        </div>
                        <p className="text-gray-600 mb-6">
                            Bu katılım kaydını silmek istediğinize emin misiniz? Bu işlem geri alınamaz.
                        </p>
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setDeleteId(null)}
                                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
                                disabled={deleteLoading}
                            >
                                İptal
                            </button>
                            <button
                                onClick={() => deleteId && handleDelete(deleteId)}
                                disabled={deleteLoading}
                                className="px-4 py-2 text-white bg-red-600 hover:bg-red-700 rounded-lg font-medium transition-colors flex items-center gap-2"
                            >
                                {deleteLoading ? (
                                    <>
                                        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Siliniyor...
                                    </>
                                ) : (
                                    "Evet, Sil"
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Bulk Delete Confirmation Modal */}
            {showBulkDeleteConfirm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl shadow-xl p-6 max-w-md w-full mx-4">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-red-100 rounded-full">
                                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-bold text-gray-900">Toplu Silme</h3>
                        </div>
                        <p className="text-gray-600 mb-6">
                            <strong>{selectedRows.size}</strong> kaydı silmek istediğinize emin misiniz? Bu işlem geri alınamaz.
                        </p>
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setShowBulkDeleteConfirm(false)}
                                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
                                disabled={bulkDeleteLoading}
                            >
                                İptal
                            </button>
                            <button
                                onClick={handleBulkDelete}
                                disabled={bulkDeleteLoading}
                                className="px-4 py-2 text-white bg-red-600 hover:bg-red-700 rounded-lg font-medium transition-colors flex items-center gap-2"
                            >
                                {bulkDeleteLoading ? (
                                    <>
                                        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Siliniyor...
                                    </>
                                ) : (
                                    "Evet, Sil"
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
