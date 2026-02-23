import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Pagination } from '../components/Pagination'

describe('Pagination', () => {
    it('renders page numbers', () => {
        render(<Pagination currentPage={1} totalPages={3} onPageChange={vi.fn()} />)
        expect(screen.getByText('1')).toBeInTheDocument()
        expect(screen.getByText('2')).toBeInTheDocument()
        expect(screen.getByText('3')).toBeInTheDocument()
    })

    it('shows total items info when provided', () => {
        render(
            <Pagination currentPage={1} totalPages={5} onPageChange={vi.fn()} totalItems={50} itemsPerPage={10} />
        )
        expect(screen.getByText('50')).toBeInTheDocument()
        expect(screen.getByText('kayıt', { exact: false })).toBeInTheDocument()
    })

    it('calls onPageChange when clicking page number', () => {
        const onPageChange = vi.fn()
        render(<Pagination currentPage={1} totalPages={5} onPageChange={onPageChange} />)

        fireEvent.click(screen.getByText('3'))
        expect(onPageChange).toHaveBeenCalledWith(3)
    })

    it('calls onPageChange for next button', () => {
        const onPageChange = vi.fn()
        render(<Pagination currentPage={1} totalPages={5} onPageChange={onPageChange} />)

        fireEvent.click(screen.getByLabelText('Sonraki sayfa'))
        expect(onPageChange).toHaveBeenCalledWith(2)
    })

    it('calls onPageChange for previous button', () => {
        const onPageChange = vi.fn()
        render(<Pagination currentPage={3} totalPages={5} onPageChange={onPageChange} />)

        fireEvent.click(screen.getByLabelText('Önceki sayfa'))
        expect(onPageChange).toHaveBeenCalledWith(2)
    })

    it('disables previous button on first page', () => {
        render(<Pagination currentPage={1} totalPages={5} onPageChange={vi.fn()} />)
        expect(screen.getByLabelText('Önceki sayfa')).toBeDisabled()
    })

    it('disables next button on last page', () => {
        render(<Pagination currentPage={5} totalPages={5} onPageChange={vi.fn()} />)
        expect(screen.getByLabelText('Sonraki sayfa')).toBeDisabled()
    })

    it('highlights current page', () => {
        render(<Pagination currentPage={2} totalPages={5} onPageChange={vi.fn()} />)
        const btn2 = screen.getByText('2')
        expect(btn2.className).toContain('bg-blue-600')
    })

    it('shows ellipsis for many pages', () => {
        render(<Pagination currentPage={5} totalPages={20} onPageChange={vi.fn()} />)
        const ellipses = screen.getAllByText('...')
        expect(ellipses.length).toBeGreaterThanOrEqual(1)
    })

    it('shows items per page selector when enabled', () => {
        const onItemsPerPageChange = vi.fn()
        render(
            <Pagination
                currentPage={1}
                totalPages={5}
                onPageChange={vi.fn()}
                onItemsPerPageChange={onItemsPerPageChange}
                showItemsPerPage={true}
            />
        )
        expect(screen.getByText('Sayfa başına:')).toBeInTheDocument()
    })

    it('calls onItemsPerPageChange when selecting', () => {
        const onItemsPerPageChange = vi.fn()
        render(
            <Pagination
                currentPage={1}
                totalPages={5}
                onPageChange={vi.fn()}
                onItemsPerPageChange={onItemsPerPageChange}
                showItemsPerPage={true}
            />
        )

        const select = screen.getByDisplayValue('10')
        fireEvent.change(select, { target: { value: '25' } })
        expect(onItemsPerPageChange).toHaveBeenCalledWith(25)
    })
})
