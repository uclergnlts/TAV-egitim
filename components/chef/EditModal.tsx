"use client";

import { useEffect, useCallback } from "react";

interface Training {
    id: string;
    code: string;
    name: string;
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

type EditMode = 'NONE' | 'TRAINING' | 'DATE' | 'TRAINER' | 'PERSONNEL';

interface EditModalProps {
    isOpen: boolean;
    mode: EditMode;
    trainings: Training[];
    trainers: Trainer[];
    locations: Definition[];
    editTrainingId: string;
    editTopicId: string;
    editStartDate: string;
    editEndDate: string;
    editStartTime: string;
    editEndTime: string;
    editTrainerId: string;
    editLocation: string;
    editSicils: string;
    onClose: () => void;
    onSave: () => void;
    onTrainingIdChange: (id: string) => void;
    onTopicIdChange: (id: string) => void;
    onStartDateChange: (date: string) => void;
    onEndDateChange: (date: string) => void;
    onStartTimeChange: (time: string) => void;
    onEndTimeChange: (time: string) => void;
    onTrainerIdChange: (id: string) => void;
    onLocationChange: (location: string) => void;
    onSicilsChange: (sicils: string) => void;
}

export function EditModal({
    isOpen,
    mode,
    trainings,
    trainers,
    locations,
    editTrainingId,
    editTopicId,
    editStartDate,
    editEndDate,
    editStartTime,
    editEndTime,
    editTrainerId,
    editLocation,
    editSicils,
    onClose,
    onSave,
    onTrainingIdChange,
    onTopicIdChange,
    onStartDateChange,
    onEndDateChange,
    onStartTimeChange,
    onEndTimeChange,
    onTrainerIdChange,
    onLocationChange,
    onSicilsChange,
}: EditModalProps) {
    // Keyboard shortcut: Escape to close
    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        if (e.key === 'Escape') {
            onClose();
        }
        // Ctrl+Enter to save
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            onSave();
        }
    }, [onClose, onSave]);

    useEffect(() => {
        if (isOpen) {
            window.addEventListener('keydown', handleKeyDown);
            return () => window.removeEventListener('keydown', handleKeyDown);
        }
    }, [isOpen, handleKeyDown]);

    if (!isOpen || mode === 'NONE') return null;

    const getTitle = () => {
        switch (mode) {
            case 'TRAINING': return 'Eğitimi Düzenle';
            case 'DATE': return 'Tarih ve Saat Düzenle';
            case 'TRAINER': return 'Eğitmen ve Yer Düzenle';
            case 'PERSONNEL': return 'Katılımcı Listesini Düzenle';
            default: return '';
        }
    };

    return (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden">
                <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                    <h3 className="font-bold text-lg text-gray-800">{getTitle()}</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
                </div>

                <div className="p-6 space-y-4">
                    {mode === 'TRAINING' && (
                        <>
                            <div>
                                <label className="block text-sm font-medium mb-1">Eğitim</label>
                                <select
                                    title="Eğitim Seç"
                                    value={editTrainingId}
                                    onChange={(e) => {
                                        onTrainingIdChange(e.target.value);
                                        onTopicIdChange("");
                                    }}
                                    className="w-full border-gray-300 rounded-lg text-sm p-2 border"
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
                                        title="Alt Başlık Seç"
                                        value={editTopicId}
                                        onChange={(e) => onTopicIdChange(e.target.value)}
                                        className="w-full border-gray-300 rounded-lg text-sm p-2 border"
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

                    {mode === 'DATE' && (
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Başlangıç</label>
                                <input 
                                    type="date" 
                                    title="Başlangıç Tarihi"
                                    value={editStartDate} 
                                    onChange={(e) => onStartDateChange(e.target.value)} 
                                    className="w-full border-gray-300 rounded-lg text-sm mb-2 p-2 border" 
                                />
                                <input 
                                    type="time" 
                                    title="Başlangıç Saati"
                                    value={editStartTime} 
                                    onChange={(e) => onStartTimeChange(e.target.value)} 
                                    className="w-full border-gray-300 rounded-lg text-sm p-2 border" 
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Bitiş</label>
                                <input 
                                    type="date" 
                                    title="Bitiş Tarihi"
                                    value={editEndDate} 
                                    onChange={(e) => onEndDateChange(e.target.value)} 
                                    className="w-full border-gray-300 rounded-lg text-sm mb-2 p-2 border" 
                                />
                                <input 
                                    type="time" 
                                    title="Bitiş Saati"
                                    value={editEndTime} 
                                    onChange={(e) => onEndTimeChange(e.target.value)} 
                                    className="w-full border-gray-300 rounded-lg text-sm p-2 border" 
                                />
                            </div>
                        </div>
                    )}

                    {mode === 'TRAINER' && (
                        <>
                            <div>
                                <label className="block text-sm font-medium mb-1">Eğitmen</label>
                                <select
                                    title="Eğitmen Seç"
                                    value={editTrainerId}
                                    onChange={(e) => onTrainerIdChange(e.target.value)}
                                    className="w-full border-gray-300 rounded-lg text-sm p-2 border"
                                >
                                    {trainers.map(t => (
                                        <option key={t.id} value={t.id}>{t.fullName}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Eğitim Yeri</label>
                                <select
                                    title="Eğitim Yeri Seç"
                                    value={editLocation}
                                    onChange={(e) => onLocationChange(e.target.value)}
                                    className="w-full border-gray-300 rounded-lg text-sm p-2 border"
                                >
                                    {locations.map(loc => (
                                        <option key={loc.id} value={loc.name}>{loc.name}</option>
                                    ))}
                                </select>
                            </div>
                        </>
                    )}

                    {mode === 'PERSONNEL' && (
                        <div>
                            <label className="block text-sm font-medium mb-1">Sicil Listesi</label>
                            <textarea
                                value={editSicils}
                                onChange={(e) => onSicilsChange(e.target.value)}
                                rows={10}
                                className="w-full border-gray-300 rounded-lg font-mono text-sm p-2 border"
                                placeholder="Her satıra bir sicil"
                            />
                            <p className="text-xs text-gray-500 mt-1">Not: Değişiklik sonrası kişi bilgileri tekrar kontrol edilecektir.</p>
                        </div>
                    )}
                </div>

                <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3">
                    <p className="text-xs text-gray-400 mr-auto self-center">
                        Kısayol: Ctrl+Enter (Kaydet) | Esc (Kapat)
                    </p>
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50"
                    >
                        İptal
                    </button>
                    <button
                        onClick={onSave}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
                    >
                        Kaydet
                    </button>
                </div>
            </div>
        </div>
    );
}
