import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock lib/utils api function
vi.mock('@/lib/utils', () => ({
    api: vi.fn(),
}))

import { AttendanceService } from '../lib/attendanceService'
import { api } from '@/lib/utils'

const mockApi = api as unknown as ReturnType<typeof vi.fn>

describe('AttendanceService', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    describe('fetchMyAttendances', () => {
        it('returns attendance records on success', async () => {
            const mockData = [{ id: '1', sicil: '12345' }]
            mockApi.mockResolvedValue({ ok: true, json: async () => mockData })

            const result = await AttendanceService.fetchMyAttendances()
            expect(result).toEqual(mockData)
            expect(mockApi).toHaveBeenCalledWith('/api/attendances/my')
        })

        it('throws on failure', async () => {
            mockApi.mockResolvedValue({ ok: false })

            await expect(AttendanceService.fetchMyAttendances()).rejects.toThrow('Katılım kayıtları alınamadı')
        })
    })

    describe('createBulkAttendances', () => {
        const validForm = {
            trainingId: 't1',
            trainingDate: '2025-01-01',
            startTime: '09:00',
            endTime: '17:00',
            locationId: 'l1',
            trainerId: 'tr1',
            documentId: 'd1',
        }
        const validAttendances = [{ sicil: '12345', personnelId: 'p1' }]

        it('creates bulk attendances on success', async () => {
            const mockResult = { inserted: 1, updated: 0, totalProcessed: 1 }
            mockApi.mockResolvedValue({ ok: true, json: async () => mockResult })

            const result = await AttendanceService.createBulkAttendances(validForm, validAttendances)
            expect(result).toEqual(mockResult)
            expect(mockApi).toHaveBeenCalledWith('/api/attendances/bulk', expect.objectContaining({ method: 'POST' }))
        })

        it('throws when trainingId is empty', async () => {
            await expect(
                AttendanceService.createBulkAttendances({ ...validForm, trainingId: '' }, validAttendances)
            ).rejects.toThrow('Eğitim seçilmedi')
        })

        it('throws when locationId is empty', async () => {
            await expect(
                AttendanceService.createBulkAttendances({ ...validForm, locationId: '' }, validAttendances)
            ).rejects.toThrow('Lokasyon seçilmedi')
        })

        it('throws when trainerId is empty', async () => {
            await expect(
                AttendanceService.createBulkAttendances({ ...validForm, trainerId: '' }, validAttendances)
            ).rejects.toThrow('Eğitmen seçilmedi')
        })

        it('throws when trainingDate is empty', async () => {
            await expect(
                AttendanceService.createBulkAttendances({ ...validForm, trainingDate: '' }, validAttendances)
            ).rejects.toThrow('Eğitim tarihi seçilmedi')
        })

        it('throws when startTime is empty', async () => {
            await expect(
                AttendanceService.createBulkAttendances({ ...validForm, startTime: '' }, validAttendances)
            ).rejects.toThrow('Başlangıç saati seçilmedi')
        })

        it('throws when endTime is empty', async () => {
            await expect(
                AttendanceService.createBulkAttendances({ ...validForm, endTime: '' }, validAttendances)
            ).rejects.toThrow('Bitiş saati seçilmedi')
        })

        it('throws when attendances array is empty', async () => {
            await expect(
                AttendanceService.createBulkAttendances(validForm, [])
            ).rejects.toThrow('En az bir personel eklenmelidir')
        })

        it('throws with server error message on failure', async () => {
            mockApi.mockResolvedValue({
                ok: false,
                json: async () => ({ error: 'Sunucu hatası' }),
            })

            await expect(
                AttendanceService.createBulkAttendances(validForm, validAttendances)
            ).rejects.toThrow('Sunucu hatası')
        })

        it('throws default message when no error message from server', async () => {
            mockApi.mockResolvedValue({
                ok: false,
                json: async () => ({}),
            })

            await expect(
                AttendanceService.createBulkAttendances(validForm, validAttendances)
            ).rejects.toThrow('Kayıtlar oluşturulurken hata oluştu')
        })
    })

    describe('deleteAttendance', () => {
        it('deletes successfully', async () => {
            mockApi.mockResolvedValue({ ok: true })
            await expect(AttendanceService.deleteAttendance('123')).resolves.toBeUndefined()
            expect(mockApi).toHaveBeenCalledWith('/api/attendances/123', { method: 'DELETE' })
        })

        it('throws on failure', async () => {
            mockApi.mockResolvedValue({ ok: false, json: async () => ({ error: 'Bulunamadı' }) })
            await expect(AttendanceService.deleteAttendance('123')).rejects.toThrow('Bulunamadı')
        })

        it('throws default error on failure without message', async () => {
            mockApi.mockResolvedValue({ ok: false, json: async () => ({}) })
            await expect(AttendanceService.deleteAttendance('123')).rejects.toThrow('Kayıt silinirken hata oluştu')
        })
    })

    describe('updateAttendance', () => {
        it('updates and returns record', async () => {
            const updated = { id: '1', sicil: '12345' }
            mockApi.mockResolvedValue({ ok: true, json: async () => updated })

            const result = await AttendanceService.updateAttendance('1', { sicil: '12345' } as any)
            expect(result).toEqual(updated)
            expect(mockApi).toHaveBeenCalledWith('/api/attendances/1', expect.objectContaining({ method: 'PUT' }))
        })

        it('throws on failure', async () => {
            mockApi.mockResolvedValue({ ok: false, json: async () => ({ error: 'Hata' }) })
            await expect(AttendanceService.updateAttendance('1', {})).rejects.toThrow('Hata')
        })

        it('throws default error on failure without message', async () => {
            mockApi.mockResolvedValue({ ok: false, json: async () => ({}) })
            await expect(AttendanceService.updateAttendance('1', {})).rejects.toThrow('Kayıt güncellenirken hata oluştu')
        })
    })

    describe('downloadAttendancePDF', () => {
        it('returns blob on success', async () => {
            const mockBlob = new Blob(['pdf'])
            mockApi.mockResolvedValue({ ok: true, blob: async () => mockBlob })

            const result = await AttendanceService.downloadAttendancePDF('1')
            expect(result).toBe(mockBlob)
        })

        it('throws on failure', async () => {
            mockApi.mockResolvedValue({ ok: false, json: async () => ({ error: 'PDF hatası' }) })
            await expect(AttendanceService.downloadAttendancePDF('1')).rejects.toThrow('PDF hatası')
        })
    })

    describe('exportToExcel', () => {
        it('returns blob without filters', async () => {
            const mockBlob = new Blob(['excel'])
            mockApi.mockResolvedValue({ ok: true, blob: async () => mockBlob })

            const result = await AttendanceService.exportToExcel()
            expect(result).toBe(mockBlob)
            expect(mockApi).toHaveBeenCalledWith('/api/attendances/export', { method: 'GET' })
        })

        it('appends query params with filters', async () => {
            const mockBlob = new Blob(['excel'])
            mockApi.mockResolvedValue({ ok: true, blob: async () => mockBlob })

            await AttendanceService.exportToExcel({
                startDate: '2025-01-01',
                endDate: '2025-12-31',
                trainingId: 't1',
                locationId: 'l1',
            })

            const callUrl = mockApi.mock.calls[0][0]
            expect(callUrl).toContain('startDate=2025-01-01')
            expect(callUrl).toContain('endDate=2025-12-31')
            expect(callUrl).toContain('trainingId=t1')
            expect(callUrl).toContain('locationId=l1')
        })

        it('throws on failure', async () => {
            mockApi.mockResolvedValue({ ok: false, json: async () => ({}) })
            await expect(AttendanceService.exportToExcel()).rejects.toThrow('Excel export yapılırken hata oluştu')
        })
    })

    describe('getStatistics', () => {
        it('returns statistics on success', async () => {
            const stats = { total: 100, thisMonth: 10, thisWeek: 3, byTraining: [], byLocation: [] }
            mockApi.mockResolvedValue({ ok: true, json: async () => stats })

            const result = await AttendanceService.getStatistics()
            expect(result).toEqual(stats)
        })

        it('throws on failure', async () => {
            mockApi.mockResolvedValue({ ok: false, json: async () => ({}) })
            await expect(AttendanceService.getStatistics()).rejects.toThrow('İstatistikler alınırken hata oluştu')
        })
    })
})
