"use client";

import { useState, useEffect } from "react";
import { useToast } from "@/components/ToastProvider";

interface User {
    id: string;
    sicilNo: string;
    fullName: string;
    role: "CHEF" | "ADMIN";
    isActive: boolean;
    createdAt: string;
}

export default function ChefsPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editId, setEditId] = useState<string | null>(null);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const toast = useToast();

    // Form state
    const [formData, setFormData] = useState({
        sicil_no: "",
        full_name: "",
        role: "CHEF" as "CHEF" | "ADMIN",
        password: "",
        is_active: true,
    });
    const [formLoading, setFormLoading] = useState(false);

    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/users");
            const data = await res.json();
            if (data.success) {
                setUsers(data.data);
            }
        } catch (err) {
            console.error("Failed to load users:", err);
            toast.error("Kullanıcılar yüklenemedi");
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (user?: User) => {
        if (user) {
            setEditId(user.id);
            setFormData({
                sicil_no: user.sicilNo,
                full_name: user.fullName,
                role: user.role,
                password: "",
                is_active: user.isActive,
            });
        } else {
            setEditId(null);
            setFormData({
                sicil_no: "",
                full_name: "",
                role: "CHEF",
                password: "",
                is_active: true,
            });
        }
        setShowModal(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormLoading(true);

        try {
            const url = "/api/users";
            const method = editId ? "PUT" : "POST";
            const body = editId
                ? { id: editId, ...formData }
                : formData;

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });

            const data = await res.json();

            if (data.success) {
                toast.success(editId ? "Kullanıcı güncellendi" : "Kullanıcı oluşturuldu");
                setShowModal(false);
                loadUsers();
            } else {
                toast.error(data.message || "Hata oluştu");
            }
        } catch (err) {
            toast.error("İşlem başarısız");
        } finally {
            setFormLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        try {
            const res = await fetch(`/api/users?id=${id}`, { method: "DELETE" });
            const data = await res.json();

            if (data.success) {
                toast.success("Kullanıcı silindi");
                setDeleteId(null);
                loadUsers();
            } else {
                toast.error(data.message || "Silme başarısız");
            }
        } catch (err) {
            toast.error("Silme işlemi başarısız");
        }
    };

    const handleToggleActive = async (user: User) => {
        try {
            const res = await fetch("/api/users", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    id: user.id,
                    is_active: !user.isActive,
                }),
            });

            const data = await res.json();
            if (data.success) {
                toast.success(user.isActive ? "Kullanıcı pasifleştirildi" : "Kullanıcı aktifleştirildi");
                loadUsers();
            } else {
                toast.error(data.message);
            }
        } catch (err) {
            toast.error("İşlem başarısız");
        }
    };

    const chefs = users.filter(u => u.role === "CHEF");
    const admins = users.filter(u => u.role === "ADMIN");

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Kullanıcı Yönetimi</h1>
                    <p className="text-sm text-gray-500">Şef ve Admin kullanıcılarını yönetin</p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium flex items-center gap-2"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Yeni Kullanıcı
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="bg-white rounded-xl border p-4">
                    <p className="text-sm text-gray-500">Toplam Kullanıcı</p>
                    <p className="text-2xl font-bold text-gray-900">{users.length}</p>
                </div>
                <div className="bg-white rounded-xl border p-4">
                    <p className="text-sm text-gray-500">Şefler</p>
                    <p className="text-2xl font-bold text-blue-600">{chefs.length}</p>
                </div>
                <div className="bg-white rounded-xl border p-4">
                    <p className="text-sm text-gray-500">Adminler</p>
                    <p className="text-2xl font-bold text-purple-600">{admins.length}</p>
                </div>
            </div>

            {/* Table */}
            {loading ? (
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
            ) : (
                <div className="bg-white rounded-xl border overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 border-b">
                                <tr>
                                    <th className="px-4 py-3 text-left font-semibold text-gray-600">Sicil No</th>
                                    <th className="px-4 py-3 text-left font-semibold text-gray-600">Ad Soyad</th>
                                    <th className="px-4 py-3 text-left font-semibold text-gray-600">Rol</th>
                                    <th className="px-4 py-3 text-left font-semibold text-gray-600">Durum</th>
                                    <th className="px-4 py-3 text-left font-semibold text-gray-600">Kayıt Tarihi</th>
                                    <th className="px-4 py-3 text-center font-semibold text-gray-600">İşlemler</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {users.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                                            Henüz kullanıcı bulunmuyor
                                        </td>
                                    </tr>
                                ) : (
                                    users.map((user) => (
                                        <tr key={user.id} className="hover:bg-gray-50">
                                            <td className="px-4 py-3 font-mono font-medium text-blue-700">{user.sicilNo}</td>
                                            <td className="px-4 py-3 font-medium">{user.fullName}</td>
                                            <td className="px-4 py-3">
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${user.role === "ADMIN"
                                                        ? "bg-purple-100 text-purple-700"
                                                        : "bg-blue-100 text-blue-700"
                                                    }`}>
                                                    {user.role === "ADMIN" ? "Admin" : "Şef"}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <button
                                                    onClick={() => handleToggleActive(user)}
                                                    className={`px-2 py-1 rounded-full text-xs font-medium ${user.isActive
                                                            ? "bg-green-100 text-green-700"
                                                            : "bg-red-100 text-red-700"
                                                        }`}
                                                >
                                                    {user.isActive ? "Aktif" : "Pasif"}
                                                </button>
                                            </td>
                                            <td className="px-4 py-3 text-gray-500">
                                                {new Date(user.createdAt).toLocaleDateString("tr-TR")}
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center justify-center gap-2">
                                                    <button
                                                        onClick={() => handleOpenModal(user)}
                                                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"
                                                        title="Düzenle"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                        </svg>
                                                    </button>
                                                    <button
                                                        onClick={() => setDeleteId(user.id)}
                                                        className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg"
                                                        title="Sil"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                        </svg>
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
            )}

            {/* Add/Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
                        <div className="flex items-center justify-between p-4 border-b">
                            <h3 className="text-lg font-bold">
                                {editId ? "Kullanıcı Düzenle" : "Yeni Kullanıcı"}
                            </h3>
                            <button onClick={() => setShowModal(false)} className="p-1 hover:bg-gray-100 rounded">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-4 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Sicil No <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={formData.sicil_no}
                                    onChange={(e) => setFormData({ ...formData, sicil_no: e.target.value })}
                                    className="w-full h-11 border border-gray-300 rounded-lg px-3 text-sm focus:ring-2 focus:ring-blue-500"
                                    required
                                    disabled={!!editId}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Ad Soyad <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={formData.full_name}
                                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                    className="w-full h-11 border border-gray-300 rounded-lg px-3 text-sm focus:ring-2 focus:ring-blue-500"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Rol</label>
                                <select
                                    value={formData.role}
                                    onChange={(e) => setFormData({ ...formData, role: e.target.value as "CHEF" | "ADMIN" })}
                                    className="w-full h-11 border border-gray-300 rounded-lg px-3 text-sm focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="CHEF">Şef</option>
                                    <option value="ADMIN">Admin</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Şifre {!editId && <span className="text-red-500">*</span>}
                                    {editId && <span className="text-gray-400 text-xs">(Boş bırakılırsa değişmez)</span>}
                                </label>
                                <input
                                    type="password"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    className="w-full h-11 border border-gray-300 rounded-lg px-3 text-sm focus:ring-2 focus:ring-blue-500"
                                    required={!editId}
                                    minLength={4}
                                />
                            </div>

                            <div className="flex justify-end gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium"
                                >
                                    İptal
                                </button>
                                <button
                                    type="submit"
                                    disabled={formLoading}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50"
                                >
                                    {formLoading ? "Kaydediliyor..." : (editId ? "Güncelle" : "Oluştur")}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation */}
            {deleteId && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl p-6 max-w-md w-full">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-red-100 rounded-full">
                                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-bold text-gray-900">Kullanıcıyı Sil</h3>
                        </div>
                        <p className="text-gray-600 mb-6">
                            Bu kullanıcıyı silmek istediğinize emin misiniz? Bu işlem geri alınamaz.
                        </p>
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setDeleteId(null)}
                                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium"
                            >
                                İptal
                            </button>
                            <button
                                onClick={() => deleteId && handleDelete(deleteId)}
                                className="px-4 py-2 text-white bg-red-600 hover:bg-red-700 rounded-lg font-medium"
                            >
                                Evet, Sil
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
