import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockLogout = vi.fn()

vi.mock('@/lib/auth', () => ({
    logout: () => mockLogout(),
}))

import { POST, GET } from '../app/api/auth/logout/route'

describe('/api/auth/logout', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('POST - redirects to login on success', async () => {
        mockLogout.mockResolvedValue(undefined)

        const request = new Request('http://localhost:3000/api/auth/logout', { method: 'POST' })
        const response = await POST(request)

        expect(response.status).toBe(303)
        expect(mockLogout).toHaveBeenCalled()
    })

    it('POST - returns 500 on error', async () => {
        mockLogout.mockRejectedValue(new Error('Logout failed'))

        const request = new Request('http://localhost:3000/api/auth/logout', { method: 'POST' })
        const response = await POST(request)
        const body = await response.json()

        expect(response.status).toBe(500)
        expect(body.success).toBe(false)
    })

    it('GET - calls POST handler', async () => {
        mockLogout.mockResolvedValue(undefined)

        const request = new Request('http://localhost:3000/api/auth/logout')
        const response = await GET(request)

        expect(response.status).toBe(303)
        expect(mockLogout).toHaveBeenCalled()
    })
})
