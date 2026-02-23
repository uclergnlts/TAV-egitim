import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockSave = vi.fn()
const mockText = vi.fn()
const mockSetFont = vi.fn()
const mockSetFontSize = vi.fn()
const mockSetTextColor = vi.fn()
const mockSetDrawColor = vi.fn()
const mockSetFillColor = vi.fn()
const mockSetLineWidth = vi.fn()
const mockLine = vi.fn()
const mockRect = vi.fn()
const mockAddPage = vi.fn()

vi.mock('jspdf', () => {
    const MockJsPDF = vi.fn().mockImplementation(function (this: any) {
        this.internal = { pageSize: { getWidth: () => 297, getHeight: () => 210 } }
        this.save = mockSave
        this.text = mockText
        this.setFont = mockSetFont
        this.setFontSize = mockSetFontSize
        this.setTextColor = mockSetTextColor
        this.setDrawColor = mockSetDrawColor
        this.setFillColor = mockSetFillColor
        this.setLineWidth = mockSetLineWidth
        this.line = mockLine
        this.rect = mockRect
        this.addPage = mockAddPage
    })
    return { default: MockJsPDF }
})

vi.mock('jspdf-autotable', () => ({
    default: vi.fn(),
}))

import { exportToPDF, exportListToPDF } from '../lib/pdfExport'

describe('pdfExport', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    describe('exportToPDF', () => {
        it('creates PDF with correct filename', () => {
            exportToPDF({
                title: 'Test Raporu',
                headers: ['Sütun 1', 'Sütun 2'],
                rows: [['Veri 1', 'Veri 2']],
                filename: 'test-rapor',
            })

            expect(mockSave).toHaveBeenCalledWith('test-rapor.pdf')
        })

        it('sets title text', () => {
            exportToPDF({
                title: 'Eğitim Raporu',
                headers: ['Ad'],
                rows: [['Test']],
                filename: 'egitim',
            })

            expect(mockText).toHaveBeenCalledWith('Eğitim Raporu', expect.any(Number), expect.any(Number), expect.any(Object))
        })

        it('renders subtitle when provided', () => {
            exportToPDF({
                title: 'Test',
                subtitle: 'Alt Başlık',
                headers: ['A'],
                rows: [['1']],
                filename: 'test',
            })

            expect(mockText).toHaveBeenCalledWith('Alt Başlık', expect.any(Number), expect.any(Number), expect.any(Object))
        })

        it('renders company header', () => {
            exportToPDF({
                title: 'Test',
                headers: ['A'],
                rows: [['1']],
                filename: 'test',
            })

            expect(mockText).toHaveBeenCalledWith('TAV TEKNOLOJİLER', expect.any(Number), expect.any(Number))
        })
    })

    describe('exportListToPDF', () => {
        it('creates PDF with items', () => {
            exportListToPDF(
                'Test Liste',
                [
                    { label: 'Toplam', value: 100 },
                    { label: 'Aktif', value: 80 },
                ],
                'test-liste'
            )

            expect(mockSave).toHaveBeenCalledWith('test-liste.pdf')
            expect(mockText).toHaveBeenCalledWith('Test Liste', expect.any(Number), expect.any(Number))
        })

        it('renders item labels and values', () => {
            exportListToPDF(
                'Özet',
                [{ label: 'Personel', value: 50 }],
                'ozet'
            )

            expect(mockText).toHaveBeenCalledWith('Personel:', expect.any(Number), expect.any(Number))
            expect(mockText).toHaveBeenCalledWith('50', expect.any(Number), expect.any(Number))
        })
    })
})
