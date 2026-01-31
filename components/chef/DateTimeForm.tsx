"use client";

interface DateTimeFormProps {
    startDate: string;
    endDate: string;
    startTime: string;
    endTime: string;
    onStartDateChange: (date: string) => void;
    onEndDateChange: (date: string) => void;
    onStartTimeChange: (time: string) => void;
    onEndTimeChange: (time: string) => void;
    onReset: () => void;
    onDurationAdd: (minutes: number) => void;
}

const DURATION_PRESETS = [30, 45, 60, 90, 120, 480];

export function DateTimeForm({
    startDate,
    endDate,
    startTime,
    endTime,
    onStartDateChange,
    onEndDateChange,
    onStartTimeChange,
    onEndTimeChange,
    onReset,
    onDurationAdd,
}: DateTimeFormProps) {
    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex justify-between">
                <h2 className="text-lg font-semibold text-gray-800">Tarih ve Saat</h2>
                <button 
                    onClick={onReset} 
                    className="text-xs text-blue-600 font-bold hover:underline"
                >
                    Sıfırla
                </button>
            </div>
            <div className="p-6">
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-3">
                        <label className="block text-xs font-bold text-gray-500 uppercase">Başlangıç</label>
                        <input 
                            type="date" 
                            title="Başlangıç Tarihi"
                            value={startDate} 
                            onChange={(e) => onStartDateChange(e.target.value)} 
                            className="w-full h-11 border border-gray-300 rounded-lg text-sm px-3 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                        />
                        <input 
                            type="time" 
                            title="Başlangıç Saati"
                            value={startTime} 
                            onChange={(e) => onStartTimeChange(e.target.value)} 
                            className="w-full h-11 border border-gray-300 rounded-lg text-base font-semibold px-3 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                        />
                    </div>
                    <div className="space-y-3">
                        <label className="block text-xs font-bold text-gray-500 uppercase">Bitiş</label>
                        <input 
                            type="date" 
                            title="Bitiş Tarihi"
                            value={endDate} 
                            onChange={(e) => onEndDateChange(e.target.value)} 
                            className="w-full h-11 border border-gray-300 rounded-lg text-sm px-3 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                        />
                        <input 
                            type="time" 
                            title="Bitiş Saati"
                            value={endTime} 
                            onChange={(e) => onEndTimeChange(e.target.value)} 
                            className="w-full h-11 border border-gray-300 rounded-lg text-base font-semibold px-3 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                        />
                    </div>
                </div>
                <div className="mt-4 flex gap-2 overflow-x-auto py-2">
                    {DURATION_PRESETS.map(m => (
                        <button 
                            key={m} 
                            onClick={() => onDurationAdd(m)} 
                            className="px-3 py-1 bg-gray-100 hover:bg-blue-100 text-xs rounded-full border border-gray-200 transition-colors"
                        >
                            +{m}dk
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
