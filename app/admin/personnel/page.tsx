"use client";

import { useState, useEffect } from "react";
import { Edit, Trash2 } from "lucide-react";
import PersonnelModal from "@/components/admin/PersonnelModal";
import { type Personnel } from "@/lib/db/schema";

interface GroupDef {
    id: string;
    name: string;
    isActive: boolean;
}

export default function PersonnelPage() {
    const [personnelList, setPersonnelList] = useState<Personnel[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    // Grup tanımlamaları
    const [groupDefs, setGroupDefs] = useState<GroupDef[]>([]);

    // Sort & Filter
    const [sortConfig, setSortConfig] = useState({ key: "fullName", direction: "asc" });
    const [filters, setFilters] = useState({ grup: "", durum: "" });

    const [showModal, setShowModal] = useState(false);
    const [selectedPersonnel, setSelectedPersonnel] = useState<Personnel | null>(null);

    // Grupları yükle
    useEffect(() => {
        loadGroups();
    }, []);

    useEffect(() => {
        loadPersonnel();
    }, [page, sortConfig, filters]); // Reload when page, sort or filter changes

    const loadGroups = async () => {
        try {
            const res = await fetch("/api/definitions/groups");
            const data = await res.json();
            if (data.success) {
                setGroupDefs(data.data);
            }
        } catch (err) {
            console.error("Gruplar yüklenemedi", err);
        }
    };

    const loadPersonnel = async (query = "") => {
        setLoading(true);
        try {
            // Build URL with params
            const params = new URLSearchParams();
            if (query) params.append("query", query);
            params.append("page", page.toString());
            params.append("limit", "50");
            params.append("sortBy", sortConfig.key);
            params.append("sortOrder", sortConfig.direction);
            if (filters.grup) params.append("filterGrup", filters.grup);
            if (filters.durum) params.append("filterDurumu", filters.durum);

            const res = await fetch(`/api/personnel?${params.toString()}`);
            const data = await res.json();
            if (data.success) {
                // API-side filtering is active, so we rely on API data mainly.
                // But let's keeping consistent with previous logic if needed.
                setPersonnelList(data.data);
                if (data.pagination) {
                    setTotalPages(data.pagination.totalPages);
                }
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setPage(1); // Reset to page 1 on search
        loadPersonnel(search);
    };

    const handleSort = (key: string) => {
        setSortConfig(prev => ({
            key,
            direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc"
        }));
    };

    // handleSubmit functionality moved to PersonnelModal component

    const handleDelete = async (id: string) => {
        if (!confirm("Bu personeli PASİF duruma getirmek istediğinize emin misiniz? Eğitim ve diğer işlemlerde kullanılamayacaktır.")) return;

        try {
            const res = await fetch(`/api/personnel?id=${id}`, { method: "DELETE" });
            const result = await res.json();
            if (result.success) {
                // Listeden anında kaldır (Optimistic/Direct update)
                setPersonnelList(prev => prev.filter(p => p.id !== id));
            } else {
                alert(result.message);
            }
        } catch (err) {
            alert("Silme hatası");
        }
    };

    const handleEdit = (p: Personnel) => {
        setSelectedPersonnel(p);
        setShowModal(true);
    };

    const handleNew = () => {
        setSelectedPersonnel(null);
        setShowModal(true);
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-800">Personel Yönetimi</h1>
                <button
                    onClick={handleNew}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
                >
                    + Yeni Personel Ekle
                </button>
            </div>

            {/* Filters & Search */}
            <div className="bg-white p-4 rounded-xl shadow-sm border flex flex-col md:flex-row gap-4 mb-4">
                {/* Search */}
                <form onSubmit={handleSearch} className="flex-1 flex gap-2">
                    <input
                        type="text"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Sicil No veya Ad Soyad ile ara..."
                        className="flex-1 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
                    />
                    <button type="submit" className="px-6 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-colors">Ara</button>
                </form>

                {/* Filters */}
                <div className="flex gap-2">
                    <select
                        value={filters.grup}
                        onChange={e => { setFilters({ ...filters, grup: e.target.value }); setPage(1); }}
                        className="border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
                    >
                        <option value="">Tüm Gruplar</option>
                        {groupDefs.map(g => (
                            <option key={g.id} value={g.name}>{g.name}</option>
                        ))}
                    </select>

                    <select
                        value={filters.durum}
                        onChange={e => { setFilters({ ...filters, durum: e.target.value }); setPage(1); }}
                        className="border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
                    >
                        <option value="">Tüm Durumlar</option>
                        <option value="CALISAN">ÇALIŞAN</option>
                        <option value="IZINLI">İZİNLİ</option>
                        <option value="AYRILDI">AYRILDI</option>
                        <option value="PASIF">PASİF</option>
                    </select>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th
                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
                                onClick={() => handleSort('sicilNo')}
                            >
                                Sicil No {sortConfig.key === 'sicilNo' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                            </th>
                            <th
                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
                                onClick={() => handleSort('fullName')}
                            >
                                Ad Soyad {sortConfig.key === 'fullName' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">TCKN</th>
                            <th
                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
                                onClick={() => handleSort('gorevi')}
                            >
                                Görevi {sortConfig.key === 'gorevi' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                            </th>
                            <th
                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
                                onClick={() => handleSort('grup')}
                            >
                                Grup {sortConfig.key === 'grup' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                            </th>
                            <th
                                className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
                                onClick={() => handleSort('personelDurumu')}
                            >
                                Durum {sortConfig.key === 'personelDurumu' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">İşlemler</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {personnelList.map(p => (
                            <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{p.sicilNo}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{p.fullName}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{p.tcKimlikNo}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{p.gorevi}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{p.grup}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-center text-sm">
                                    <span className={`px-2.5 py-1 text-xs rounded-full font-medium ${p.personelDurumu === 'CALISAN' ? 'bg-green-100 text-green-800' :
                                        p.personelDurumu === 'AYRILDI' ? 'bg-red-100 text-red-800' :
                                            'bg-gray-100 text-gray-800'
                                        }`}>
                                        {p.personelDurumu}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <div className="flex justify-end gap-2">
                                        <button
                                            onClick={() => handleEdit(p)}
                                            className="text-blue-600 hover:text-blue-900 p-1.5 hover:bg-blue-50 rounded-lg transition-colors"
                                            title="Düzenle"
                                        >
                                            <Edit size={18} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(p.id)}
                                            className="text-red-600 hover:text-red-900 p-1.5 hover:bg-red-50 rounded-lg transition-colors"
                                            title="Pasife Al"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {personnelList.length === 0 && !loading && (
                    <div className="p-12 text-center text-gray-500 flex flex-col items-center">
                        <div className="mb-3 text-gray-300">
                            <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                        </div>
                        <p>Kayıt bulunamadı</p>
                    </div>
                )}
                {loading && (
                    <div className="p-12 text-center text-gray-500">
                        <div className="animate-pulse">Yükleniyor...</div>
                    </div>
                )}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
                <div className="flex justify-center items-center mt-6 gap-4 pb-8">
                    <button
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="px-4 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:hover:bg-white transition-colors"
                    >
                        Önceki
                    </button>
                    <span className="text-sm font-medium text-gray-600">Sayfa {page} / {totalPages}</span>
                    <button
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                        className="px-4 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:hover:bg-white transition-colors"
                    >
                        Sonraki
                    </button>
                </div>
            )}

            {/* Modal */}
            <PersonnelModal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                onSuccess={() => {
                    loadPersonnel(search);
                }}
                editData={selectedPersonnel}
                groupDefs={groupDefs}
            />
        </div>
    );
}
