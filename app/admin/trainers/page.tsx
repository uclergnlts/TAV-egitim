"use client";

import { useState, useEffect } from "react";

interface Trainer {
    id: string;
    sicilNo: string;
    fullName: string;
    isActive: boolean;
}

export default function TrainersPage() {
    const [trainers, setTrainers] = useState<Trainer[]>([]);
    const [loading, setLoading] = useState(true);
    const [fullName, setFullName] = useState("");
    const [sicilNo, setSicilNo] = useState("");
    const [editId, setEditId] = useState<string | null>(null);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    useEffect(() => {
        loadTrainers();
    }, []);

    const loadTrainers = async () => {
        try {
            const res = await fetch("/api/trainers");
            const data = await res.json();
            if (data.success) {
                setTrainers(data.data);
            }
        } catch (err) {
            console.error("Eğitmenler yüklenemedi", err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setSuccess("");

        if (!fullName.trim()) return;

        try {
            const url = "/api/trainers";
            const method = editId ? "PUT" : "POST";
            const body = editId ? { id: editId, fullName, sicilNo } : { fullName, sicilNo };

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body)
            });
            const data = await res.json();

            if (data.success) {
                setSuccess(editId ? "Eğitmen güncellendi" : "Eğitmen eklendi");
                setFullName("");
                setSicilNo("");
                setEditId(null);
                loadTrainers();
            } else {
                setError(data.message || "Hata oluştu");
            }
        } catch (err: any) {
            setError("İşlem sırasında hata oluştu");
        }
    };

    const startEdit = (t: Trainer) => {
        setFullName(t.fullName);
        setSicilNo(t.sicilNo || "");
        setEditId(t.id);
        setError("");
        setSuccess("");
    };

    const cancelEdit = () => {
        setFullName("");
        setSicilNo("");
        setEditId(null);
        setError("");
        setSuccess("");
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Eğitmeni pasife almak istediğinize emin misiniz?")) return;

        try {
            const res = await fetch(`/api/trainers?id=${id}`, { method: "DELETE" });
            const data = await res.json();
            if (data.success) {
                loadTrainers();
                setSuccess("Eğitmen pasife alındı");
            } else {
                alert(data.message);
            }
        } catch (err) {
            alert("Hata oluştu");
        }
    };

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-gray-800">Eğitmen Yönetimi</h1>

            {/* Add/Edit Form */}
            <div className="bg-white p-6 rounded-xl shadow-sm border">
                <form onSubmit={handleSubmit} className="flex gap-4 items-end">
                    <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            {editId ? "Eğitmen Düzenle" : "Yeni Eğitmen Ekle"}
                        </label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={fullName}
                                onChange={e => setFullName(e.target.value)}
                                className="flex-1 border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Örn: Ahmet Yılmaz"
                                required
                            />
                            <input
                                type="text"
                                value={sicilNo}
                                onChange={e => setSicilNo(e.target.value)}
                                className="w-1/4 border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Sicil No"
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
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sicil No</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Eğitmen</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Durum</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">İşlemler</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {trainers.map((t) => (
                            <tr key={t.id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{t.sicilNo}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{t.fullName}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {t.isActive ? (
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
                                    <button onClick={() => startEdit(t)} className="text-blue-600 hover:text-blue-900 mr-4">Düzenle</button>
                                    <button onClick={() => handleDelete(t.id)} className="text-red-600 hover:text-red-900">Sil</button>
                                </td>
                            </tr>
                        ))}
                        {trainers.length === 0 && !loading && (
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
