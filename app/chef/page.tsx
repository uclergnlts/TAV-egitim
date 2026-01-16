"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import * as XLSX from "xlsx";
import { exportToPDF } from "@/lib/pdfExport";

// Icons
const EditIcon = ({ className }: { className?: string }) => (
    <svg className={className || "w-4 h-4"} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
    </svg>
);
const TrashIcon = ({ className }: { className?: string }) => (
    <svg className={className || "w-4 h-4"} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
);

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
    id: string;
    sicil_nos: string[];
    personnel_details: PersonnelInfo[];
    sicil_list_str: string;
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

type EditMode = 'NONE' | 'TRAINING' | 'DATE' | 'TRAINER' | 'PERSONNEL';

export default function ChefDashboard() {
    const router = useRouter();

    // Data
    const [trainings, setTrainings] = useState<Training[]>([]);
    const [trainers, setTrainers] = useState<Trainer[]>([]);
    const [locations, setLocations] = useState<Definition[]>([]);
    const [documentTypes, setDocumentTypes] = useState<Definition[]>([]);

    // Main Form States
    const [selectedTrainingId, setSelectedTrainingId] = useState("");
    const [selectedTopicId, setSelectedTopicId] = useState("");
    const [selectedTrainerId, setSelectedTrainerId] = useState("");
    const [locationType, setLocationType] = useState("IC");
    const [trainingLocation, setTrainingLocation] = useState("");
    const [documentType, setDocumentType] = useState("");
    const [description, setDescription] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [startTime, setStartTime] = useState("09:00");
    const [endTime, setEndTime] = useState("10:00");
    const [trainingDuration, setTrainingDuration] = useState(0);
    const [sicilNos, setSicilNos] = useState("");

    // Pending List Logic
    const [pendingRecords, setPendingRecords] = useState<PendingRecord[]>([]);
    const [selectedRecordIds, setSelectedRecordIds] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [successMsg, setSuccessMsg] = useState("");
    const [errorMsg, setErrorMsg] = useState("");

    // EDIT MODAL STATE
    const [editMode, setEditMode] = useState<EditMode>('NONE');
    const [editingRecord, setEditingRecord] = useState<PendingRecord | null>(null);
    // Temporary edit states
    const [editTrainingId, setEditTrainingId] = useState("");
    const [editTopicId, setEditTopicId] = useState("");
    const [editStartDate, setEditStartDate] = useState("");
    const [editEndDate, setEditEndDate] = useState("");
    const [editStartTime, setEditStartTime] = useState("");
    const [editEndTime, setEditEndTime] = useState("");
    const [editTrainerId, setEditTrainerId] = useState("");
    const [editLocation, setEditLocation] = useState("");
    const [editSicils, setEditSicils] = useState("");

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

    // --- FORM HANDLING ---

    const handleTrainingChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const tId = e.target.value;
        setSelectedTrainingId(tId);
        setSelectedTopicId("");

        const training = trainings.find(t => t.id === tId);
        if (training) {
            setTrainingDuration(training.duration_min);
            setDocumentType(training.default_document_type || "");
            setTrainingLocation(training.default_location || "");
            if (startTime) calculateEndTime(startTime, training.duration_min, setEndTime);
        } else {
            setTrainingDuration(0);
        }
    };

    const calculateEndTime = (startStr: string, durationMin: number, setter: (val: string) => void) => {
        if (!startStr) return;
        const [h, m] = startStr.split(":").map(Number);
        const date = new Date();
        date.setHours(h, m, 0, 0);
        date.setMinutes(date.getMinutes() + durationMin);

        const endH = date.getHours().toString().padStart(2, "0");
        const endM = date.getMinutes().toString().padStart(2, "0");
        setter(`${endH}:${endM}`);
    };

    const handleStartTimeChange = (val: string) => {
        setStartTime(val);
        if (trainingDuration > 0) calculateEndTime(val, trainingDuration, setEndTime);
    };

    const handleDurationAdd = (minutes: number) => {
        if (startTime) calculateEndTime(startTime, minutes, setEndTime);
    };

    // --- ADD TO LIST ---

    const handleAddToList = async () => {
        setErrorMsg("");
        setSuccessMsg("");

        const sicilList = sicilNos.split(/[\n,]+/).map(s => s.trim()).filter(s => s.length > 0);
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

        if (training?.has_topics && !selectedTopicId) {
            setErrorMsg("Bu eğitim için Alt Başlık seçimi zorunludur.");
            return;
        }

        const topicName = training?.topics.find(t => t.id === selectedTopicId)?.title || "";
        const personnelDetails = await fetchPersonnelDetails(sicilList);

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
        setSicilNos("");
    };

    const fetchPersonnelDetails = async (sicils: string[]): Promise<PersonnelInfo[]> => {
        try {
            const res = await fetch("/api/personnel/lookup", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ sicil_nos: sicils })
            });
            const data = await res.json();
            if (data.success) {
                const foundMap = new Map<string, any>(data.data.map((p: any) => [p.sicil_no, p]));
                return sicils.map(sicil => {
                    const found = foundMap.get(sicil);
                    return found
                        ? { sicil_no: sicil, fullName: found.fullName, gorevi: found.gorevi, found: true }
                        : { sicil_no: sicil, fullName: "Bulunamadı", gorevi: "-", found: false };
                });
            }
        } catch (err) {
            console.error("Lookup failed", err);
        }
        return sicils.map(sicil => ({ sicil_no: sicil, fullName: "?", gorevi: "-", found: false }));
    };

    // --- LIST ACTIONS ---

    const handleRemoveFromList = (id: string) => {
        setPendingRecords(pendingRecords.filter(r => r.id !== id));
        setSelectedRecordIds(selectedRecordIds.filter(sid => sid !== id));
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
        if (selectedRecordIds.length === pendingRecords.length) setSelectedRecordIds([]);
        else setSelectedRecordIds(pendingRecords.map(r => r.id));
    };

    // --- MODAL & EDIT ACTIONS ---

    const openEditModal = (record: PendingRecord, mode: EditMode) => {
        setEditingRecord(record);
        setEditMode(mode);

        if (mode === 'TRAINING') {
            setEditTrainingId(record.training_id);
            setEditTopicId(record.training_topic_id || "");
        } else if (mode === 'DATE') {
            setEditStartDate(record.baslama_tarihi);
            setEditEndDate(record.bitis_tarihi);
            setEditStartTime(record.baslama_saati);
            setEditEndTime(record.bitis_saati);
        } else if (mode === 'TRAINER') {
            setEditTrainerId(record.trainer_id);
            setEditLocation(record.egitim_yeri);
        } else if (mode === 'PERSONNEL') {
            setEditSicils(record.sicil_list_str);
        }
    };

    const closeEditModal = () => {
        setEditMode('NONE');
        setEditingRecord(null);
    };

    const saveEdit = async () => {
        if (!editingRecord) return;

        let updated = { ...editingRecord };

        if (editMode === 'TRAINING') {
            const t = trainings.find(t => t.id === editTrainingId);
            const topic = t?.topics.find(tp => tp.id === editTopicId);
            if (t?.has_topics && !editTopicId) {
                alert("Alt başlık seçilmelidir.");
                return;
            }
            updated.training_id = editTrainingId;
            updated.training_name = t?.name || "";
            updated.training_topic_id = editTopicId;
            updated.training_topic_name = topic?.title || "";
            updated.duration = t?.duration_min || 0;
        }
        else if (editMode === 'DATE') {
            updated.baslama_tarihi = editStartDate;
            updated.bitis_tarihi = editEndDate;
            updated.baslama_saati = editStartTime;
            updated.bitis_saati = editEndTime;
        }
        else if (editMode === 'TRAINER') {
            const tr = trainers.find(t => t.id === editTrainerId);
            updated.trainer_id = editTrainerId;
            updated.trainer_name = tr?.fullName || "";
            updated.egitim_yeri = editLocation;
        }
        else if (editMode === 'PERSONNEL') {
            const sicilList = editSicils.split(/[\n,]+/).map(s => s.trim()).filter(s => s.length > 0);
            if (sicilList.length === 0) {
                alert("En az bir sicil olmalıdır.");
                return;
            }
            const details = await fetchPersonnelDetails(sicilList);
            updated.sicil_nos = sicilList;
            updated.personnel_details = details;
            updated.sicil_list_str = editSicils;
        }

        setPendingRecords(prev => prev.map(r => r.id === updated.id ? updated : r));
        closeEditModal();
    };


    // --- DATABASE SAVE ---

    const handleBulkSave = async () => {
        if (pendingRecords.length === 0) return;
        setLoading(true);

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

    // --- EXPORT FUNCTIONS ---

    const exportPendingToExcel = () => {
        if (pendingRecords.length === 0) return;

        const flatData: any[] = [];
        pendingRecords.forEach(record => {
            record.personnel_details.forEach(person => {
                flatData.push({
                    "Sicil No": person.sicil_no,
                    "Ad Soyad": person.fullName,
                    "Görevi": person.gorevi,
                    "Eğitim": record.training_name,
                    "Alt Başlık": record.training_topic_name || "",
                    "Süre (dk)": record.duration,
                    "Başlangıç Tarihi": record.baslama_tarihi,
                    "Bitiş Tarihi": record.bitis_tarihi,
                    "Başlangıç Saati": record.baslama_saati,
                    "Bitiş Saati": record.bitis_saati,
                    "Eğitmen": record.trainer_name,
                    "Eğitim Yeri": record.egitim_yeri,
                    "İç/Dış": record.ic_dis_egitim,
                });
            });
        });

        const ws = XLSX.utils.json_to_sheet(flatData);
        const colWidths = Object.keys(flatData[0] || {}).map(() => ({ wch: 18 }));
        ws['!cols'] = colWidths;

        const wb = XLSX.utils.book_new();
        const dateStr = new Date().toLocaleDateString('tr-TR').replace(/\./g, '-');
        XLSX.utils.book_append_sheet(wb, ws, `Bekleyen Kayitlar`);
        XLSX.writeFile(wb, `Egitim_Kayitlari_${dateStr}.xlsx`);
    };

    const exportPendingToPDF = () => {
        if (pendingRecords.length === 0) return;

        const headers = ["Sicil No", "Ad Soyad", "Görevi", "Eğitim", "Tarih", "Saat", "Eğitmen", "Yer"];
        const rows: (string | number)[][] = [];

        pendingRecords.forEach(record => {
            record.personnel_details.forEach(person => {
                rows.push([
                    person.sicil_no,
                    person.fullName,
                    person.gorevi || "-",
                    record.training_name + (record.training_topic_name ? ` (${record.training_topic_name})` : ""),
                    record.baslama_tarihi,
                    `${record.baslama_saati}-${record.bitis_saati}`,
                    record.trainer_name,
                    record.egitim_yeri,
                ]);
            });
        });

        const dateStr = new Date().toLocaleDateString('tr-TR');
        exportToPDF({
            title: "Eğitim Katılım Listesi",
            subtitle: `Oluşturma Tarihi: ${dateStr} • Toplam ${rows.length} Kayıt`,
            headers,
            rows,
            filename: `Egitim_Katilim_Listesi_${dateStr.replace(/\./g, '-')}`,
            orientation: 'landscape',
        });
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
                                    className="w-full h-11 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm px-3 bg-white"
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
                                        className="w-full h-11 border border-yellow-300 rounded-lg bg-white px-3 text-sm focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400"
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
                                        className="w-full h-11 border border-gray-300 rounded-lg px-3 text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                                        className="w-full h-11 border border-gray-300 rounded-lg px-3 text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                                        className="w-full h-11 border border-gray-300 rounded-lg px-3 text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                                        className="w-full h-11 border border-gray-300 rounded-lg px-3 text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                                <div className="space-y-3">
                                    <label className="block text-xs font-bold text-gray-500 uppercase">Başlangıç</label>
                                    <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full h-11 border border-gray-300 rounded-lg text-sm px-3 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                                    <input type="time" value={startTime} onChange={(e) => handleStartTimeChange(e.target.value)} className="w-full h-11 border border-gray-300 rounded-lg text-base font-semibold px-3 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                                </div>
                                <div className="space-y-3">
                                    <label className="block text-xs font-bold text-gray-500 uppercase">Bitiş</label>
                                    <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full h-11 border border-gray-300 rounded-lg text-sm px-3 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                                    <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="w-full h-11 border border-gray-300 rounded-lg text-base font-semibold px-3 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                                </div>
                            </div>
                            <div className="mt-4 flex gap-2 overflow-x-auto py-2">
                                {[30, 45, 60, 90, 120, 480].map(m => (
                                    <button key={m} onClick={() => handleDurationAdd(m)} className="px-3 py-1 bg-gray-100 hover:bg-blue-100 text-xs rounded-full border border-gray-200">+{m}dk</button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col h-[300px]">
                        <div className="bg-gray-50 px-6 py-4 border-b border-gray-100">
                            <h2 className="text-lg font-semibold text-gray-800">Katılımcı Sicilleri</h2>
                        </div>
                        <div className="p-4 flex-1 flex flex-col">
                            <textarea
                                value={sicilNos}
                                onChange={(e) => setSicilNos(e.target.value)}
                                placeholder="Her satıra bir sicil no gelecek şekilde yapıştırın..."
                                className="w-full flex-1 border border-gray-300 rounded-lg p-3 resize-none font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                            />
                            <div className="mt-2 text-right">
                                <button onClick={() => setSicilNos("")} className="text-xs text-red-500 hover:text-red-700">Temizle</button>
                            </div>
                        </div>
                    </div>

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
                    <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                        <div>
                            <h2 className="text-xl font-bold text-gray-800">Eklenecek Kayıtlar</h2>
                            <p className="text-sm text-gray-500">Aşağıdaki tablodan detayları inceleyebilir ve düzenleyebilirsiniz.</p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            {/* Export Buttons */}
                            <button
                                onClick={exportPendingToExcel}
                                className="bg-green-50 text-green-700 px-3 py-2 rounded-lg text-sm font-medium hover:bg-green-100 transition-colors flex items-center gap-1.5"
                                title="Excel olarak indir"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                <span className="hidden sm:inline">Excel</span>
                            </button>
                            <button
                                onClick={exportPendingToPDF}
                                className="bg-red-50 text-red-700 px-3 py-2 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors flex items-center gap-1.5"
                                title="PDF olarak indir"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                </svg>
                                <span className="hidden sm:inline">PDF</span>
                            </button>
                            {selectedRecordIds.length > 0 && (
                                <button
                                    onClick={handleBulkDelete}
                                    className="bg-red-100 text-red-700 px-3 py-2 rounded-lg text-sm font-bold hover:bg-red-200 transition-colors"
                                >
                                    Sil ({selectedRecordIds.length})
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50/50">
                                <tr>
                                    <th className="w-10 px-4 py-4">
                                        <input
                                            type="checkbox"
                                            onChange={handleSelectAll}
                                            checked={pendingRecords.length > 0 && selectedRecordIds.length === pendingRecords.length}
                                            className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                        />
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Eğitim Detayları</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sicil No</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ad Soyad</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Grubu</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Eğitmen / Yer</th>
                                    <th className="relative px-6 py-3">
                                        <span className="sr-only">İşlemler</span>
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-100">
                                {pendingRecords.flatMap((record, recordIndex) =>
                                    record.personnel_details.map((person, personIndex) => {
                                        const isFirstOfGroup = personIndex === 0;
                                        const rowSpan = record.personnel_details.length;
                                        const rowKey = `${record.id}-${person.sicil_no}`;

                                        return (
                                            <tr key={rowKey} className={`hover:bg-blue-50/30 transition-colors ${selectedRecordIds.includes(record.id) ? 'bg-blue-50' : ''} ${!isFirstOfGroup ? 'border-t border-gray-50' : ''}`}>
                                                {/* CHECKBOX - only on first row of group */}
                                                {isFirstOfGroup && (
                                                    <td className="px-4 py-4 whitespace-nowrap" rowSpan={rowSpan}>
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedRecordIds.includes(record.id)}
                                                            onChange={() => toggleSelectRecord(record.id)}
                                                            className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                        />
                                                    </td>
                                                )}

                                                {/* TRAINING COL - only on first row of group */}
                                                {isFirstOfGroup && (
                                                    <td className="px-6 py-4" rowSpan={rowSpan}>
                                                        <div className="group relative flex items-start gap-2">
                                                            <div>
                                                                <div className="font-bold text-gray-900">{record.training_name}</div>
                                                                {record.training_topic_name && <div className="text-xs text-orange-600 mt-1">{record.training_topic_name}</div>}
                                                                <div className="text-xs text-gray-500 mt-1">{record.duration} dk • {record.baslama_tarihi}</div>
                                                                <div className="text-xs text-gray-400">{record.baslama_saati} - {record.bitis_saati}</div>
                                                            </div>
                                                            <button
                                                                onClick={() => openEditModal(record, 'TRAINING')}
                                                                className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-blue-100 text-blue-600 rounded-md transition-all absolute -right-2 top-0"
                                                                title="Eğitimi Düzenle"
                                                            >
                                                                <EditIcon className="w-3.5 h-3.5" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                )}

                                                {/* SICIL NO COL */}
                                                <td className="px-6 py-3">
                                                    <span className={`font-mono font-bold text-sm px-2 py-1 rounded ${person.found ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
                                                        {person.sicil_no}
                                                    </span>
                                                </td>

                                                {/* AD SOYAD COL */}
                                                <td className="px-6 py-3">
                                                    <span className={`font-medium text-sm ${person.found ? 'text-gray-900' : 'text-red-500'}`}>
                                                        {person.fullName}
                                                    </span>
                                                </td>

                                                {/* GRUBU COL */}
                                                <td className="px-6 py-3">
                                                    <span className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded">
                                                        {person.gorevi || '-'}
                                                    </span>
                                                </td>

                                                {/* TRAINER COL - only on first row of group */}
                                                {isFirstOfGroup && (
                                                    <td className="px-6 py-4" rowSpan={rowSpan}>
                                                        <div className="group relative flex items-start gap-2">
                                                            <div>
                                                                <div className="text-sm font-medium text-gray-900">{record.trainer_name}</div>
                                                                <div className="text-xs text-gray-500 mt-0.5">{record.egitim_yeri}</div>
                                                                <div className="text-xs text-gray-400">({record.ic_dis_egitim})</div>
                                                            </div>
                                                            <button
                                                                onClick={() => openEditModal(record, 'TRAINER')}
                                                                className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-blue-100 text-blue-600 rounded-md transition-all absolute -right-2 top-0"
                                                                title="Eğitmen/Yer Düzenle"
                                                            >
                                                                <EditIcon className="w-3.5 h-3.5" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                )}

                                                {/* ACTIONS - only on first row of group */}
                                                {isFirstOfGroup && (
                                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium" rowSpan={rowSpan}>
                                                        <div className="flex flex-col gap-2 items-end">
                                                            <button
                                                                onClick={() => openEditModal(record, 'PERSONNEL')}
                                                                className="text-blue-500 hover:text-blue-700 p-2 hover:bg-blue-50 rounded-lg transition-colors"
                                                                title="Katılımcıları Düzenle"
                                                            >
                                                                <EditIcon className="w-4 h-4" />
                                                            </button>
                                                            <button
                                                                onClick={() => handleRemoveFromList(record.id)}
                                                                className="text-red-400 hover:text-red-600 p-2 hover:bg-red-50 rounded-lg transition-colors"
                                                                title="Listeden Kaldır"
                                                            >
                                                                <TrashIcon className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                )}
                                            </tr>
                                        );
                                    })
                                )}
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

            {/* EDIT MODAL */}
            {editMode !== 'NONE' && (
                <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden">
                        <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                            <h3 className="font-bold text-lg text-gray-800">
                                {editMode === 'TRAINING' && 'Eğitimi Düzenle'}
                                {editMode === 'DATE' && 'Tarih ve Saat Düzenle'}
                                {editMode === 'TRAINER' && 'Eğitmen ve Yer Düzenle'}
                                {editMode === 'PERSONNEL' && 'Katılımcı Listesini Düzenle'}
                            </h3>
                            <button onClick={closeEditModal} className="text-gray-400 hover:text-gray-600">✕</button>
                        </div>

                        <div className="p-6 space-y-4">
                            {editMode === 'TRAINING' && (
                                <>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Eğitim</label>
                                        <select
                                            value={editTrainingId}
                                            onChange={(e) => {
                                                setEditTrainingId(e.target.value);
                                                setEditTopicId("");
                                            }}
                                            className="w-full border-gray-300 rounded-lg text-sm"
                                        >
                                            {trainings.map(t => (
                                                <option key={t.id} value={t.id}>{t.code} - {t.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    {trainings.find(t => t.id === editTrainingId)?.has_topics && (
                                        <div>
                                            <label className="block text-sm font-medium mb-1">Alt Başlık</label>
                                            <select
                                                value={editTopicId}
                                                onChange={(e) => setEditTopicId(e.target.value)}
                                                className="w-full border-gray-300 rounded-lg text-sm"
                                            >
                                                <option value="">Seçiniz</option>
                                                {trainings.find(t => t.id === editTrainingId)?.topics.map(topic => (
                                                    <option key={topic.id} value={topic.id}>{topic.title}</option>
                                                ))}
                                            </select>
                                        </div>
                                    )}
                                </>
                            )}

                            {editMode === 'DATE' && (
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Başlangıç</label>
                                        <input type="date" value={editStartDate} onChange={(e) => setEditStartDate(e.target.value)} className="w-full border-gray-300 rounded-lg text-sm mb-2" />
                                        <input type="time" value={editStartTime} onChange={(e) => setEditStartTime(e.target.value)} className="w-full border-gray-300 rounded-lg text-sm" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Bitiş</label>
                                        <input type="date" value={editEndDate} onChange={(e) => setEditEndDate(e.target.value)} className="w-full border-gray-300 rounded-lg text-sm mb-2" />
                                        <input type="time" value={editEndTime} onChange={(e) => setEditEndTime(e.target.value)} className="w-full border-gray-300 rounded-lg text-sm" />
                                    </div>
                                </div>
                            )}

                            {editMode === 'TRAINER' && (
                                <>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Eğitmen</label>
                                        <select
                                            value={editTrainerId}
                                            onChange={(e) => setEditTrainerId(e.target.value)}
                                            className="w-full border-gray-300 rounded-lg text-sm"
                                        >
                                            {trainers.map(t => (
                                                <option key={t.id} value={t.id}>{t.fullName}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Eğitim Yeri</label>
                                        <select
                                            value={editLocation}
                                            onChange={(e) => setEditLocation(e.target.value)}
                                            className="w-full border-gray-300 rounded-lg text-sm"
                                        >
                                            {locations.map(loc => (
                                                <option key={loc.id} value={loc.name}>{loc.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </>
                            )}

                            {editMode === 'PERSONNEL' && (
                                <div>
                                    <label className="block text-sm font-medium mb-1">Sicil Listesi</label>
                                    <textarea
                                        value={editSicils}
                                        onChange={(e) => setEditSicils(e.target.value)}
                                        rows={10}
                                        className="w-full border-gray-300 rounded-lg font-mono text-sm"
                                        placeholder="Her satıra bir sicil"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">Not: Değişiklik sonrası kişi bilgileri tekrar kontrol edilecektir.</p>
                                </div>
                            )}
                        </div>

                        <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3">
                            <button
                                onClick={closeEditModal}
                                className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50"
                            >
                                İptal
                            </button>
                            <button
                                onClick={saveEdit}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
                            >
                                Kaydet
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
