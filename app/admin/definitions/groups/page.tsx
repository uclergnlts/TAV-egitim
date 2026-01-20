"use client";

import { useState, useEffect } from "react";

interface Group {
    id: string;
    name: string;
    description?: string;
    isActive: boolean;
}

export default function GroupsPage() {
    const [groups, setGroups] = useState<Group[]>([]);
    const [loading, setLoading] = useState(true);
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [editId, setEditId] = useState<string | null>(null);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const res = await fetch("/api/definitions/groups?all=true");
            const data = await res.json();
            if (data.success) {
                setGroups(data.data);
            }
        } catch (err) {
            console.error("Veriler yüklenemedi", err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setSuccess("");

        if (!name.trim()) return;

        try {
            const url = "/api/definitions/groups";
            const method = editId ? "PUT" : "POST";
            const body = editId 
                ? { id: editId, name, description } 
                : { name, description };

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body)
            });
            const data = await res.json();

            if (data.success) {
                setSuccess(editId ? "Güncellendi" : "Eklendi");
                setName("");
                setDescription("");
                setEditId(null);
                loadData();
            } else {
                setError(data.message || "Hata oluştu");
            }
        } catch (err: any) {
            setError("İşlem sırasında hata oluştu");
        }
    };

    const startEdit = (item: Group) => {
        setName(item.name);
        setDescription(item.description || "");
        setEditId(item.id);
        setError("");
        setSuccess("");
    };

    const cancelEdit = () => {
        setName("");
        setDescription("");
        setEditId(null);
        setError("");
        setSuccess("");
    };

    const handleToggleStatus = async (item: Group) => {
        const action = item.isActive ? "pasife" : "aktife";
        if (!confirm(`Bu grubu ${action} almak istediğinize emin misiniz?`)) return;

        try {
            const res = await fetch("/api/definitions/groups", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: item.id, isActive: !item.isActive })
            });
            const data = await res.json();

            if (data.success) {
                setSuccess(`Grup ${item.isActive ? 'pasife' : 'aktife'} alındı`);
                loadData();
            } else {
                setError(data.message || "Hata oluştu");
            }
        } catch (err) {
            setError("Hata oluştu");
        }
    };

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-gray-800">Personel Grupları Yönetimi</h1>

            {/* Add/Edit Form */}
            <div className="bg-white p-6 rounded-xl shadow-sm border">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Grup Adı *
                            </label>
                            <input
                                type="text"
                                value={name}
                                onChange={e => setName(e.target.value)}
                                className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Örn: A Grubu"
                                required
                            />
                        </div>
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Açıklama
                            </label>
                            <input
                                type="text"
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                                className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Opsiyonel açıklama"
                            />
                        </div>
                    </div>
                    <div className="flex gap-2">
                        {editId && (
                            <button
                                type="button"
                                onClick={cancelEdit}
                                className="px-4 py-2 bg-gray-100 text-gray-600 font-medium rounded-lg hover:bg-gray-200 transition-colors"
                            >
                                İptal
                            </button>
                        )}
                        <button
                            type="submit"
                            className={`px-6 py-2 text-white font-medium rounded-lg transition-colors ${editId ? 'bg-orange-600 hover:bg-orange-700' : 'bg-blue-600 hover:bg-blue-700'}`}
                        >
                            {editId ? "Güncelle" : "Ekle"}
                        </button>
                    </div>
                </form>
                {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
                {success && <p className="mt-2 text-sm text-green-600">{success}</p>}
            </div>

            {/* List */}
            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Grup Adı</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Açıklama</th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Durum</th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">İşlemler</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {loading ? (
                            <tr>
                                <td colSpan={4} className="px-6 py-4 text-center text-gray-500">Yükleniyor...</td>
                            </tr>
                        ) : groups.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="px-6 py-4 text-center text-gray-500">Kayıt bulunamadı</td>
                            </tr>
                        ) : (
                            groups.map((item) => (
                                <tr key={item.id} className={!item.isActive ? "bg-gray-50 opacity-60" : ""}>
                                    <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                                        {item.name}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                                        {item.description || "-"}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${item.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                            {item.isActive ? "Aktif" : "Pasif"}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                        <div className="flex justify-center gap-2">
                                            <button
                                                onClick={() => startEdit(item)}
                                                className="text-blue-600 hover:text-blue-900 text-sm font-medium"
                                            >
                                                Düzenle
                                            </button>
                                            <button
                                                onClick={() => handleToggleStatus(item)}
                                                className={`text-sm font-medium ${item.isActive ? 'text-red-600 hover:text-red-900' : 'text-green-600 hover:text-green-900'}`}
                                            >
                                                {item.isActive ? "Pasife Al" : "Aktife Al"}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
