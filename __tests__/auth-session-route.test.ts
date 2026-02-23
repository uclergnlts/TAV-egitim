import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockGetSession = vi.fn()

vi.mock('@/lib/auth', () => ({
    getSession: () => mockGetSession(),
}))

import { GET } from '../app/api/auth/session/route'

describe('GET /api/auth/session', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('returns session data when authenticated', async () => {
        mockGetSession.mockResolvedValue({
            userId: 'u1',
            sicilNo: '12345',
            fullName: 'Test User',
            role: 'ADMIN',
        })

        const response = await GET()
        const body = await response.json()

        expect(response.status).toBe(200)
        expect(body.success).toBe(true)
        expect(body.authenticated).toBe(true)
        expect(body.user.id).toBe('u1')
        expect(body.user.sicil_no).toBe('12345')
        expect(body.user.full_name).toBe('Test User')
        expect(body.user.role).toBe('ADMIN')
    })

    it('returns 401 when no session', async () => {
        mockGetSession.mockResolvedValue(null)

        const response = await GET()
        const body = await response.json()

        expect(response.status).toBe(401)
        expect(body.success).toBe(false)
        expect(body.authenticated).toBe(false)
    })

    it('returns 500 on error', async () => {
        mockGetSession.mockRejectedValue(new Error('Token expired'))

        const response = await GET()
        const body = await response.json()

        expect(response.status).toBe(500)
        expect(body.success).toBe(false)
    })
})
