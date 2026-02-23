import { describe, it, expect, vi } from 'vitest'

// Mock db
vi.mock('@/lib/db', () => ({
    db: {
        get: vi.fn(),
    },
}))

import { GET } from '../app/api/health/route'
import { db } from '@/lib/db'

const mockDb = db as unknown as { get: ReturnType<typeof vi.fn> }

describe('GET /api/health', () => {
    it('returns healthy when db responds', async () => {
        mockDb.get.mockResolvedValue({ ok: 1 })

        const response = await GET()
        const body = await response.json()

        expect(response.status).toBe(200)
        expect(body.status).toBe('healthy')
        expect(body.db).toBe('connected')
        expect(body.timestamp).toBeDefined()
    })

    it('returns unhealthy when db returns wrong value', async () => {
        mockDb.get.mockResolvedValue({ ok: 0 })

        const response = await GET()
        const body = await response.json()

        expect(response.status).toBe(503)
        expect(body.status).toBe('unhealthy')
        expect(body.db).toBe('failed')
    })

    it('returns unhealthy when db throws', async () => {
        mockDb.get.mockRejectedValue(new Error('Connection failed'))

        const response = await GET()
        const body = await response.json()

        expect(response.status).toBe(503)
        expect(body.status).toBe('unhealthy')
        expect(body.db).toBe('unreachable')
    })
})
