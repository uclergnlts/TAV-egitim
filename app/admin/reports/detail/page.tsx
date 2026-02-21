"use client";

import { useEffect, useMemo, useState } from "react";
import * as XLSX from "xlsx";

type AttendanceRecord = {
  id: string;
  sicilNo: string;
  adSoyad: string;
  tcKimlikNo: string;
  yerlesim: string | null;
  organizasyon: string | null;
  sirketAdi: string | null;
  gorevi: string;
  vardiyaTipi: string | null;
  projeAdi: string;
  grup: string;
  terminal: string | null;
  bolgeKodu: string | null;
  egitimKodu: string;
  egitimKoduYeni: string | null;
  baslamaTarihi: string;
  bitisTarihi: string;
  egitimSuresiDk: number;
  baslamaSaati: string;
  bitisSaati: string;
  egitimYeri: string;
  egitmenAdi: string | null;
  sonucBelgesiTuru: string;
  icDisEgitim: string;
  egitimDetayliAciklama: string | null;
  egitimTestSonucu: string | null;
  tazelemePlanlamaTarihi: string | null;
  veriGirenSicil: string;
  veriGirisTarihi: string;
  personelDurumu: string;
};

type EditingState = { rowId: string; key: keyof AttendanceRecord | "sNo" } | null;

type Column = {
  key: keyof AttendanceRecord | "sNo";
  label: string;
  apiField?: string;
  editable?: boolean;
  width?: string;
};

const columns: Column[] = [
  { key: "sNo", label: "S. No", editable: false },
  { key: "sicilNo", label: "Sicil No", apiField: "sicil_no", editable: true },
  { key: "adSoyad", label: "Adı Soyadı ", apiField: "ad_soyad", editable: true },
  { key: "tcKimlikNo", label: "Tc Kimlik No", apiField: "tc_kimlik_no", editable: true },
  { key: "yerlesim", label: "Yerlesim", apiField: "yerlesim", editable: true },
  { key: "organizasyon", label: "Organizasyon", apiField: "organizasyon", editable: true },
  { key: "sirketAdi", label: "Şirket Adı", apiField: "sirket_adi", editable: true },
  { key: "gorevi", label: "Görevi", apiField: "gorevi", editable: true },
  { key: "vardiyaTipi", label: "Vardiya Tipi", apiField: "vardiya_tipi", editable: true },
  { key: "projeAdi", label: "Proje Adi", apiField: "proje_adi", editable: true },
  { key: "grup", label: "Calisma Grubu", apiField: "grup", editable: true },
  { key: "terminal", label: "Terminal", apiField: "terminal", editable: true },
  { key: "bolgeKodu", label: "Bolge Kodu", apiField: "bolge_kodu", editable: true },
  { key: "egitimKodu", label: "Egitim Kodu", apiField: "egitim_kodu", editable: true },
  { key: "egitimKoduYeni", label: "Egitim Kodu (Yeni)", apiField: "egitim_kodu_yeni", editable: true },
  { key: "baslamaTarihi", label: "Egt Bas Trh", apiField: "baslama_tarihi", editable: true },
  { key: "bitisTarihi", label: "Egt Bit Trh", apiField: "bitis_tarihi", editable: true },
  { key: "egitimSuresiDk", label: "Egitim Suresi", apiField: "egitim_suresi_dk", editable: true },
  { key: "baslamaSaati", label: "Egitim Baslama Saati", apiField: "baslama_saati", editable: true },
  { key: "bitisSaati", label: "Egitim Bitis Saati", apiField: "bitis_saati", editable: true },
  { key: "egitimYeri", label: "Egitimin Yeri", apiField: "egitim_yeri", editable: true },
  { key: "egitmenAdi", label: "Eğitmen Adı", apiField: "egitmen_adi", editable: true },
  { key: "sonucBelgesiTuru", label: "Sonuc Belgesi", apiField: "sonuc_belgesi_turu", editable: true },
  { key: "icDisEgitim", label: "Ic Dis Egitim", apiField: "ic_dis_egitim", editable: true },
  { key: "egitimDetayliAciklama", label: "Egitim Detay Aciklama", apiField: "egitim_detayli_aciklama", editable: true },
  { key: "egitimDetayliAciklama", label: "Egitim Detay Açıklama (Yeni)", apiField: "egitim_detayli_aciklama", editable: true },
  { key: "egitimTestSonucu", label: "Egitim Test Sonucu", apiField: "egitim_test_sonucu", editable: true },
  { key: "tazelemePlanlamaTarihi", label: "Tazeleme Planlama Tarihi", apiField: "tazeleme_planlama_tarihi", editable: true },
  { key: "veriGirenSicil", label: "Veriyi Giren Sicil", apiField: "veri_giren_sicil", editable: true },
  { key: "veriGirisTarihi", label: "Veri Giris Tarihi", apiField: "veri_giris_tarihi", editable: true },
  { key: "personelDurumu", label: "Personel Durumu", apiField: "personel_durumu", editable: true },
];

export default function DetailedReportPage() {
  const [data, setData] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<EditingState>(null);
  const [editValue, setEditValue] = useState("");
  const [filters, setFilters] = useState({
    search: "",
    startDate: "",
    endDate: "",
    trainingCode: "",
    grup: "",
    personelDurumu: "",
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.search) params.append("search", filters.search);
      if (filters.startDate) params.append("startDate", filters.startDate);
      if (filters.endDate) params.append("endDate", filters.endDate);
      if (filters.trainingCode) params.append("trainingCode", filters.trainingCode);
      if (filters.grup) params.append("grup", filters.grup);
      if (filters.personelDurumu) params.append("personelDurumu", filters.personelDurumu);

      const res = await fetch(`/api/reports/detail?${params.toString()}`);
      const json = await res.json();
      if (json.success) setData(json.data);
    } catch (error) {
      console.error("Error loading report:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const totalRecords = data.length;
  const totalMinutes = useMemo(() => data.reduce((sum, r) => sum + (r.egitimSuresiDk || 0), 0), [data]);

  const startEdit = (rowId: string, key: keyof AttendanceRecord | "sNo", value: unknown) => {
    if (key === "sNo") return;
    const col = columns.find((c) => c.key === key);
    if (!col?.editable) return;
    setEditing({ rowId, key });
    setEditValue(String(value ?? ""));
  };

  const saveEdit = async () => {
    if (!editing) return;
    const col = columns.find((c) => c.key === editing.key);
    if (!col?.apiField) {
      setEditing(null);
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/attendances", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editing.rowId,
          field: col.apiField,
          value: editValue,
        }),
      });

      const json = await res.json();
      if (!json.success) throw new Error(json.message || "Guncellenemedi");

      setData((prev) =>
        prev.map((row) =>
          row.id === editing.rowId
            ? ({ ...row, [editing.key]: editing.key === "egitimSuresiDk" ? Number(editValue || 0) : editValue } as AttendanceRecord)
            : row
        )
      );
    } catch (error) {
      console.error("Save error:", error);
    } finally {
      setSaving(false);
      setEditing(null);
      setEditValue("");
    }
  };

  const exportToExcel = () => {
    const exportData = data.map((row, index) => {
      const out: Record<string, string | number> = {};
      columns.forEach((col) => {
        if (col.key === "sNo") {
          out[col.label] = index + 1;
        } else {
          out[col.label] = (row[col.key] as string | number | null) ?? "";
        }
      });
      return out;
    });

    const ws = XLSX.utils.json_to_sheet(exportData);
    ws["!cols"] = columns.map(() => ({ wch: 18 }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Detaylı Liste");
    XLSX.writeFile(wb, `Detayli_Liste_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Detaylı Eğitim Katılım Raporu</h1>
          <p className="text-sm text-gray-500">Detaylı Liste.xlsx ile birebir sütun sırası (31 sütun)</p>
        </div>
        <button onClick={exportToExcel} disabled={data.length === 0} className="bg-green-600 text-white px-5 py-2.5 rounded-lg hover:bg-green-700 font-medium disabled:opacity-50">
          Excel İndir (31 Sütun)
        </button>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border">
        <div className="grid grid-cols-2 md:grid-cols-7 gap-3">
          <input type="text" placeholder="Ara (İsim, Sicil)" className="border rounded-lg p-2.5 text-sm" value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })} />
          <input type="text" placeholder="Eğitim Kodu" className="border rounded-lg p-2.5 text-sm" value={filters.trainingCode} onChange={(e) => setFilters({ ...filters, trainingCode: e.target.value })} />
          <input type="text" placeholder="Grup" className="border rounded-lg p-2.5 text-sm" value={filters.grup} onChange={(e) => setFilters({ ...filters, grup: e.target.value })} />
          <input type="date" className="border rounded-lg p-2 text-sm" value={filters.startDate} onChange={(e) => setFilters({ ...filters, startDate: e.target.value })} />
          <input type="date" className="border rounded-lg p-2 text-sm" value={filters.endDate} onChange={(e) => setFilters({ ...filters, endDate: e.target.value })} />
          <button onClick={loadData} className="bg-blue-600 text-white px-4 py-2.5 rounded-lg text-sm">Filtrele</button>
          <button
            onClick={() => {
              setFilters({ search: "", startDate: "", endDate: "", trainingCode: "", grup: "", personelDurumu: "" });
              setTimeout(() => loadData(), 0);
            }}
            className="px-4 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-600"
          >
            Temizle
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border"><div className="text-sm text-gray-500">Toplam Kayıt</div><div className="text-2xl font-bold text-gray-800">{totalRecords.toLocaleString("tr-TR")}</div></div>
        <div className="bg-white p-4 rounded-xl shadow-sm border"><div className="text-sm text-gray-500">Toplam Dakika</div><div className="text-2xl font-bold text-blue-600">{totalMinutes.toLocaleString("tr-TR")}</div></div>
        <div className="bg-white p-4 rounded-xl shadow-sm border"><div className="text-sm text-gray-500">Toplam Saat</div><div className="text-2xl font-bold text-green-600">{(totalMinutes / 60).toFixed(1)}</div></div>
        <div className="bg-white p-4 rounded-xl shadow-sm border"><div className="text-sm text-gray-500">Benzersiz Eğitim</div><div className="text-2xl font-bold text-purple-600">{new Set(data.map((d) => d.egitimKodu)).size}</div></div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="p-3 bg-gray-50 border-b flex justify-between items-center">
          <span className="text-sm font-medium text-gray-600">31 Sütunlu Tam Detay Tablosu</span>
          <span className="text-xs text-gray-500">Hücreye çift tıklayıp düzenleyin</span>
        </div>
        <div className="overflow-x-auto" style={{ maxHeight: "60vh" }}>
          <table className="min-w-max w-full divide-y divide-gray-200 text-xs">
            <thead className="bg-gray-100 sticky top-0 z-10">
              <tr>
                {columns.map((c) => (
                  <th key={c.label} className="px-3 py-3 text-left font-semibold text-gray-700 whitespace-nowrap">{c.label}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {loading ? (
                <tr><td colSpan={31} className="p-8 text-center text-gray-500">Yükleniyor...</td></tr>
              ) : data.length === 0 ? (
                <tr><td colSpan={31} className="p-8 text-center text-gray-500">Kayıt bulunamadı.</td></tr>
              ) : (
                data.map((row, rowIndex) => (
                  <tr key={row.id} className="hover:bg-gray-50 transition-colors">
                    {columns.map((col) => {
                      const value = col.key === "sNo" ? rowIndex + 1 : row[col.key];
                      const isEditing = editing?.rowId === row.id && editing?.key === col.key;
                      return (
                        <td key={`${row.id}-${col.label}`} className="px-3 py-2 whitespace-nowrap" onDoubleClick={() => startEdit(row.id, col.key, value)}>
                          {isEditing ? (
                            <input
                              autoFocus
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              onBlur={saveEdit}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") saveEdit();
                                if (e.key === "Escape") setEditing(null);
                              }}
                              disabled={saving}
                              className="border rounded px-2 py-1 text-xs w-full"
                            />
                          ) : (
                            <span className={col.editable ? "cursor-text" : "text-gray-500"}>{String(value ?? "") || "-"}</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

