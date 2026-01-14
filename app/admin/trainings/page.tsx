"use client";

import { useState, useEffect } from "react";

interface Training {
    id: string;
    code: string;
    name: string;
    duration_min: number;
    category: string;
    default_location?: string;
    default_document_type?: string;
    isActive: boolean;
}

export default function TrainingsPage() {
    const [trainings, setTrainings] = useState<Training[]>([]);
    const [filteredTrainings, setFilteredTrainings] = useState<Training[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [showModal, setShowModal] = useState(false);

    // Form States
    const [formData, setFormData] = useState({
        code: "",
        name: "",
        duration_min: 60,
        category: "TEMEL"
    });

    const [editId, setEditId] = useState<string | null>(null);

    useEffect(() => {
        loadTrainings();
    }, []);

    useEffect(() => {
        const lowerSearch = search.toLowerCase();
        setFilteredTrainings(
            trainings.filter(t =>
                t.code.toLowerCase().includes(lowerSearch) ||
                t.name.toLowerCase().includes(lowerSearch)
            )
        );
    }, [search, trainings]);

    const loadTrainings = async () => {
        try {
            const res = await fetch("/api/trainings");
            const data = await res.json();
            if (data.success) {
                setTrainings(data.data);
                setFilteredTrainings(data.data);
            }
        } catch (err) {
            console.error("Hata:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (t: Training) => {
        setFormData({
            code: t.code,
            name: t.name,
            duration_min: t.duration_min,
            category: t.category
        });
        setEditId(t.id);
        setShowModal(true);
    };

    const handleNew = () => {
        setFormData({
            code: "",
            name: "",
            duration_min: 60,
            category: "TEMEL"
        });
        setEditId(null);
        setShowModal(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const url = "/api/trainings";
            const method = editId ? "PUT" : "POST";
            const body = editId ? { ...formData, id: editId } : formData;

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body)
            });
            const result = await res.json();
            if (result.success) {
                loadTrainings();
                setShowModal(false);
            } else {
                alert(result.message || "Hata oluştu");
            }
        } catch (err) {
            alert("Sunucu hatası");
        }
    };

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`${name} eğitimini silmek (pasife almak) istediğinize emin misiniz?`)) return;

        try {
            const res = await fetch(`/api/trainings?id=${id}`, {
                method: "DELETE"
            });
            const data = await res.json();

            if (data.success) {
                // Listeyi güncelle
                loadTrainings();
            } else {
                alert(data.message || "Silme başarısız");
            }
        } catch (err) {
            console.error(err);
            alert("Hata oluştu");
        }
    };

    // Topics State
    const [showTopicsModal, setShowTopicsModal] = useState(false);
    const [selectedTrainingForTopics, setSelectedTrainingForTopics] = useState<Training | null>(null);
    const [topics, setTopics] = useState<any[]>([]);
    const [newTopicTitle, setNewTopicTitle] = useState("");

    // Load topics for selected training
    const loadTopics = async (trainingId: string) => {
        try {
            const res = await fetch(`/api/trainings/topics?trainingId=${trainingId}`);
            const data = await res.json();
            if (data.success) {
                setTopics(data.data);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleOpenTopics = (t: Training) => {
        setSelectedTrainingForTopics(t);
        setNewTopicTitle("");
        loadTopics(t.id);
        setShowTopicsModal(true);
    };

    const handleAddTopic = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedTrainingForTopics || !newTopicTitle.trim()) return;

        try {
            const res = await fetch("/api/trainings/topics", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    trainingId: selectedTrainingForTopics.id,
                    title: newTopicTitle
                })
            });
            const data = await res.json();
            if (data.success) {
                setNewTopicTitle("");
                loadTopics(selectedTrainingForTopics.id);
            } else {
                alert(data.message);
            }
        } catch (err) {
            alert("Hata oluştu");
        }
    };

    const handleDeleteTopic = async (topicId: string) => {
        if (!confirm("Alt başlığı silmek istediğinize emin misiniz?")) return;
        try {
            const res = await fetch(`/api/trainings/topics?id=${topicId}`, {
                method: "DELETE"
            });
            const data = await res.json();
            if (data.success) {
                if (selectedTrainingForTopics) {
                    loadTopics(selectedTrainingForTopics.id);
                }
            } else {
                alert(data.message);
            }
        } catch (err) {
            alert("Hata oluştu");
        }
    };

    return (
        <div className="space-y-8">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                        Eğitim Kataloğu
                    </h1>
                    <p className="text-gray-500 mt-1">Sistemdeki tüm eğitimleri buradan yönetebilirsiniz.</p>
                </div>
                <button
                    onClick={handleNew}
                    className="group flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:shadow-lg hover:shadow-blue-500/25 transition-all duration-300 font-medium transform hover:-translate-y-0.5"
                >
                    <svg className="w-5 h-5 group-hover:rotate-90 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Yeni Eğitim Ekle
                </button>
            </div>

            {/* Search and Stats Bar */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                <div className="relative flex-1">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Eğitim kodu veya adı ile arama yapın..."
                        className="block w-full pl-10 pr-3 py-3 border-none bg-gray-50 rounded-xl focus:ring-2 focus:ring-blue-100 placeholder-gray-400 text-gray-700 font-medium transition-colors"
                    />
                </div>
                <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-xl text-sm font-medium text-gray-600">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                    {filteredTrainings.length} Eğitim Aktif
                </div>
            </div>

            {/* Content Table */}
            <div className="bg-white rounded-2xl shadow-lg shadow-gray-100/50 border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-100">
                        <thead>
                            <tr className="bg-gray-50/50">
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Kod</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Eğitim Detayları</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Kategori</th>
                                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">İşlemler</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filteredTrainings.map((t) => (
                                <tr key={t.id} className="hover:bg-blue-50/30 transition-colors group">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <span className="px-3 py-1 rounded-lg bg-gray-100 text-gray-700 text-sm font-mono font-bold group-hover:bg-white group-hover:shadow-sm transition-all">
                                                {t.code}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-semibold text-gray-900">{t.name}</span>
                                            <span className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                                {t.duration_min} dakika
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${t.category === 'TEMEL' ? 'bg-indigo-50 text-indigo-700 border-indigo-100' :
                                            t.category === 'TAZELEME' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                                                'bg-gray-50 text-gray-600 border-gray-200'
                                            }`}>
                                            {t.category}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => handleOpenTopics(t)}
                                                className="text-gray-400 hover:text-indigo-600 transition-colors p-2 hover:bg-indigo-50 rounded-lg group/btn"
                                                title="Alt Başlıklar"
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                                                </svg>
                                            </button>
                                            <button
                                                onClick={() => handleEdit(t)}
                                                className="text-gray-400 hover:text-blue-600 transition-colors p-2 hover:bg-blue-50 rounded-lg group/btn"
                                                title="Düzenle"
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                </svg>
                                            </button>
                                            <button
                                                onClick={() => handleDelete(t.id, t.name)}
                                                className="text-gray-400 hover:text-red-600 transition-colors p-2 hover:bg-red-50 rounded-lg"
                                                title="Sil"
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {filteredTrainings.length === 0 && !loading && (
                        <div className="flex flex-col items-center justify-center py-12 text-gray-400 bg-gray-50/50">
                            <svg className="w-12 h-12 mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            <p className="text-lg font-medium">Kayıt Bulunamadı</p>
                            <p className="text-sm">Arama kriterlerinize uygun eğitim mevcut değil.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Edit/New Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full p-8 transform transition-all scale-100 border border-gray-100">
                        <div className="flex justify-between items-start mb-8">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-800">
                                    {editId ? 'Eğitimi Düzenle' : 'Yeni Eğitim Oluştur'}
                                </h2>
                                <p className="text-gray-500 text-sm mt-1">Eğitim bilgilerini aşağıdan yönetebilirsiniz.</p>
                            </div>
                            <button
                                onClick={() => setShowModal(false)}
                                className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-full transition-colors"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-gray-700">Eğitim Kodu</label>
                                    <input
                                        required
                                        type="text"
                                        value={formData.code}
                                        onChange={e => setFormData({ ...formData, code: e.target.value })}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all font-mono text-sm"
                                        placeholder="Örn: M90"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-gray-700">Süre (Dakika)</label>
                                    <div className="relative">
                                        <input
                                            required
                                            type="number"
                                            value={formData.duration_min}
                                            onChange={e => setFormData({ ...formData, duration_min: parseInt(e.target.value) })}
                                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
                                        />
                                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-gray-400 text-sm">dk</div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-700">Eğitim Adı</label>
                                <input
                                    required
                                    type="text"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
                                    placeholder="Eğitimin tam adını giriniz..."
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-700">Kategori</label>
                                <div className="relative">
                                    <select
                                        value={formData.category}
                                        onChange={e => setFormData({ ...formData, category: e.target.value })}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all appearance-none cursor-pointer bg-white"
                                    >
                                        <option value="TEMEL">TEMEL</option>
                                        <option value="TAZELEME">TAZELEME</option>
                                        <option value="DIGER">DİĞER</option>
                                    </select>
                                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-gray-500">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end pt-4 gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="px-6 py-2.5 text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 font-medium transition-colors"
                                >
                                    Vazgeç
                                </button>
                                <button
                                    type="submit"
                                    className="px-6 py-2.5 text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl hover:shadow-lg hover:shadow-blue-500/25 font-medium transition-all"
                                >
                                    {editId ? 'Değişiklikleri Kaydet' : 'Eğitimi Oluştur'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Topics Modal */}
            {showTopicsModal && selectedTrainingForTopics && (
                <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-8 transform transition-all scale-100 border border-gray-100">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-800">
                                    Eğitim Alt Başlıkları
                                </h2>
                                <p className="text-gray-500 text-sm mt-1">
                                    <span className="font-mono bg-gray-100 px-2 py-0.5 rounded text-gray-700">{selectedTrainingForTopics.code}</span> - {selectedTrainingForTopics.name}
                                </p>
                            </div>
                            <button
                                onClick={() => setShowTopicsModal(false)}
                                className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-full transition-colors"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>

                        <div className="space-y-6">
                            {/* Add New Topic Form */}
                            <form onSubmit={handleAddTopic} className="flex gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
                                <div className="flex-1">
                                    <input
                                        type="text"
                                        value={newTopicTitle}
                                        onChange={e => setNewTopicTitle(e.target.value)}
                                        placeholder="Yeni alt başlık adı giriniz..."
                                        className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all text-sm"
                                        required
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={!newTopicTitle.trim()}
                                    className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium text-sm flex items-center gap-2"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                                    Ekle
                                </button>
                            </form>

                            {/* Topics List */}
                            <div className="max-h-[400px] overflow-y-auto pr-2">
                                <div className="space-y-3">
                                    {topics.length === 0 ? (
                                        <div className="text-center py-8 text-gray-400 border-2 border-dashed border-gray-100 rounded-xl">
                                            <svg className="w-10 h-10 mx-auto mb-2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                                            <p className="text-sm">Henüz alt başlık eklenmemiş</p>
                                        </div>
                                    ) : (
                                        topics.map((topic, index) => (
                                            <div key={topic.id} className="group flex items-center justify-between p-4 bg-white rounded-xl border border-gray-100 hover:border-indigo-100 hover:shadow-sm transition-all">
                                                <div className="flex items-center gap-3">
                                                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-indigo-50 text-indigo-600 text-xs font-bold">
                                                        {index + 1}
                                                    </span>
                                                    <span className="text-gray-700 font-medium">{topic.title}</span>
                                                </div>
                                                <button
                                                    onClick={() => handleDeleteTopic(topic.id)}
                                                    className="text-gray-300 hover:text-red-500 p-2 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                                    title="Sil"
                                                >
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                </button>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
