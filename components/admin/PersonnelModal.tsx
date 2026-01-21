"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { type Personnel } from "@/lib/db/schema";

// If GroupDef is not exported from schema or elsewhere, let's define a minimal prop type
interface GroupDef {
    id: string;
    name: string;
}

interface PersonnelModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    editData: Personnel | null;
    groupDefs: GroupDef[];
}

export default function PersonnelModal({
    isOpen,
    onClose,
    onSuccess,
    editData,
    groupDefs
}: PersonnelModalProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const initialForm = {
        sicilNo: "",
        fullName: "",
        tcKimlikNo: "",
        gorevi: "X-Ray Operatörü", // Default value
        projeAdi: "TAV ESB", // Default value
        grup: "",
        personelDurumu: "CALISAN",
        cinsiyet: "",
        telefon: "",
        dogumTarihi: "",
        adres: ""
    };

    const [formData, setFormData] = useState(initialForm);

    useEffect(() => {
        if (editData) {
            setFormData({
                sicilNo: editData.sicilNo,
                fullName: editData.fullName,
                tcKimlikNo: editData.tcKimlikNo,
                gorevi: editData.gorevi,
                projeAdi: editData.projeAdi,
                grup: editData.grup,
                // Ensure we handle potentially null/undefined values if the type allows it, 
                // though schema says some are notNull, editData properties might be nullable in some contexts (e.g. partial)
                personelDurumu: editData.personelDurumu || "CALISAN",
                cinsiyet: editData.cinsiyet || "",
                telefon: editData.telefon || "",
                dogumTarihi: editData.dogumTarihi || "",
                adres: editData.adres || ""
            });
        } else {
            // New record - reset to initial
            // If groups are loaded and we have no group selected, select first one
            const defaultGroup = groupDefs.length > 0 ? groupDefs[0].name : "";
            setFormData({ ...initialForm, grup: defaultGroup });
        }
        setError(null);
    }, [editData, isOpen, groupDefs]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            const method = editData ? "PUT" : "POST";
            const body = editData ? { ...formData, id: editData.id } : formData;

            const res = await fetch("/api/personnel", {
                method: method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body)
            });

            const result = await res.json();

            if (result.success) {
                onSuccess();
                onClose();
            } else {
                setError(result.message || "Bir hata oluştu");
            }
        } catch (err: any) {
            setError(err.message || "Beklenmedik bir hata oluştu");
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (field: keyof typeof formData, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (error) setError(null);
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
            <div
                className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]"
                role="dialog"
                aria-modal="true"
            >
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <div>
                        <h2 className="text-xl font-bold text-gray-800">
                            {editData ? "Personel Düzenle" : "Yeni Personel Ekle"}
                        </h2>
                        <p className="text-sm text-gray-500 mt-1">
                            {editData ? `#${editData.sicilNo} sicil nolu personeli düzenliyorsunuz` : "Sisteme yeni bir personel tanımlayın"}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-600"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Body - Scrollable */}
                <div className="flex-1 overflow-y-auto px-6 py-6">
                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center text-sm">
                            <svg className="w-5 h-5 mr-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {error}
                        </div>
                    )}

                    <form id="personnel-form" onSubmit={handleSubmit} className="space-y-6">
                        {/* Kimlik Bilgileri Section */}
                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                            <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                <span className="w-1 h-4 bg-blue-500 rounded-full"></span>
                                Kimlik Bilgileri
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                        Sicil No <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        required
                                        type="text"
                                        value={formData.sicilNo}
                                        onChange={e => handleChange("sicilNo", e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all placeholder:text-gray-400"
                                        placeholder="Örn: 123456"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                        TCKN <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        required
                                        type="text"
                                        maxLength={11}
                                        value={formData.tcKimlikNo}
                                        onChange={e => {
                                            const val = e.target.value.replace(/\D/g, '').slice(0, 11);
                                            handleChange("tcKimlikNo", val);
                                        }}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all placeholder:text-gray-400"
                                        placeholder="11 haneli TCKN"
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                        Ad Soyad <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        required
                                        type="text"
                                        value={formData.fullName}
                                        onChange={e => handleChange("fullName", e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all placeholder:text-gray-400"
                                        placeholder="Tam İsim"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Cinsiyet</label>
                                    <select
                                        value={formData.cinsiyet}
                                        onChange={e => handleChange("cinsiyet", e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all bg-white"
                                    >
                                        <option value="">Seçiniz</option>
                                        <option value="ERKEK">ERKEK</option>
                                        <option value="KADIN">KADIN</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Doğum Tarihi</label>
                                    <input
                                        type="date"
                                        value={formData.dogumTarihi}
                                        onChange={e => handleChange("dogumTarihi", e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* İş Bilgileri Section */}
                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                            <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                <span className="w-1 h-4 bg-purple-500 rounded-full"></span>
                                İş Bilgileri
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                        Görevi <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        required
                                        type="text"
                                        value={formData.gorevi}
                                        onChange={e => handleChange("gorevi", e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                        Proje <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        required
                                        type="text"
                                        value={formData.projeAdi}
                                        onChange={e => handleChange("projeAdi", e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                        Grup <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        required
                                        value={formData.grup}
                                        onChange={e => handleChange("grup", e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all bg-white"
                                    >
                                        <option value="">Grup Seçiniz</option>
                                        {groupDefs.map(g => (
                                            <option key={g.id} value={g.name}>{g.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                        Çalışma Durumu
                                    </label>
                                    <select
                                        value={formData.personelDurumu}
                                        onChange={e => handleChange("personelDurumu", e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all bg-white"
                                    >
                                        <option value="CALISAN">ÇALIŞAN</option>
                                        <option value="IZINLI">İZİNLİ</option>
                                        <option value="AYRILDI">AYRILDI</option>
                                        <option value="PASIF">PASİF</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* İletişim Bilgileri Section */}
                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                            <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                <span className="w-1 h-4 bg-green-500 rounded-full"></span>
                                İletişim
                            </h3>
                            <div className="grid grid-cols-1 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Telefon</label>
                                    <input
                                        type="tel"
                                        value={formData.telefon}
                                        onChange={e => handleChange("telefon", e.target.value)}
                                        placeholder="05XXXXXXXXX"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Adres</label>
                                    <textarea
                                        value={formData.adres}
                                        onChange={e => handleChange("adres", e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all min-h-[80px]"
                                        placeholder="Açık adres..."
                                        rows={3}
                                    />
                                </div>
                            </div>
                        </div>
                    </form>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-5 py-2.5 bg-white border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors focus:ring-2 focus:ring-gray-200"
                    >
                        İptal
                    </button>
                    <button
                        type="submit"
                        form="personnel-form"
                        disabled={loading}
                        className="px-5 py-2.5 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 active:bg-blue-800 transition-colors focus:ring-2 focus:ring-blue-300 disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {loading ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                Kaydediliyor...
                            </>
                        ) : (
                            editData ? "Değişiklikleri Kaydet" : "Personel Ekle"
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}

