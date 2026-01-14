import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import LoginPage from '../app/login/page'

// Mock useRouter
const pushMock = vi.fn()
vi.mock('next/navigation', () => ({
    useRouter: () => ({
        push: pushMock,
    }),
}))

// Mock fetch
global.fetch = vi.fn()

describe('LoginPage', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('renders login form correctly', () => {
        render(<LoginPage />)

        expect(screen.getByText('TAV Eğitim Paneli')).toBeInTheDocument()
        expect(screen.getByLabelText('Sicil Numarası')).toBeInTheDocument()
        expect(screen.getByLabelText('Şifre')).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /Giriş Yap/i })).toBeInTheDocument()
    })

    it('handles input changes', () => {
        render(<LoginPage />)

        const sicilInput = screen.getByLabelText('Sicil Numarası') as HTMLInputElement
        const passInput = screen.getByLabelText('Şifre') as HTMLInputElement

        fireEvent.change(sicilInput, { target: { value: 'ADMIN001' } })
        fireEvent.change(passInput, { target: { value: '123456' } })

        expect(sicilInput.value).toBe('ADMIN001')
        expect(passInput.value).toBe('123456')
    })

    it('submits form and redirects on success (ADMIN)', async () => {
        // Mock successful response
        (global.fetch as any).mockResolvedValueOnce({
            json: async () => ({ success: true, role: 'ADMIN' }),
        })

        render(<LoginPage />)

        fireEvent.change(screen.getByLabelText('Sicil Numarası'), { target: { value: 'ADMIN001' } })
        fireEvent.change(screen.getByLabelText('Şifre'), { target: { value: 'admin123' } })

        fireEvent.click(screen.getByRole('button', { name: /Giriş Yap/i }))

        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledWith('/api/auth/login', expect.objectContaining({
                method: 'POST',
                body: JSON.stringify({ sicil_no: 'ADMIN001', password: 'admin123' })
            }))
            expect(pushMock).toHaveBeenCalledWith('/admin')
        })
    })

    it('displays error message on failure', async () => {
        // Mock failure response
        (global.fetch as any).mockResolvedValueOnce({
            json: async () => ({ success: false, message: 'Hatalı giriş' }),
        })

        render(<LoginPage />)

        fireEvent.change(screen.getByLabelText('Sicil Numarası'), { target: { value: 'WRONG' } })
        fireEvent.change(screen.getByLabelText('Şifre'), { target: { value: 'pass' } })

        fireEvent.click(screen.getByRole('button', { name: /Giriş Yap/i }))

        await waitFor(() => {
            expect(screen.getByText('Hatalı giriş')).toBeInTheDocument()
            expect(pushMock).not.toHaveBeenCalled()
        })
    })
})
