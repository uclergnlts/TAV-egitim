"use client";

import { useState, useEffect } from "react";
import { Edit, Trash2 } from "lucide-react";

interface Personnel {
    id: string;
    sicilNo: string;
    fullName: string;
    tcKimlikNo: string;
    gorevi: string;
    projeAdi: string;
    grup: string;
    personelDurumu: string;
    cinsiyet?: string;
    telefon?: string;
    dogumTarihi?: string;
    adres?: string;
}

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
    const [editId, setEditId] = useState<string | null>(null);

    // Form
    const initialForm = {
        sicilNo: "",
        fullName: "",
        tcKimlikNo: "",
        gorevi: "X-Ray Operatörü",
        projeAdi: "TAV ESB",
        grup: "",
        personelDurumu: "CALISAN",
        cinsiyet: "",
        telefon: "",
        dogumTarihi: "",
        adres: ""
    };
    const [formData, setFormData] = useState(initialForm);

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
                // İlk grubu varsayılan yap
                if (data.data.length > 0 && !formData.grup) {
                    setFormData(prev => ({ ...prev, grup: data.data[0].name }));
                }
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const method = editId ? "PUT" : "POST";
            const body = editId ? { ...formData, id: editId } : formData;

            const res = await fetch("/api/personnel", {
                method: method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body)
            });
            const result = await res.json();
            if (result.success) {
                // alert(editId ? "Personel güncellendi" : "Personel eklendi");
                setShowModal(false);
                loadPersonnel(search); // Refresh list
            } else {
                alert(result.message || "Hata");
            }
        } catch (err) {
            alert("Hata oluştu");
        }
    };

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
        setFormData({
            sicilNo: p.sicilNo,
            fullName: p.fullName,
            tcKimlikNo: p.tcKimlikNo,
            gorevi: p.gorevi,
            projeAdi: p.projeAdi,
            grup: p.grup,
            personelDurumu: p.personelDurumu,
            cinsiyet: p.cinsiyet || "",
            telefon: p.telefon || "",
            dogumTarihi: p.dogumTarihi || "",
            adres: p.adres || ""
        });
        setEditId(p.id);
        setShowModal(true);
    };

    const handleNew = () => {
        setFormData(initialForm);
        setEditId(null);
        setShowModal(true);
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-800">Personel Yönetimi</h1>
                <button
                    onClick={handleNew}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
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
                        className="flex-1 border-gray-300 rounded-lg"
                    />
                    <button type="submit" className="px-6 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900">Ara</button>
                </form>

                {/* Filters */}
                <div className="flex gap-2">
                    <select
                        value={filters.grup}
                        onChange={e => { setFilters({ ...filters, grup: e.target.value }); setPage(1); }}
                        className="border-gray-300 rounded-lg text-sm"
                    >
                        <option value="">Tüm Gruplar</option>
                        {groupDefs.map(g => (
                            <option key={g.id} value={g.name}>{g.name}</option>
                        ))}
                    </select>

                    <select
                        value={filters.durum}
                        onChange={e => { setFilters({ ...filters, durum: e.target.value }); setPage(1); }}
                        className="border-gray-300 rounded-lg text-sm"
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
                            <tr key={p.id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{p.sicilNo}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{p.fullName}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{p.tcKimlikNo}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{p.gorevi}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{p.grup}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-center text-sm">
                                    <span className={`px-2 py-1 text-xs rounded-full ${p.personelDurumu === 'CALISAN' ? 'bg-green-100 text-green-800' : p.personelDurumu === 'AYRILDI' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'}`}>
                                        {p.personelDurumu}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <div className="flex justify-end gap-2">
                                        <button
                                            onClick={() => handleEdit(p)}
                                            className="text-blue-600 hover:text-blue-900 p-1 hover:bg-blue-50 rounded"
                                            title="Düzenle"
                                        >
                                            <Edit size={18} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(p.id)}
                                            className="text-red-600 hover:text-red-900 p-1 hover:bg-red-50 rounded"
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
                {personnelList.length === 0 && !loading && <div className="p-6 text-center text-gray-500">Kayıt bulunamadı</div>}
                {loading && <div className="p-6 text-center text-gray-500">Yükleniyor...</div>}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
                <div className="flex justify-center items-center mt-6 gap-4 pb-8">
                    <button
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="px-4 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50"
                    >
                        Önceki
                    </button>
                    <span className="text-sm font-medium">Sayfa {page} / {totalPages}</span>
                    <button
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                        className="px-4 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50"
                    >
                        Sonraki
                    </button>
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold">{editId ? "Personel Düzenle" : "Yeni Personel Ekle"}</h2>
                            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">x</button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Sicil No</label>
                                    <input required type="text" value={formData.sicilNo} onChange={e => setFormData({ ...formData, sicilNo: e.target.value })} className="w-full border-gray-300 rounded-lg" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">TCKN</label>
                                    <input required type="text" value={formData.tcKimlikNo} onChange={e => setFormData({ ...formData, tcKimlikNo: e.target.value })} className="w-full border-gray-300 rounded-lg" />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Ad Soyad</label>
                                <input required type="text" value={formData.fullName} onChange={e => setFormData({ ...formData, fullName: e.target.value })} className="w-full border-gray-300 rounded-lg" />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Cinsiyet</label>
                                    <select value={formData.cinsiyet} onChange={e => setFormData({ ...formData, cinsiyet: e.target.value })} className="w-full border-gray-300 rounded-lg">
                                        <option value="">Seçiniz</option>
                                        <option value="ERKEK">ERKEK</option>
                                        <option value="KADIN">KADIN</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Doğum Tarihi</label>
                                    <input type="date" value={formData.dogumTarihi} onChange={e => setFormData({ ...formData, dogumTarihi: e.target.value })} className="w-full border-gray-300 rounded-lg" />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Telefon</label>
                                    <input type="text" value={formData.telefon} onChange={e => setFormData({ ...formData, telefon: e.target.value })} placeholder="05XXXXXXXXX" className="w-full border-gray-300 rounded-lg" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Görevi</label>
                                    <input required type="text" value={formData.gorevi} onChange={e => setFormData({ ...formData, gorevi: e.target.value })} className="w-full border-gray-300 rounded-lg" />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Proje</label>
                                    <input required type="text" value={formData.projeAdi} onChange={e => setFormData({ ...formData, projeAdi: e.target.value })} className="w-full border-gray-300 rounded-lg" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Grup</label>
                                    <select 
                                        required 
                                        value={formData.grup} 
                                        onChange={e => setFormData({ ...formData, grup: e.target.value })} 
                                        className="w-full border-gray-300 rounded-lg"
                                    >
                                        <option value="">Grup Seçiniz</option>
                                        {groupDefs.map(g => (
                                            <option key={g.id} value={g.name}>{g.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Durum</label>
                                    <select value={formData.personelDurumu} onChange={e => setFormData({ ...formData, personelDurumu: e.target.value })} className="w-full border-gray-300 rounded-lg">
                                        <option value="CALISAN">ÇALIŞAN</option>
                                        <option value="AYRILDI">AYRILDI</option>
                                        <option value="IZINLI">İZİNLİ</option>
                                        <option value="PASIF">PASİF</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Adres</label>
                                <textarea
                                    value={formData.adres}
                                    onChange={e => setFormData({ ...formData, adres: e.target.value })}
                                    className="w-full border-gray-300 rounded-lg"
                                    rows={3}
                                />
                            </div>

                            <div className="flex justify-end pt-4 gap-2">
                                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 bg-gray-100 rounded-lg">İptal</button>
                                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg">Kaydet</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
