import { api } from '@/lib/utils';

// Types for attendance data
interface AttendanceRecord {
  id: number;
  personnelId: number;
  trainingId: number;
  trainingDate: string;
  startTime: string;
  endTime: string;
  locationId: number;
  trainerId: number;
  documentId: number | null;
  sicil: string;
  name?: string;
  personnelName?: string;
  trainingName?: string;
  locationName?: string;
  trainerName?: string;
  documentName?: string;
}

interface AttendanceFormData {
  trainingId: string;
  trainingDate: string;
  startTime: string;
  endTime: string;
  locationId: string;
  trainerId: string;
  documentId: string;
}

interface NewAttendance {
  sicil: string;
  personnelId: number;
}

// Attendance service
class AttendanceService {
  /**
   * Fetch user's attendance records
   */
  static async fetchMyAttendances(): Promise<AttendanceRecord[]> {
    const response = await api('/api/attendances/my');
    
    if (!response.ok) {
      throw new Error('Katılım kayıtları alınamadı');
    }
    
    return response.json();
  }

  /**
   * Create new attendance records
   */
  static async createBulkAttendances(
    formData: AttendanceFormData,
    newAttendances: NewAttendance[]
  ): Promise<{ inserted: number; updated: number; totalProcessed: number }> {
    // Validate required fields
    if (!formData.trainingId || formData.trainingId === '') {
      throw new Error('Eğitim seçilmedi');
    }
    if (!formData.locationId || formData.locationId === '') {
      throw new Error('Lokasyon seçilmedi');
    }
    if (!formData.trainerId || formData.trainerId === '') {
      throw new Error('Eğitmen seçilmedi');
    }
    if (!formData.trainingDate) {
      throw new Error('Eğitim tarihi seçilmedi');
    }
    if (!formData.startTime) {
      throw new Error('Başlangıç saati seçilmedi');
    }
    if (!formData.endTime) {
      throw new Error('Bitiş saati seçilmedi');
    }
    if (newAttendances.length === 0) {
      throw new Error('En az bir personel eklenmelidir');
    }

    const payload = {
      ...formData,
      attendances: newAttendances,
    };

    const response = await api('/api/attendances/bulk', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Kayıtlar oluşturulurken hata oluştu');
    }

    return response.json();
  }

  /**
   * Delete attendance record
   */
  static async deleteAttendance(id: number): Promise<void> {
    const response = await api(`/api/attendances/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Kayıt silinirken hata oluştu');
    }
  }

  /**
   * Update attendance record
   */
  static async updateAttendance(
    id: number,
    data: Partial<AttendanceRecord>
  ): Promise<AttendanceRecord> {
    const response = await api(`/api/attendances/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Kayıt güncellenirken hata oluştu');
    }

    return response.json();
  }

  /**
   * Download attendance record as PDF
   */
  static async downloadAttendancePDF(id: number): Promise<Blob> {
    const response = await api(`/api/attendances/${id}/pdf`, {
      method: 'GET',
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'PDF indirilirken hata oluştu');
    }

    return response.blob();
  }

  /**
   * Export attendances to Excel
   */
  static async exportToExcel(filters?: {
    startDate?: string;
    endDate?: string;
    trainingId?: number;
    locationId?: number;
  }): Promise<Blob> {
    const queryParams = new URLSearchParams();
    if (filters?.startDate) queryParams.append('startDate', filters.startDate);
    if (filters?.endDate) queryParams.append('endDate', filters.endDate);
    if (filters?.trainingId) queryParams.append('trainingId', filters.trainingId.toString());
    if (filters?.locationId) queryParams.append('locationId', filters.locationId.toString());

    const url = `/api/attendances/export${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    
    const response = await api(url, {
      method: 'GET',
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Excel export yapılırken hata oluştu');
    }

    return response.blob();
  }

  /**
   * Get attendance statistics for current user
   */
  static async getStatistics(): Promise<{
    total: number;
    thisMonth: number;
    thisWeek: number;
    byTraining: { trainingId: number; trainingName: string; count: number }[];
    byLocation: { locationId: number; locationName: string; count: number }[];
  }> {
    const response = await api('/api/attendances/statistics');
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'İstatistikler alınırken hata oluştu');
    }
    
    return response.json();
  }
}

export { AttendanceService };
export type { AttendanceRecord, AttendanceFormData, NewAttendance };
