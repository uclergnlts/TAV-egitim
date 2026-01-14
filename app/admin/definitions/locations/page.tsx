"use client";

import { useState, useEffect } from "react";

interface Definition {
    id: string;
    name: string;
    isActive: boolean;
}

export default function LocationsPage() {
    const [locations, setLocations] = useState<Definition[]>([]);
    const [loading, setLoading] = useState(true);
    const [name, setName] = useState("");
    const [editId, setEditId] = useState<string | null>(null);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            // "all=true" to fetch both active and passive
            const res = await fetch("/api/definitions/locations?all=true");
            const data = await res.json();
            if (data.success) {
                setLocations(data.data);
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
            const url = "/api/definitions/locations";
            const method = editId ? "PUT" : "POST";
            const body = editId ? { id: editId, name } : { name };

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body)
            });
            const data = await res.json();

            if (data.success) {
                setSuccess(editId ? "Güncellendi" : "Eklendi");
                setName("");
                setEditId(null);
                loadData();
            } else {
                setError(data.message || "Hata oluştu");
            }
        } catch (err: any) {
            setError("İşlem sırasında hata oluştu");
        }
    };

    const startEdit = (item: Definition) => {
        setName(item.name);
        setEditId(item.id);
        setError("");
        setSuccess("");
    };

    const cancelEdit = () => {
        setName("");
        setEditId(null);
        setError("");
        setSuccess("");
    };

    const handleToggleStatus = async (item: Definition) => {
        const action = item.isActive ? "pasife" : "aktife";
        if (!confirm(`Bu kaydı ${action} almak istediğinize emin misiniz?`)) return;

        try {
            // Toggle active status using PUT
            const res = await fetch("/api/definitions/locations", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: item.id, isActive: !item.isActive })
            });
            const data = await res.json();

            if (data.success) {
                setSuccess(`Kayıt ${item.isActive ? 'pasife' : 'aktife'} alındı`);
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
            <h1 className="text-2xl font-bold text-gray-800">Eğitim Yerleri Yönetimi</h1>

            {/* Add/Edit Form */}
            <div className="bg-white p-6 rounded-xl shadow-sm border">
                <form onSubmit={handleSubmit} className="flex gap-4 items-end">
                    <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            {editId ? "Düzenle" : "Yeni Ekle"}
                        </label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={name}
                                onChange={e => setName(e.target.value)}
                                className="flex-1 border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Örn: Konferans Salonu"
                                required
                            />
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
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">İsim</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Durum</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">İşlemler</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {locations.map((item) => (
                            <tr key={item.id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.name}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {item.isActive ? (
                                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                            Aktif
                                        </span>
                                    ) : (
                                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                                            Pasif
                                        </span>
                                    )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <button onClick={() => startEdit(item)} className="text-blue-600 hover:text-blue-900 mr-4">Düzenle</button>
                                    <button
                                        onClick={() => handleToggleStatus(item)}
                                        className={item.isActive ? "text-red-600 hover:text-red-900" : "text-green-600 hover:text-green-900"}
                                    >
                                        {item.isActive ? "Pasife Al" : "Aktife Al"}
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {locations.length === 0 && !loading && (
                            <tr>
                                <td colSpan={3} className="px-6 py-4 text-center text-sm text-gray-500">Kayıt bulunamadı</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
