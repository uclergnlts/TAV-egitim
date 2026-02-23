import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { Skeleton, SkeletonText, SkeletonCircle, SkeletonCard, TableSkeleton, SummaryCardsSkeleton } from '../components/Skeleton'

describe('Skeleton', () => {
    it('renders with default props', () => {
        const { container } = render(<Skeleton />)
        const el = container.firstChild as HTMLElement
        expect(el.className).toContain('animate-pulse')
    })

    it('applies custom className', () => {
        const { container } = render(<Skeleton className="custom-class" />)
        const el = container.firstChild as HTMLElement
        expect(el.className).toContain('custom-class')
    })

    it('applies width and height as numbers', () => {
        const { container } = render(<Skeleton width={100} height={50} />)
        const el = container.firstChild as HTMLElement
        expect(el.style.width).toBe('100px')
        expect(el.style.height).toBe('50px')
    })

    it('applies width and height as strings', () => {
        const { container } = render(<Skeleton width="50%" height="2rem" />)
        const el = container.firstChild as HTMLElement
        expect(el.style.width).toBe('50%')
        expect(el.style.height).toBe('2rem')
    })
})

describe('SkeletonText', () => {
    it('renders correct number of lines', () => {
        const { container } = render(<SkeletonText lines={3} />)
        const skeletons = container.querySelectorAll('.animate-pulse')
        expect(skeletons).toHaveLength(3)
    })

    it('renders 1 line by default', () => {
        const { container } = render(<SkeletonText />)
        const skeletons = container.querySelectorAll('.animate-pulse')
        expect(skeletons).toHaveLength(1)
    })
})

describe('SkeletonCircle', () => {
    it('renders with default size', () => {
        const { container } = render(<SkeletonCircle />)
        const el = container.firstChild as HTMLElement
        expect(el.style.width).toBe('40px')
        expect(el.style.height).toBe('40px')
        expect(el.className).toContain('rounded-full')
    })

    it('renders with custom size', () => {
        const { container } = render(<SkeletonCircle size={60} />)
        const el = container.firstChild as HTMLElement
        expect(el.style.width).toBe('60px')
        expect(el.style.height).toBe('60px')
    })
})

describe('SkeletonCard', () => {
    it('renders card structure', () => {
        const { container } = render(<SkeletonCard />)
        expect(container.querySelector('.rounded-full')).toBeTruthy() // circle avatar
        const pulses = container.querySelectorAll('.animate-pulse')
        expect(pulses.length).toBeGreaterThan(0)
    })
})

describe('TableSkeleton', () => {
    it('renders correct number of rows', () => {
        const { container } = render(<TableSkeleton rows={3} columns={4} />)
        const rows = container.querySelectorAll('.divide-y > div')
        expect(rows).toHaveLength(3)
    })

    it('renders header when showHeader is true', () => {
        const { container } = render(<TableSkeleton showHeader={true} />)
        expect(container.querySelector('.bg-gray-50')).toBeTruthy()
    })

    it('hides header when showHeader is false', () => {
        const { container } = render(<TableSkeleton showHeader={false} />)
        expect(container.querySelector('.bg-gray-50')).toBeNull()
    })
})

describe('SummaryCardsSkeleton', () => {
    it('renders correct number of cards', () => {
        const { container } = render(<SummaryCardsSkeleton count={3} />)
        const cards = container.querySelectorAll('.bg-white')
        expect(cards).toHaveLength(3)
    })

    it('renders 4 cards by default', () => {
        const { container } = render(<SummaryCardsSkeleton />)
        const cards = container.querySelectorAll('.bg-white')
        expect(cards).toHaveLength(4)
    })
})
