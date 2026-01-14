"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

// Types
interface Training {
    id: string;
    code: string;
    name: string;
    duration_min: number;
    category: string;
    default_location?: string;
    default_document_type?: string;
    has_topics: boolean;
    topics: { id: string; title: string }[];
}

interface Trainer {
    id: string;
    fullName: string;
}

interface Definition {
    id: string;
    name: string;
}

export default function ChefDashboard() {
    const router = useRouter();

    // Data
    const [trainings, setTrainings] = useState<Training[]>([]);
    const [trainers, setTrainers] = useState<Trainer[]>([]);

    // Definitions
    const [locations, setLocations] = useState<Definition[]>([]);
    const [documentTypes, setDocumentTypes] = useState<Definition[]>([]);

    // Form States
    const [selectedTrainingId, setSelectedTrainingId] = useState("");
    const [selectedTopicId, setSelectedTopicId] = useState("");
    const [selectedTrainerId, setSelectedTrainerId] = useState("");
    const [locationType, setLocationType] = useState("IC"); // IC / DIS
    const [trainingLocation, setTrainingLocation] = useState("");
    const [documentType, setDocumentType] = useState("");

    // Date/Time States (Initialized as empty to avoid hydration mismatch, set in useEffect)
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [startTime, setStartTime] = useState("09:00");
    const [endTime, setEndTime] = useState("10:00");

    // Auto-filled (Read-only)
    const [trainingDuration, setTrainingDuration] = useState(0);

    // Personnel
    const [sicilNos, setSicilNos] = useState("");

    // UI Status
    const [loading, setLoading] = useState(false);
    const [successMsg, setSuccessMsg] = useState("");
    const [errorMsg, setErrorMsg] = useState("");
    const [resultDetails, setResultDetails] = useState<any>(null);

    // Initial Load
    useEffect(() => {
        loadTrainings();
        loadTrainers();
        loadDefinitions();
        setInitialDateTime();
    }, []);

    const loadDefinitions = async () => {
        try {
            const locRes = await fetch("/api/definitions/locations");
            const locData = await locRes.json();
            if (locData.success) setLocations(locData.data);

            const docRes = await fetch("/api/definitions/documents");
            const docData = await docRes.json();
            if (docData.success) setDocumentTypes(docData.data);
        } catch (err) {
            console.error("Tanımlar yüklenemedi", err);
        }
    };

    const setInitialDateTime = () => {
        const now = new Date();

        // Date: YYYY-MM-DD
        const dateStr = now.toLocaleDateString("en-CA");

        // Time: HH:MM
        const hours = now.getHours().toString().padStart(2, "0");
        const minutes = now.getMinutes().toString().padStart(2, "0");
        const timeStr = `${hours}:${minutes}`;

        setStartDate(dateStr);
        setEndDate(dateStr);
        setStartTime(timeStr);

        // Default End time: +1 hour
        const endNow = new Date(now.getTime() + 60 * 60 * 1000);
        const endHours = endNow.getHours().toString().padStart(2, "0");
        const endMinutes = endNow.getMinutes().toString().padStart(2, "0");
        setEndTime(`${endHours}:${endMinutes}`);
    };

    const loadTrainings = async () => {
        try {
            const res = await fetch("/api/trainings");
            const data = await res.json();
            if (data.success) setTrainings(data.data);
        } catch (err) {
            console.error("Eğitimler yüklenemedi", err);
        }
    };

    const loadTrainers = async () => {
        try {
            const res = await fetch("/api/trainers");
            const data = await res.json();
            if (data.success) setTrainers(data.data);
        } catch (err) {
            console.error("Eğitmenler yüklenemedi", err);
        }
    };

    // Handle Training Selection
    const handleTrainingChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const tId = e.target.value;
        setSelectedTrainingId(tId);
        setSelectedTopicId(""); // Reset topic

        const training = trainings.find(t => t.id === tId);
        if (training) {
            setTrainingDuration(training.duration_min);
            setDocumentType(training.default_document_type || "");
            setTrainingLocation(training.default_location || "");

            // Recalculate end time based on new duration if start time exists
            if (startTime) {
                calculateEndTime(startTime, training.duration_min);
            }
        } else {
            setTrainingDuration(0);
            setDocumentType("");
            setTrainingLocation("");
        }
    };

    const calculateEndTime = (startStr: string, durationMin: number) => {
        if (!startStr) return;
        const [h, m] = startStr.split(":").map(Number);
        const date = new Date();
        date.setHours(h, m, 0, 0);

        date.setMinutes(date.getMinutes() + durationMin);

        const endH = date.getHours().toString().padStart(2, "0");
        const endM = date.getMinutes().toString().padStart(2, "0");
        setEndTime(`${endH}:${endM}`);
    };

    const handleStartTimeChange = (val: string) => {
        setStartTime(val);
        // If we have a duration, auto-update end time
        if (trainingDuration > 0) {
            calculateEndTime(val, trainingDuration);
        }
    };

    const handleDurationAdd = (minutes: number) => {
        // Manually adding duration updates end time but doesn't lock "schema duration"
        if (startTime) {
            calculateEndTime(startTime, minutes);
            // Optionally update displayed duration? 
            // setTrainingDuration(minutes); // Let's keep the schematic duration separate
        }
    };

    const handleSubmit = async () => {
        setLoading(true);
        setErrorMsg("");
        setSuccessMsg("");
        setResultDetails(null);

        const sicilList = sicilNos
            .split(/[\n,]+/)
            .map(s => s.trim())
            .filter(s => s.length > 0);

        if (sicilList.length === 0) {
            setErrorMsg("Lütfen en az bir sicil numarası giriniz.");
            setLoading(false);
            return;
        }

        if (!selectedTrainingId || !selectedTrainerId || !trainingLocation) {
            setErrorMsg("Lütfen tüm zorunlu alanları doldurunuz (*)");
            setLoading(false);
            return;
        }

        const payload = {
            sicil_nos: sicilList,
            training_id: selectedTrainingId,
            training_topic_id: selectedTopicId || undefined,
            trainer_id: selectedTrainerId,
            ic_dis_egitim: locationType,
            egitim_yeri: trainingLocation,
            baslama_tarihi: startDate,
            bitis_tarihi: endDate,
            baslama_saati: startTime,
            bitis_saati: endTime,
            sonuc_belgesi_turu: documentType,
            egitim_detayli_aciklama: ""
        };

        try {
            const res = await fetch("/api/attendances", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });
            const result = await res.json();

            if (result.success) {
                setSuccessMsg(result.message);
                setResultDetails(result.data);
                setSicilNos("");
            } else {
                setErrorMsg(result.message || "Bir hata oluştu");
            }
        } catch (err) {
            setErrorMsg("Sunucu hatası oluştu.");
        } finally {
            setLoading(false);
        }
    };

    const selectedTraining = trainings.find(t => t.id === selectedTrainingId);

    return (
        <div className="max-w-7xl mx-auto pb-20 px-4">

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Yeni Katılım Girişi</h1>
                    <p className="text-gray-500 mt-1">Eğitim kaydı oluşturmak için bilgileri doldurunuz.</p>
                </div>
                <div className="flex items-center space-x-2 bg-blue-50 px-4 py-2 rounded-lg border border-blue-100 text-blue-800 text-sm font-medium">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Şu An: {new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                {/* LEFT COLUMN: Training Info */}
                <div className="space-y-6">
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
                            <h2 className="text-lg font-semibold text-white flex items-center">
                                <span className="bg-white/20 p-1.5 rounded-lg mr-3">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                                </span>
                                Eğitim Bilgileri
                            </h2>
                        </div>

                        <div className="p-6 space-y-6">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Eğitim Seçin <span className="text-red-500">*</span></label>
                                <select
                                    value={selectedTrainingId}
                                    onChange={handleTrainingChange}
                                    className="w-full h-12 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-base px-3"
                                >
                                    <option value="">Seçiniz...</option>
                                    {trainings.map(t => (
                                        <option key={t.id} value={t.id}>{t.code} - {t.name}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Sub Topic */}
                            {selectedTraining?.has_topics && (
                                <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-100 animate-fadeIn">
                                    <label className="block text-sm font-semibold text-yellow-800 mb-2">Alt Başlık <span className="text-red-500">*</span></label>
                                    <select
                                        value={selectedTopicId}
                                        onChange={(e) => setSelectedTopicId(e.target.value)}
                                        className="w-full h-11 border border-yellow-300 rounded-lg shadow-sm focus:ring-yellow-500 focus:border-yellow-500 bg-white"
                                    >
                                        <option value="">Alt Başlık Seçiniz...</option>
                                        {selectedTraining.topics.map(topic => (
                                            <option key={topic.id} value={topic.id}>{topic.title}</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {/* Trainer & Location & Type Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Eğitmen <span className="text-red-500">*</span></label>
                                    <select
                                        value={selectedTrainerId}
                                        onChange={(e) => setSelectedTrainerId(e.target.value)}
                                        className="w-full h-11 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 px-3"
                                    >
                                        <option value="">Seçiniz</option>
                                        {trainers.map(t => (
                                            <option key={t.id} value={t.id}>{t.fullName}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Tür <span className="text-red-500">*</span></label>
                                    <select
                                        value={locationType}
                                        onChange={(e) => setLocationType(e.target.value)}
                                        className="w-full h-11 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 px-3"
                                    >
                                        <option value="IC">İç Eğitim</option>
                                        <option value="DIS">Dış Eğitim</option>
                                    </select>
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Eğitim Yeri <span className="text-red-500">*</span></label>
                                    <select
                                        value={trainingLocation}
                                        onChange={(e) => setTrainingLocation(e.target.value)}
                                        className="w-full h-11 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 px-3"
                                    >
                                        <option value="">Seçiniz veya Otomatik Gelir</option>
                                        {locations.map(loc => (
                                            <option key={loc.id} value={loc.name}>{loc.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Sonuç Belgesi <span className="text-red-500">*</span></label>
                                    <select
                                        value={documentType}
                                        onChange={(e) => setDocumentType(e.target.value)}
                                        className="w-full h-11 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 px-3"
                                    >
                                        <option value="">Seçiniz</option>
                                        {documentTypes.map(doc => (
                                            <option key={doc.id} value={doc.name}>{doc.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Info Card */}
                    {selectedTraining && (
                        <div className="bg-blue-50 rounded-xl p-5 border border-blue-100 flex justify-between items-center">
                            <div>
                                <span className="text-xs font-bold text-blue-500 uppercase tracking-wider">Tanımlı Süre</span>
                                <div className="text-2xl font-bold text-blue-900">{trainingDuration} dk</div>
                            </div>
                            <div className="text-right">
                                <span className="text-xs font-bold text-blue-500 uppercase tracking-wider">Varsayılan Konum</span>
                                <div className="text-sm font-medium text-blue-900">{selectedTraining.default_location || "-"}</div>
                            </div>
                        </div>
                    )}
                </div>

                {/* RIGHT COLUMN: Time & Personnel */}
                <div className="space-y-6">

                    {/* Timing Card */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                            <h2 className="text-lg font-semibold text-gray-800 flex items-center">
                                <span className="text-gray-400 mr-2">📅</span> Tarih ve Saat
                            </h2>
                            <button
                                onClick={setInitialDateTime}
                                className="text-xs text-blue-600 hover:text-blue-800 font-semibold hover:underline"
                            >
                                Şimdiye Ayarla ↻
                            </button>
                        </div>
                        <div className="p-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="block text-xs font-bold text-gray-500 uppercase">Başlangıç</label>
                                    <input
                                        type="date"
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                        className="w-full border border-gray-300 rounded-lg focus:ring-blue-500 text-sm px-3 py-2"
                                    />
                                    <input
                                        type="time"
                                        value={startTime}
                                        onChange={(e) => handleStartTimeChange(e.target.value)}
                                        className="w-full border border-gray-300 rounded-lg focus:ring-blue-500 text-lg font-semibold px-3 py-2"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-xs font-bold text-gray-500 uppercase">Bitiş</label>
                                    <input
                                        type="date"
                                        value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                        className="w-full border border-gray-300 rounded-lg focus:ring-blue-500 text-sm px-3 py-2"
                                    />
                                    <input
                                        type="time"
                                        value={endTime}
                                        onChange={(e) => setEndTime(e.target.value)}
                                        className="w-full border border-gray-300 rounded-lg focus:ring-blue-500 text-lg font-semibold px-3 py-2"
                                    />
                                </div>
                            </div>

                            {/* Duration Modifiers */}
                            <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
                                <span className="text-xs bg-gray-100 px-2 py-1 rounded self-center text-gray-500">Hızlı Ekle:</span>
                                {[30, 45, 60, 90, 120, 360].map(m => (
                                    <button
                                        key={m}
                                        onClick={() => handleDurationAdd(m)}
                                        className="px-3 py-1 bg-white border border-gray-200 hover:border-blue-400 hover:bg-blue-50 text-xs font-medium rounded-full transition-colors whitespace-nowrap"
                                    >
                                        +{m}dk
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Personnel Card */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col h-[400px]">
                        <div className="bg-gray-50 px-6 py-4 border-b border-gray-100">
                            <h2 className="text-lg font-semibold text-gray-800 flex items-center">
                                <span className="text-gray-400 mr-2">👥</span> Katılımcı Listesi
                            </h2>
                        </div>
                        <div className="p-6 flex-1 flex flex-col">
                            <div className="mb-2 flex justify-between items-end">
                                <label className="block text-sm font-medium text-gray-700">Sicil Numaraları</label>
                                <span className="text-xs text-gray-400">Her satıra bir sicil</span>
                            </div>
                            <textarea
                                value={sicilNos}
                                onChange={(e) => setSicilNos(e.target.value)}
                                placeholder="Örn: 12345&#10;67890&#10;11223"
                                className="w-full flex-1 border border-gray-300 rounded-xl shadow-inner focus:ring-purple-500 focus:border-purple-500 font-mono text-base p-4 resize-none"
                            />

                            {/* Stats & Tools */}
                            <div className="mt-3 flex justify-between items-center text-xs text-gray-500">
                                <span>{sicilNos.split(/[\n,]+/).filter(x => x.trim().length > 0).length} Kişi Girildi</span>
                                <button onClick={() => setSicilNos("")} className="text-red-500 hover:text-red-700">Temizle</button>
                            </div>
                        </div>
                    </div>

                    {/* Submit Button */}
                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className={`w-full py-4 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-bold text-lg rounded-2xl shadow-lg shadow-green-200 transform transition-all active:scale-95 ${loading ? 'opacity-70 cursor-wait' : ''}`}
                    >
                        {loading ? (
                            <span className="flex items-center justify-center gap-2">
                                <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                İşleniyor...
                            </span>
                        ) : (
                            'KAYDET VE TAMAMLA'
                        )}
                    </button>

                    {/* Feedback Messages */}
                    {errorMsg && (
                        <div className="p-4 bg-red-50 text-red-800 rounded-xl border border-red-100 flex items-start gap-3 animate-slideDown">
                            <span className="text-xl">⚠️</span>
                            <div>
                                <h4 className="font-bold">Hata Oluştu</h4>
                                <p className="text-sm opacity-90">{errorMsg}</p>
                            </div>
                        </div>
                    )}

                    {successMsg && (
                        <div className="p-4 bg-green-50 text-green-800 rounded-xl border border-green-100 flex items-start gap-3 animate-slideDown">
                            <span className="text-xl">✅</span>
                            <div className="flex-1">
                                <h4 className="font-bold">İşlem Başarılı!</h4>
                                <p className="text-sm opacity-90">{successMsg}</p>
                                {resultDetails && resultDetails.error_count > 0 && (
                                    <div className="mt-2 bg-white/50 p-2 rounded text-xs text-red-600">
                                        <strong>Dikkat:</strong> {resultDetails.error_count} kayıt eklenemedi.
                                        <ul className="list-disc list-inside mt-1">
                                            {resultDetails.errors.map((e: string, i: number) => <li key={i}>{e}</li>)}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
}
