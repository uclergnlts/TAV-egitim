"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

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

interface PersonnelInfo {
    sicil_no: string;
    fullName: string;
    gorevi: string;
    found: boolean;
}

interface PendingRecord {
    id: string; // Temporary ID for list management
    sicil_nos: string[]; // Keep for backward compat / API payload
    personnel_details: PersonnelInfo[]; // New: contains full name, gorevi
    sicil_list_str: string; // For form restoration
    training_id: string;
    training_name: string;
    training_topic_id?: string;
    training_topic_name?: string;
    trainer_id: string;
    trainer_name: string;
    ic_dis_egitim: string;
    egitim_yeri: string;
    baslama_tarihi: string;
    bitis_tarihi: string;
    baslama_saati: string;
    bitis_saati: string;
    sonuc_belgesi_turu: string;
    egitim_detayli_aciklama: string;
    duration: number;
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
    const [description, setDescription] = useState("");

    // Date/Time States
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [startTime, setStartTime] = useState("09:00");
    const [endTime, setEndTime] = useState("10:00");

    // Auto-filled (Read-only)
    const [trainingDuration, setTrainingDuration] = useState(0);

    // Personnel
    const [sicilNos, setSicilNos] = useState("");

    // Pending List Logic
    const [pendingRecords, setPendingRecords] = useState<PendingRecord[]>([]);
    const [selectedRecordIds, setSelectedRecordIds] = useState<string[]>([]);

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
        const dateStr = now.toLocaleDateString("en-CA");
        const hours = now.getHours().toString().padStart(2, "0");
        const minutes = now.getMinutes().toString().padStart(2, "0");
        const timeStr = `${hours}:${minutes}`;

        setStartDate(dateStr);
        setEndDate(dateStr);
        setStartTime(timeStr);

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
        setSelectedTopicId("");

        const training = trainings.find(t => t.id === tId);
        if (training) {
            setTrainingDuration(training.duration_min);
            setDocumentType(training.default_document_type || "");
            setTrainingLocation(training.default_location || "");

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
        if (trainingDuration > 0) {
            calculateEndTime(val, trainingDuration);
        }
    };

    const handleDurationAdd = (minutes: number) => {
        if (startTime) {
            calculateEndTime(startTime, minutes);
        }
    };

    // --- LISTE YÖNETİMİ ---

    const handleAddToList = async () => {
        setErrorMsg("");
        setSuccessMsg("");

        // Validation
        const sicilList = sicilNos
            .split(/[\n,]+/)
            .map(s => s.trim())
            .filter(s => s.length > 0);

        if (sicilList.length === 0) {
            setErrorMsg("Lütfen en az bir sicil numarası giriniz.");
            return;
        }

        if (!selectedTrainingId || !selectedTrainerId || !trainingLocation) {
            setErrorMsg("Lütfen tüm zorunlu alanları doldurunuz (*)");
            return;
        }

        const training = trainings.find(t => t.id === selectedTrainingId);
        const trainer = trainers.find(t => t.id === selectedTrainerId);
        let topicName = "";

        if (training?.has_topics) {
            if (!selectedTopicId) {
                setErrorMsg("Bu eğitim için Alt Başlık seçimi zorunludur.");
                return;
            }
            topicName = training.topics.find(t => t.id === selectedTopicId)?.title || "";
        }

        // Fetch personnel details from API
        let personnelDetails: PersonnelInfo[] = [];
        try {
            const res = await fetch("/api/personnel/lookup", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ sicil_nos: sicilList })
            });
            const data = await res.json();
            if (data.success) {
                // Map API response to PersonnelInfo, marking found status
                const foundMap = new Map<string, { sicil_no: string, fullName: string, gorevi: string }>(
                    data.data.map((p: any) => [p.sicil_no, p])
                );
                personnelDetails = sicilList.map(sicil => {
                    const found = foundMap.get(sicil);
                    if (found) {
                        return { sicil_no: sicil, fullName: found.fullName, gorevi: found.gorevi, found: true };
                    } else {
                        return { sicil_no: sicil, fullName: "Bulunamadı", gorevi: "-", found: false };
                    }
                });
            } else {
                // Fallback: just use sicil numbers without names
                personnelDetails = sicilList.map(sicil => ({ sicil_no: sicil, fullName: "?", gorevi: "-", found: false }));
            }
        } catch (err) {
            console.error("Personnel lookup failed:", err);
            personnelDetails = sicilList.map(sicil => ({ sicil_no: sicil, fullName: "?", gorevi: "-", found: false }));
        }

        // Add to Pending List
        const newRecord: PendingRecord = {
            id: crypto.randomUUID(),
            sicil_nos: sicilList,
            personnel_details: personnelDetails,
            sicil_list_str: sicilNos,
            training_id: selectedTrainingId,
            training_name: training?.name || "",
            training_topic_id: selectedTopicId,
            training_topic_name: topicName,
            trainer_id: selectedTrainerId,
            trainer_name: trainer?.fullName || "",
            ic_dis_egitim: locationType,
            egitim_yeri: trainingLocation,
            baslama_tarihi: startDate,
            bitis_tarihi: endDate,
            baslama_saati: startTime,
            bitis_saati: endTime,
            sonuc_belgesi_turu: documentType,
            egitim_detayli_aciklama: description,
            duration: trainingDuration
        };

        setPendingRecords([...pendingRecords, newRecord]);

        // Clear sicil input for next batch
        setSicilNos("");
    };

    const handleRemoveFromList = (id: string) => {
        setPendingRecords(pendingRecords.filter(r => r.id !== id));
        setSelectedRecordIds(selectedRecordIds.filter(sid => sid !== id));
    };

    const handleEditFromList = (record: PendingRecord) => {
        // Formu doldur
        setSicilNos(record.sicil_list_str);
        setSelectedTrainingId(record.training_id);
        setSelectedTopicId(record.training_topic_id || "");
        setSelectedTrainerId(record.trainer_id);
        setLocationType(record.ic_dis_egitim);
        setTrainingLocation(record.egitim_yeri);
        setStartDate(record.baslama_tarihi);
        setEndDate(record.bitis_tarihi);
        setStartTime(record.baslama_saati);
        setEndTime(record.bitis_saati);
        setDocumentType(record.sonuc_belgesi_turu);
        setDescription(record.egitim_detayli_aciklama);
        setTrainingDuration(record.duration); // Görsel amaçlı

        // Listeden çıkar (Kullanıcı tekrar ekle diyecek)
        handleRemoveFromList(record.id);
    };

    const handleBulkDelete = () => {
        setPendingRecords(pendingRecords.filter(r => !selectedRecordIds.includes(r.id)));
        setSelectedRecordIds([]);
    };

    const toggleSelectRecord = (id: string) => {
        if (selectedRecordIds.includes(id)) {
            setSelectedRecordIds(selectedRecordIds.filter(sid => sid !== id));
        } else {
            setSelectedRecordIds([...selectedRecordIds, id]);
        }
    };

    const handleSelectAll = () => {
        if (selectedRecordIds.length === pendingRecords.length) {
            setSelectedRecordIds([]);
        } else {
            setSelectedRecordIds(pendingRecords.map(r => r.id));
        }
    };


    // --- VERİTABANI KAYIT ---

    const handleBulkSave = async () => {
        if (pendingRecords.length === 0) {
            setErrorMsg("Listede eklenecek kayıt bulunmuyor.");
            return;
        }

        setLoading(true);
        setErrorMsg("");
        setSuccessMsg("");

        // Flat mapping records (her pending record birden fazla sicil içerebilir, bunları API'ye tek tek veya array olarak gönderiyoruz)
        // API array bekliyor. Bizim yapımızda pendingRecord içinde sicil_nos array var.
        // API tekil nesnelerden oluşan array bekliyor. Bu yüzden flatten yapmalıyız.

        const flatPayload: any[] = [];

        pendingRecords.forEach(record => {
            record.sicil_nos.forEach(sicil => {
                flatPayload.push({
                    sicil_no: sicil,
                    training_id: record.training_id,
                    training_topic_id: record.training_topic_id,
                    trainer_id: record.trainer_id,
                    ic_dis_egitim: record.ic_dis_egitim,
                    egitim_yeri: record.egitim_yeri,
                    baslama_tarihi: record.baslama_tarihi,
                    bitis_tarihi: record.bitis_tarihi,
                    baslama_saati: record.baslama_saati,
                    bitis_saati: record.bitis_saati,
                    sonuc_belgesi_turu: record.sonuc_belgesi_turu,
                    egitim_detayli_aciklama: record.egitim_detayli_aciklama
                });
            });
        });

        try {
            const res = await fetch("/api/attendances/bulk", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(flatPayload)
            });
            const result = await res.json();

            if (result.success) {
                setSuccessMsg(`Başarıyla kaydedildi! (Toplam ${flatPayload.length} Personel Kaydı)`);
                setPendingRecords([]);
                setSelectedRecordIds([]);
            } else {
                setErrorMsg(result.message || "Kaydetme sırasında hata oluştu");
            }
        } catch (err) {
            setErrorMsg("Sunucu iletişim hatası.");
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
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Eğitim Kayıt Girişi</h1>
                    <p className="text-gray-500 mt-1">Önce kayıtları listeye ekleyin, ardından toplu olarak kaydedin.</p>
                </div>
                <div className="flex items-center space-x-2 bg-blue-50 px-4 py-2 rounded-lg border border-blue-100 text-blue-800 text-sm font-medium">
                    <span>Bugün: {new Date().toLocaleDateString('tr-TR')}</span>
                </div>
            </div>

            {/* FORM AREA */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
                {/* LEFT COLUMN: Training Info */}
                <div className="space-y-6">
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
                            <h2 className="text-lg font-semibold text-white flex items-center">
                                Eğitim Bilgileri
                            </h2>
                        </div>

                        <div className="p-6 space-y-6">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Eğitim Seçin <span className="text-red-500">*</span></label>
                                <select
                                    value={selectedTrainingId}
                                    onChange={handleTrainingChange}
                                    className="w-full h-12 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 text-base px-3"
                                >
                                    <option value="">Seçiniz...</option>
                                    {trainings.map(t => (
                                        <option key={t.id} value={t.id}>{t.code} - {t.name}</option>
                                    ))}
                                </select>
                            </div>

                            {selectedTraining?.has_topics && (
                                <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-100">
                                    <label className="block text-sm font-semibold text-yellow-800 mb-2">Alt Başlık <span className="text-red-500">*</span></label>
                                    <select
                                        value={selectedTopicId}
                                        onChange={(e) => setSelectedTopicId(e.target.value)}
                                        className="w-full h-11 border border-yellow-300 rounded-lg bg-white"
                                    >
                                        <option value="">Alt Başlık Seçiniz...</option>
                                        {selectedTraining.topics.map(topic => (
                                            <option key={topic.id} value={topic.id}>{topic.title}</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Eğitmen <span className="text-red-500">*</span></label>
                                    <select
                                        value={selectedTrainerId}
                                        onChange={(e) => setSelectedTrainerId(e.target.value)}
                                        className="w-full h-11 border border-gray-300 rounded-lg px-3"
                                    >
                                        <option value="">Seçiniz</option>
                                        {trainers.map(t => (
                                            <option key={t.id} value={t.id}>{t.fullName}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Tür</label>
                                    <select
                                        value={locationType}
                                        onChange={(e) => setLocationType(e.target.value)}
                                        className="w-full h-11 border border-gray-300 rounded-lg px-3"
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
                                        className="w-full h-11 border border-gray-300 rounded-lg px-3"
                                    >
                                        <option value="">Seçiniz</option>
                                        {locations.map(loc => (
                                            <option key={loc.id} value={loc.name}>{loc.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Sonuç Belgesi</label>
                                    <select
                                        value={documentType}
                                        onChange={(e) => setDocumentType(e.target.value)}
                                        className="w-full h-11 border border-gray-300 rounded-lg px-3"
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
                </div>

                {/* RIGHT COLUMN */}
                <div className="space-y-6">
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex justify-between">
                            <h2 className="text-lg font-semibold text-gray-800">Tarih ve Saat</h2>
                            <button onClick={setInitialDateTime} className="text-xs text-blue-600 font-bold hover:underline">Sıfırla</button>
                        </div>
                        <div className="p-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="block text-xs font-bold text-gray-500 uppercase">Başlangıç</label>
                                    <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full border border-gray-300 rounded-lg text-sm px-3 py-2" />
                                    <input type="time" value={startTime} onChange={(e) => handleStartTimeChange(e.target.value)} className="w-full border border-gray-300 rounded-lg text-lg font-bold px-3 py-2" />
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-xs font-bold text-gray-500 uppercase">Bitiş</label>
                                    <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full border border-gray-300 rounded-lg text-sm px-3 py-2" />
                                    <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="w-full border border-gray-300 rounded-lg text-lg font-bold px-3 py-2" />
                                </div>
                            </div>
                            {/* Duration Helper */}
                            <div className="mt-4 flex gap-2 overflow-x-auto py-2">
                                {[30, 45, 60, 90, 120, 480].map(m => (
                                    <button key={m} onClick={() => handleDurationAdd(m)} className="px-3 py-1 bg-gray-100 hover:bg-blue-100 text-xs rounded-full border border-gray-200">+{m}dk</button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Personnel Input */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col h-[300px]">
                        <div className="bg-gray-50 px-6 py-4 border-b border-gray-100">
                            <h2 className="text-lg font-semibold text-gray-800">Katılımcı Sicilleri</h2>
                        </div>
                        <div className="p-4 flex-1 flex flex-col">
                            <textarea
                                value={sicilNos}
                                onChange={(e) => setSicilNos(e.target.value)}
                                placeholder="Her satıra bir sicil no gelecek şekilde yapıştırın..."
                                className="w-full flex-1 border border-gray-300 rounded-xl p-3 resize-none font-mono text-sm focus:ring-2 focus:ring-blue-500"
                            />
                            <div className="mt-2 text-right">
                                <button onClick={() => setSicilNos("")} className="text-xs text-red-500 hover:text-red-700">Temizle</button>
                            </div>
                        </div>
                    </div>

                    {/* ADD BUTTON */}
                    <button
                        onClick={handleAddToList}
                        className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-lg rounded-xl shadow-lg transition-transform active:scale-95"
                    >
                        LİSTEYE EKLE ⬇️
                    </button>
                </div>
            </div>

            {/* ERROR / SUCCESS MESSAGES */}
            {(errorMsg || successMsg) && (
                <div className={`mb-8 p-4 rounded-xl border flex items-center gap-3 ${errorMsg ? 'bg-red-50 border-red-100 text-red-800' : 'bg-green-50 border-green-100 text-green-800'}`}>
                    <span className="text-2xl">{errorMsg ? '⚠️' : '✅'}</span>
                    <div>
                        <h4 className="font-bold">{errorMsg ? 'Hata' : 'İşlem Başarılı'}</h4>
                        <p>{errorMsg || successMsg}</p>
                    </div>
                </div>
            )}


            {/* PENDING LIST TABLE */}
            {pendingRecords.length > 0 && (
                <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden mb-12 animate-slideUp">
                    <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                        <div>
                            <h2 className="text-xl font-bold text-gray-800">Eklenecek Kayıtlar Listesi</h2>
                            <p className="text-sm text-gray-500">{pendingRecords.length} grup kaydı bekliyor</p>
                        </div>
                        {selectedRecordIds.length > 0 && (
                            <button
                                onClick={handleBulkDelete}
                                className="bg-red-100 text-red-700 px-4 py-2 rounded-lg text-sm font-bold hover:bg-red-200 transition-colors"
                            >
                                Seçilenleri Sil ({selectedRecordIds.length})
                            </button>
                        )}
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-100 text-gray-600 uppercase text-xs font-bold">
                                <tr>
                                    <th className="p-4 w-10">
                                        <input
                                            type="checkbox"
                                            onChange={handleSelectAll}
                                            checked={pendingRecords.length > 0 && selectedRecordIds.length === pendingRecords.length}
                                            className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                        />
                                    </th>
                                    <th className="p-4">Eğitim</th>
                                    <th className="p-4">Tarih</th>
                                    <th className="p-4">Katılımcılar</th>
                                    <th className="p-4">Eğitmen / Yer</th>
                                    <th className="p-4 text-center">İşlemler</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {pendingRecords.map((record) => (
                                    <tr key={record.id} className={`hover:bg-blue-50 transition-colors ${selectedRecordIds.includes(record.id) ? 'bg-blue-50' : ''}`}>
                                        <td className="p-4">
                                            <input
                                                type="checkbox"
                                                checked={selectedRecordIds.includes(record.id)}
                                                onChange={() => toggleSelectRecord(record.id)}
                                                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                            />
                                        </td>
                                        <td className="p-4">
                                            <div className="font-bold text-gray-900">{record.training_name}</div>
                                            {record.training_topic_name && <div className="text-xs text-orange-600">{record.training_topic_name}</div>}
                                            <div className="text-xs text-gray-400 mt-1">{record.duration} dk</div>
                                        </td>
                                        <td className="p-4">
                                            <div className="text-gray-900">{record.baslama_tarihi}</div>
                                            <div className="text-xs text-gray-500">{record.baslama_saati} - {record.bitis_saati}</div>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex flex-wrap gap-1">
                                                {record.personnel_details.slice(0, 5).map(p => (
                                                    <span
                                                        key={p.sicil_no}
                                                        className={`px-2 py-0.5 rounded text-xs border ${p.found ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-600 border-red-200'}`}
                                                        title={`${p.sicil_no} - ${p.gorevi}`}
                                                    >
                                                        {p.fullName}
                                                    </span>
                                                ))}
                                                {record.personnel_details.length > 5 && (
                                                    <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-bold">+{record.personnel_details.length - 5} kişi daha</span>
                                                )}
                                            </div>
                                            <div className="text-xs text-gray-400 mt-1">Toplam {record.personnel_details.length} kişi</div>
                                        </td>
                                        <td className="p-4">
                                            <div className="text-gray-900">{record.trainer_name}</div>
                                            <div className="text-xs text-gray-500">{record.egitim_yeri} ({record.ic_dis_egitim})</div>
                                        </td>
                                        <td className="p-4 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <button
                                                    onClick={() => handleEditFromList(record)}
                                                    className="p-2 text-blue-600 hover:bg-blue-100 rounded-full transition-colors"
                                                    title="Düzenle (Listeden çıkarıp forma geri yükler)"
                                                >
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                                </button>
                                                <button
                                                    onClick={() => handleRemoveFromList(record.id)}
                                                    className="p-2 text-red-600 hover:bg-red-100 rounded-full transition-colors"
                                                    title="Listeden Sil"
                                                >
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* BULK ACTION BAR */}
                    <div className="bg-gray-50 px-6 py-6 border-t border-gray-200">
                        <div className="flex justify-end">
                            <button
                                onClick={handleBulkSave}
                                disabled={loading}
                                className={`px-8 py-4 bg-green-600 hover:bg-green-700 text-white font-bold text-lg rounded-xl shadow-lg flex items-center gap-3 transition-all transform hover:scale-105 ${loading ? 'opacity-70 cursor-wait' : ''}`}
                            >
                                {loading ? (
                                    <>
                                        <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                        <span>GÖNDERİLİYOR...</span>
                                    </>
                                ) : (
                                    <>
                                        <span>TÜMÜNÜ KAYDET VE TAMAMLA</span>
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
