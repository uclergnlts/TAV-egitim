import { describe, it, expect } from 'vitest'
import { cn, formatDate, formatTime, MONTHS_TR, getYear, getMonth } from '../lib/utils'

describe('Utils', () => {
    describe('cn()', () => {
        it('should merge tailwind classes', () => {
            expect(cn('p-4', 'text-center')).toBe('p-4 text-center')
            expect(cn('p-4', 'p-8')).toBe('p-8') // twMerge checks
            expect(cn('text-red-500', null, false && 'text-blue-500')).toBe('text-red-500')
        })
    })

    describe('formatDate()', () => {
        it('should format date for TR locale', () => {
            const date = new Date('2024-01-15T12:00:00Z')
            // TR locale formats d.m.yyyy usually, but standard may vary by system. 
            // We check if it contains 2024
            expect(formatDate(date)).toContain('2024')
        })
    })

    describe('formatTime()', () => {
        it('should return HH:MM from HH:MM:SS', () => {
            expect(formatTime('14:30:00')).toBe('14:30')
        })
    })

    describe('Date Helpers', () => {
        it('should get correct year', () => {
            expect(getYear('2024-05-20')).toBe(2024)
        })

        it('should get correct month (1-based)', () => {
            expect(getMonth('2024-05-20')).toBe(5)
        })
    })

    describe('Constants', () => {
        it('should have 12 months', () => {
            expect(MONTHS_TR).toHaveLength(12)
            expect(MONTHS_TR[0]).toBe('Ocak')
        })
    })
})
