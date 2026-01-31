"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface Attendance {
    id: string;
    sicil_no: string;
    ad_soyad: string;
    egitim_kodu: string;
    egitim_suresi_dk: number;
    baslama_tarihi: string;
    veri_giris_tarihi: string;
    egitim_yeri?: string;
    egitmen?: string;
}

interface EditFormData {
    id: string;
    baslama_tarihi: string;
    egitim_suresi_dk: number;
    egitim_yeri: string;
}

// API functions
async function fetchMyAttendances(): Promise<Attendance[]> {
    const res = await fetch("/api/attendances/my");
    const data = await res.json();
    if (!data.success) throw new Error(data.message);
    return data.data;
}

async function deleteAttendance(id: string): Promise<void> {
    const res = await fetch(`/api/attendances/${id}`, {
        method: "DELETE",
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.message);
}

async function updateAttendance(id: string, data: Partial<Attendance>): Promise<void> {
    const res = await fetch(`/api/attendances/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });
    const result = await res.json();
    if (!result.success) throw new Error(result.message);
}

export default function ChefHistoryPage() {
    const queryClient = useQueryClient();
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState<EditFormData | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [dateFilter, setDateFilter] = useState("");

    const { data: attendances = [], isLoading, error } = useQuery({
        queryKey: ['my-attendances'],
        queryFn: fetchMyAttendances,
    });

    const deleteMutation = useMutation({
        mutationFn: deleteAttendance,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['my-attendances'] });
        },
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<Attendance> }) => updateAttendance(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['my-attendances'] });
            setEditingId(null);
            setEditForm(null);
        },
    });

    // Filter attendances
    const filteredAttendances = attendances.filter(att => {
        const matchesSearch = 
            att.ad_soyad.toLowerCase().includes(searchTerm.toLowerCase()) ||
            att.sicil_no.includes(searchTerm) ||
            att.egitim_kodu.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesDate = dateFilter 
            ? att.baslama_tarihi.startsWith(dateFilter)
            : true;
        
        return matchesSearch && matchesDate;
    });

    const handleEdit = (attendance: Attendance) => {
        setEditingId(attendance.id);
        setEditForm({
            id: attendance.id,
            baslama_tarihi: attendance.baslama_tarihi,
            egitim_suresi_dk: attendance.egitim_suresi_dk,
            egitim_yeri: attendance.egitim_yeri || "",
        });
    };

    const handleSave = () => {
        if (!editForm) return;
        updateMutation.mutate({
            id: editForm.id,
            data: {
                baslama_tarihi: editForm.baslama_tarihi,
                egitim_suresi_dk: editForm.egitim_suresi_dk,
                egitim_yeri: editForm.egitim_yeri,
            }
        });
    };

    const handleDelete = (id: string) => {
        if (confirm("Bu kaydı silmek istediğinize emin misiniz?")) {
            deleteMutation.mutate(id);
        }
    };

    // Statistics
    const totalRecords = attendances.length;
    const totalHours = Math.round(attendances.reduce((sum, a) => sum + a.egitim_suresi_dk, 0) / 60);
    const uniquePersonnel = new Set(attendances.map(a => a.sicil_no)).size;

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
                <p className="text-red-600">Kayıtlar yüklenirken bir hata oluştu.</p>
                <button 
                    onClick={() => queryClient.invalidateQueries({ queryKey: ['my-attendances'] })}
                    className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                    Tekrar Dene
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Kayıt Geçmişi</h1>
                    <p className="text-gray-500 mt-1">Girdiğiniz eğitim kayıtlarını görüntüleyin ve yönetin.</p>
                </div>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white rounded-xl shadow-sm border p-4">
                    <div className="text-sm text-gray-500">Toplam Kayıt</div>
                    <div className="text-2xl font-bold text-blue-600">{totalRecords}</div>
                </div>
                <div className="bg-white rounded-xl shadow-sm border p-4">
                    <div className="text-sm text-gray-500">Toplam Saat</div>
                    <div className="text-2xl font-bold text-green-600">{totalHours}</div>
                </div>
                <div className="bg-white rounded-xl shadow-sm border p-4">
                    <div className="text-sm text-gray-500">Farklı Personel</div>
                    <div className="text-2xl font-bold text-purple-600">{uniquePersonnel}</div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-xl shadow-sm border p-4">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Ara</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Ad, sicil no veya eğitim kodu..."
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                    </div>
                    <div className="w-full md:w-48">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Tarih Filtresi</label>
                        <input
                            type="month"
                            title="Ay/Yıl Seç"
                            value={dateFilter}
                            onChange={(e) => setDateFilter(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                </div>
            </div>

            {/* Table */}
            {filteredAttendances.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm border p-8 text-center">
                    <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p className="text-gray-500">Henüz kayıt bulunmuyor.</p>
                </div>
            ) : (
                <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Sicil No
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Ad Soyad
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Eğitim Kodu
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Süre (dk)
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Eğitim Tarihi
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Eğitim Yeri
                                    </th>
                                    <th className="relative px-6 py-3">
                                        <span className="sr-only">İşlemler</span>
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {filteredAttendances.map((attendance) => (
                                    <tr key={attendance.id} className="hover:bg-gray-50">
                                        {editingId === attendance.id ? (
                                            // Edit Mode
                                            <>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    {attendance.sicil_no}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    {attendance.ad_soyad}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                                                        {attendance.egitim_kodu}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <input
                                                        type="number"
                                                        title="Eğitim Süresi (dk)"
                                                        value={editForm?.egitim_suresi_dk}
                                                        onChange={(e) => setEditForm(prev => prev ? { ...prev, egitim_suresi_dk: parseInt(e.target.value) || 0 } : null)}
                                                        className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                                                    />
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <input
                                                        type="date"
                                                        title="Eğitim Tarihi"
                                                        value={editForm?.baslama_tarihi}
                                                        onChange={(e) => setEditForm(prev => prev ? { ...prev, baslama_tarihi: e.target.value } : null)}
                                                        className="px-2 py-1 border border-gray-300 rounded text-sm"
                                                    />
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <input
                                                        type="text"
                                                        title="Eğitim Yeri"
                                                        value={editForm?.egitim_yeri}
                                                        onChange={(e) => setEditForm(prev => prev ? { ...prev, egitim_yeri: e.target.value } : null)}
                                                        className="w-32 px-2 py-1 border border-gray-300 rounded text-sm"
                                                    />
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                    <button
                                                        onClick={handleSave}
                                                        disabled={updateMutation.isPending}
                                                        className="text-green-600 hover:text-green-900 mr-3"
                                                    >
                                                        {updateMutation.isPending ? '...' : 'Kaydet'}
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            setEditingId(null);
                                                            setEditForm(null);
                                                        }}
                                                        className="text-gray-600 hover:text-gray-900"
                                                    >
                                                        İptal
                                                    </button>
                                                </td>
                                            </>
                                        ) : (
                                            // View Mode
                                            <>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-mono">
                                                    {attendance.sicil_no}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    {attendance.ad_soyad}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                                                        {attendance.egitim_kodu}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {attendance.egitim_suresi_dk}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {new Date(attendance.baslama_tarihi).toLocaleDateString("tr-TR")}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {attendance.egitim_yeri || "-"}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                    <button
                                                        onClick={() => handleEdit(attendance)}
                                                        className="text-blue-600 hover:text-blue-900 mr-3"
                                                        title="Düzenle"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                                        </svg>
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(attendance.id)}
                                                        disabled={deleteMutation.isPending}
                                                        className="text-red-600 hover:text-red-900"
                                                        title="Sil"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                        </svg>
                                                    </button>
                                                </td>
                                            </>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    
                    {/* Summary */}
                    <div className="bg-gray-50 px-6 py-3 border-t border-gray-200 text-sm text-gray-500">
                        Toplam {filteredAttendances.length} kayıt gösteriliyor
                        {filteredAttendances.length !== attendances.length && ` (toplam ${attendances.length})`}
                    </div>
                </div>
            )}
        </div>
    );
}
