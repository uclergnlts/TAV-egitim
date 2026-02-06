import { api } from "@/lib/utils";

// ============================================
// Tip Tanımları
// ============================================

/** Katılım kaydı veri yapısı */
interface AttendanceRecord {
    id: string;
    personnelId: string;
    trainingId: string;
    trainingDate: string;
    startTime: string;
    endTime: string;
    locationId: string;
    trainerId: string;
    documentId: string | null;
    sicil: string;
    name?: string;
    personnelName?: string;
    trainingName?: string;
    locationName?: string;
    trainerName?: string;
    documentName?: string;
}

/** Katılım form verisi */
interface AttendanceFormData {
    trainingId: string;
    trainingDate: string;
    startTime: string;
    endTime: string;
    locationId: string;
    trainerId: string;
    documentId: string;
}

/** Yeni katılım kaydı */
interface NewAttendance {
    sicil: string;
    personnelId: string;
}

// ============================================
// Katılım Servisi
// ============================================

class AttendanceService {
    /** Kullanıcının kendi katılım kayıtlarını getirir */
    static async fetchMyAttendances(): Promise<AttendanceRecord[]> {
        const response = await api("/api/attendances/my");

        if (!response.ok) {
            throw new Error("Katılım kayıtları alınamadı");
        }

        return response.json();
    }

    /**
     * Toplu katılım kaydı oluşturur
     * Form verisi ve personel listesi ile birlikte
     */
    static async createBulkAttendances(
        formData: AttendanceFormData,
        newAttendances: NewAttendance[]
    ): Promise<{ inserted: number; updated: number; totalProcessed: number }> {
        // Zorunlu alanları kontrol et
        if (!formData.trainingId || formData.trainingId === "") {
            throw new Error("Eğitim seçilmedi");
        }
        if (!formData.locationId || formData.locationId === "") {
            throw new Error("Lokasyon seçilmedi");
        }
        if (!formData.trainerId || formData.trainerId === "") {
            throw new Error("Eğitmen seçilmedi");
        }
        if (!formData.trainingDate) {
            throw new Error("Eğitim tarihi seçilmedi");
        }
        if (!formData.startTime) {
            throw new Error("Başlangıç saati seçilmedi");
        }
        if (!formData.endTime) {
            throw new Error("Bitiş saati seçilmedi");
        }
        if (newAttendances.length === 0) {
            throw new Error("En az bir personel eklenmelidir");
        }

        const payload = {
            ...formData,
            attendances: newAttendances,
        };

        const response = await api("/api/attendances/bulk", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || "Kayıtlar oluşturulurken hata oluştu");
        }

        return response.json();
    }

    /** Katılım kaydını siler */
    static async deleteAttendance(id: string): Promise<void> {
        const response = await api(`/api/attendances/${id}`, {
            method: "DELETE",
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || "Kayıt silinirken hata oluştu");
        }
    }

    /** Katılım kaydını günceller */
    static async updateAttendance(
        id: string,
        data: Partial<AttendanceRecord>
    ): Promise<AttendanceRecord> {
        const response = await api(`/api/attendances/${id}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || "Kayıt güncellenirken hata oluştu");
        }

        return response.json();
    }

    /** Katılım kaydını PDF olarak indirir */
    static async downloadAttendancePDF(id: string): Promise<Blob> {
        const response = await api(`/api/attendances/${id}/pdf`, {
            method: "GET",
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || "PDF indirilirken hata oluştu");
        }

        return response.blob();
    }

    /**
     * Katılım kayıtlarını Excel'e aktarır
     * Filtre parametreleri opsiyonel
     */
    static async exportToExcel(filters?: {
        startDate?: string;
        endDate?: string;
        trainingId?: string;
        locationId?: string;
    }): Promise<Blob> {
        const queryParams = new URLSearchParams();
        if (filters?.startDate) queryParams.append("startDate", filters.startDate);
        if (filters?.endDate) queryParams.append("endDate", filters.endDate);
        if (filters?.trainingId) queryParams.append("trainingId", filters.trainingId.toString());
        if (filters?.locationId) queryParams.append("locationId", filters.locationId.toString());

        const url = `/api/attendances/export${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;

        const response = await api(url, {
            method: "GET",
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || "Excel export yapılırken hata oluştu");
        }

        return response.blob();
    }

    /** Kullanıcının katılım istatistiklerini getirir */
    static async getStatistics(): Promise<{
        total: number;
        thisMonth: number;
        thisWeek: number;
        byTraining: { trainingId: string; trainingName: string; count: number }[];
        byLocation: { locationId: string; locationName: string; count: number }[];
    }> {
        const response = await api("/api/attendances/statistics");

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || "İstatistikler alınırken hata oluştu");
        }

        return response.json();
    }
}

export { AttendanceService };
export type { AttendanceRecord, AttendanceFormData, NewAttendance };
