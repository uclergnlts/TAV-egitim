"use client";

import { SearchableSelect } from "./SearchableSelect";

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

interface TrainingFormProps {
    trainings: Training[];
    trainers: Trainer[];
    locations: Definition[];
    documentTypes: Definition[];
    selectedTrainingId: string;
    selectedTopicId: string;
    selectedTrainerId: string;
    locationType: string;
    trainingLocation: string;
    documentType: string;
    onTrainingChange: (trainingId: string, training: Training | undefined) => void;
    onTopicChange: (topicId: string) => void;
    onTrainerChange: (trainerId: string) => void;
    onLocationTypeChange: (type: string) => void;
    onLocationChange: (location: string) => void;
    onDocumentTypeChange: (docType: string) => void;
}

export function TrainingForm({
    trainings,
    trainers,
    locations,
    documentTypes,
    selectedTrainingId,
    selectedTopicId,
    selectedTrainerId,
    locationType,
    trainingLocation,
    documentType,
    onTrainingChange,
    onTopicChange,
    onTrainerChange,
    onLocationTypeChange,
    onLocationChange,
    onDocumentTypeChange,
}: TrainingFormProps) {
    const selectedTraining = trainings.find(t => t.id === selectedTrainingId);

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
                <h2 className="text-lg font-semibold text-white flex items-center">
                    Eğitim Bilgileri
                </h2>
            </div>

            <div className="p-6 space-y-6">
                <div>
                    <SearchableSelect
                        label="Eğitim Seçin"
                        required
                        options={trainings.map(t => ({
                            value: t.id,
                            label: `${t.code} - ${t.name}`,
                            group: t.category || 'Diğer'
                        }))}
                        value={selectedTrainingId}
                        onChange={(value) => {
                            const training = trainings.find(t => t.id === value);
                            onTrainingChange(value, training);
                        }}
                        placeholder="Eğitim ara veya seç..."
                    />
                </div>

                {selectedTraining?.has_topics && (
                    <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-100">
                        <label className="block text-sm font-semibold text-yellow-800 mb-2">
                            Alt Başlık <span className="text-red-500">*</span>
                        </label>
                        <SearchableSelect
                            options={selectedTraining.topics.map(topic => ({
                                value: topic.id,
                                label: topic.title
                            }))}
                            value={selectedTopicId}
                            onChange={onTopicChange}
                            placeholder="Alt başlık seçiniz..."
                        />
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <SearchableSelect
                            label="Eğitmen"
                            required
                            options={trainers.map(t => ({
                                value: t.id,
                                label: t.fullName
                            }))}
                            value={selectedTrainerId}
                            onChange={onTrainerChange}
                            placeholder="Eğitmen seçin..."
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Tür</label>
                        <select
                            value={locationType}
                            onChange={(e) => onLocationTypeChange(e.target.value)}
                            className="w-full h-11 border border-gray-300 rounded-lg px-3 text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            title="Eğitim Türü"
                        >
                            <option value="IC">İç Eğitim</option>
                            <option value="DIS">Dış Eğitim</option>
                        </select>
                    </div>
                    <div className="md:col-span-2">
                        <SearchableSelect
                            label="Eğitim Yeri"
                            required
                            options={locations.map(loc => ({
                                value: loc.name,
                                label: loc.name
                            }))}
                            value={trainingLocation}
                            onChange={onLocationChange}
                            placeholder="Eğitim yeri seçin..."
                        />
                    </div>
                    <div className="md:col-span-2">
                        <SearchableSelect
                            label="Sonuç Belgesi"
                            options={documentTypes.map(doc => ({
                                value: doc.name,
                                label: doc.name
                            }))}
                            value={documentType}
                            onChange={onDocumentTypeChange}
                            placeholder="Belge türü seçin..."
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
