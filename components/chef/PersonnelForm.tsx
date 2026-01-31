"use client";

import { PersonnelSearch } from "./PersonnelSearch";
import { SicilValidator } from "./SicilValidator";
import { ExcelImport } from "./ExcelImport";

interface Personnel {
    id: string;
    sicilNo: string;
    fullName: string;
    gorevi?: string;
    grup?: string;
}

interface PersonnelFormProps {
    sicilNos: string;
    onSicilNosChange: (value: string) => void;
    onAddToList: () => void;
    isLoading?: boolean;
}

export function PersonnelForm({
    sicilNos,
    onSicilNosChange,
    onAddToList,
    isLoading = false,
}: PersonnelFormProps) {
    const currentSicils = sicilNos.split(/[\n,]+/).map(s => s.trim()).filter(s => s.length > 0);

    const handlePersonnelSelect = (person: Personnel) => {
        if (!currentSicils.includes(person.sicilNo)) {
            const newSicils = [...currentSicils, person.sicilNo];
            onSicilNosChange(newSicils.join('\n'));
        }
    };

    const handleExcelImport = (importedSicils: string[]) => {
        const newSicils = [...new Set([...currentSicils, ...importedSicils])];
        onSicilNosChange(newSicils.join('\n'));
    };

    const handleClear = () => {
        onSicilNosChange("");
    };

    return (
        <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col h-[360px]">
                <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                    <h2 className="text-lg font-semibold text-gray-800">Katılımcı Sicilleri</h2>
                </div>
                <div className="p-4 flex-1 flex flex-col space-y-3">
                    {/* Personnel Search */}
                    <PersonnelSearch
                        onSelect={handlePersonnelSelect}
                        selectedSicils={currentSicils}
                        placeholder="Ad, soyad veya sicil no ile ara ve ekle..."
                    />
                    
                    {/* Excel Import */}
                    <ExcelImport onImport={handleExcelImport} />
                    
                    <textarea
                        value={sicilNos}
                        onChange={(e) => onSicilNosChange(e.target.value)}
                        placeholder="Her satıra bir sicil no gelecek şekilde yapıştırın..."
                        className="w-full flex-1 border border-gray-300 rounded-lg p-3 resize-none font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                    />
                    
                    {/* Real-time Validation */}
                    <SicilValidator
                        sicilNos={sicilNos}
                        onValidationChange={() => {}}
                    />
                    
                    <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-500">
                            {currentSicils.length} sicil
                        </span>
                        <button 
                            onClick={handleClear}
                            className="text-xs text-red-500 hover:text-red-700 px-2 py-1 rounded hover:bg-red-50 transition-colors"
                        >
                            Temizle
                        </button>
                    </div>
                </div>
            </div>

            <button
                onClick={onAddToList}
                disabled={isLoading || currentSicils.length === 0}
                className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white font-bold text-lg rounded-xl shadow-lg transition-transform active:scale-95"
            >
                {isLoading ? 'İşleniyor...' : 'LİSTEYE EKLE ⬇️'}
            </button>
        </div>
    );
}
