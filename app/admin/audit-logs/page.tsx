"use client";

import { useState, useEffect } from "react";

interface AuditLog {
    id: string;
    actionType: string;
    entityType: string;
    entityId: string;
    actionTime: string;
    ipAddress: string;
    userFullName: string;
    userSicil: string;
    details: string;
}

export default function AuditLogsPage() {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    useEffect(() => {
        loadLogs(page);
    }, [page]);

    const loadLogs = async (p: number) => {
        setLoading(true);
        try {
            const res = await fetch(`/api/audit-logs?page=${p}&limit=50`);
            const data = await res.json();
            if (data.success) {
                setLogs(data.data);
                setTotalPages(data.pagination.totalPages);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleString("tr-TR");
    };

    const getActionColor = (action: string) => {
        switch (action) {
            case "CREATE": return "bg-green-100 text-green-800";
            case "UPDATE": return "bg-blue-100 text-blue-800";
            case "DELETE": return "bg-red-100 text-red-800";
            case "LOGIN": return "bg-gray-100 text-gray-800";
            default: return "bg-gray-100 text-gray-800";
        }
    };

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-gray-800">Denetim Kayıtları (Audit Log)</h1>

            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Zaman</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kullanıcı</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">İşlem</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hedef</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">IP</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {logs.map((log) => (
                            <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                                    {formatDate(log.actionTime)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                    <div>{log.userFullName}</div>
                                    <div className="text-xs text-gray-400">{log.userSicil}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getActionColor(log.actionType)}`}>
                                        {log.actionType}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                    <div className="font-semibold">{log.entityType}</div>
                                    <div className="text-xs text-gray-400 font-mono">{log.entityId}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                                    {log.ipAddress}
                                </td>
                            </tr>
                        ))}
                        {logs.length === 0 && !loading && (
                            <tr>
                                <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                                    Kayıt bulunamadı.
                                </td>
                            </tr>
                        )}
                        {loading && (
                            <tr>
                                <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                                    Yükleniyor...
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>

                {/* Pagination */}
                <div className="bg-gray-50 px-6 py-3 border-t border-gray-200 flex items-center justify-between">
                    <button
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                    >
                        Önceki
                    </button>
                    <span className="text-sm text-gray-700">
                        Sayfa {page} / {totalPages}
                    </span>
                    <button
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                        className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                    >
                        Sonraki
                    </button>
                </div>
            </div>
        </div>
    );
}
