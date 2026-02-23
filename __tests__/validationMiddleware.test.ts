import { describe, it, expect, vi } from 'vitest'
import { z } from 'zod'
import { NextRequest } from 'next/server'
import { validateBody, validateQuery, validationErrorResponse, withValidation, withQueryValidation } from '../lib/validationMiddleware'

function createMockRequest(body: any): NextRequest {
    return new NextRequest('http://localhost:3000/api/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    })
}

function createMockRequestWithQuery(params: Record<string, string>): NextRequest {
    const url = new URL('http://localhost:3000/api/test')
    for (const [k, v] of Object.entries(params)) {
        url.searchParams.set(k, v)
    }
    return new NextRequest(url.toString())
}

describe('validationMiddleware', () => {
    describe('validateBody', () => {
        const schema = z.object({
            name: z.string().min(1, 'İsim zorunlu'),
            age: z.number().min(0, 'Yaş negatif olamaz'),
        })

        it('returns success with valid body', async () => {
            const req = createMockRequest({ name: 'Ali', age: 25 })
            const result = await validateBody(req, schema)
            expect(result.success).toBe(true)
            if (result.success) {
                expect(result.data.name).toBe('Ali')
                expect(result.data.age).toBe(25)
            }
        })

        it('returns error with invalid body', async () => {
            const req = createMockRequest({ name: '', age: -1 })
            const result = await validateBody(req, schema)
            expect(result.success).toBe(false)
            if (!result.success) {
                expect(result.error).toBeDefined()
                expect(result.details).toBeDefined()
            }
        })

        it('returns error for invalid JSON', async () => {
            const req = new NextRequest('http://localhost:3000/api/test', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: 'not json{{{',
            })
            const result = await validateBody(req, schema)
            expect(result.success).toBe(false)
            if (!result.success) {
                expect(result.error).toBe('Geçersiz JSON formatı')
            }
        })
    })

    describe('validateQuery', () => {
        const schema = z.object({
            page: z.string().optional(),
            limit: z.string().optional(),
            name: z.string().min(1, 'Name is required'),
        })

        it('returns success with valid params', () => {
            const params = new URLSearchParams({ name: 'test', page: '1' })
            const result = validateQuery(params, schema)
            expect(result.success).toBe(true)
            if (result.success) {
                expect(result.data.name).toBe('test')
                expect(result.data.page).toBe('1')
            }
        })

        it('returns error with invalid params', () => {
            const params = new URLSearchParams({ page: '1' })
            const result = validateQuery(params, schema)
            expect(result.success).toBe(false)
        })

        it('handles duplicate keys as arrays', () => {
            const arraySchema = z.object({
                tag: z.union([z.string(), z.array(z.string())]),
            })
            const params = new URLSearchParams()
            params.append('tag', 'a')
            params.append('tag', 'b')

            const result = validateQuery(params, arraySchema)
            expect(result.success).toBe(true)
            if (result.success) {
                expect(result.data.tag).toEqual(['a', 'b'])
            }
        })

        it('returns formatted error message for single issue', () => {
            const strictSchema = z.object({
                email: z.string().email('Geçersiz email'),
            })
            const params = new URLSearchParams({ email: 'invalid' })
            const result = validateQuery(params, strictSchema)
            expect(result.success).toBe(false)
            if (!result.success) {
                expect(result.error).toBe('Geçersiz email')
            }
        })

        it('returns numbered error messages for multiple issues', () => {
            const strictSchema = z.object({
                email: z.string().email('Geçersiz email'),
                name: z.string().min(1, 'İsim zorunlu'),
            })
            const params = new URLSearchParams({ email: 'invalid' })
            const result = validateQuery(params, strictSchema)
            expect(result.success).toBe(false)
            if (!result.success) {
                expect(result.error).toContain('1.')
                expect(result.error).toContain('2.')
            }
        })
    })

    describe('validationErrorResponse', () => {
        it('returns 400 response with message', async () => {
            const response = validationErrorResponse('Test hatası')
            expect(response.status).toBe(400)

            const body = await response.json()
            expect(body.success).toBe(false)
            expect(body.message).toBe('Test hatası')
        })

        it('includes error details when provided', async () => {
            const zodError = new z.ZodError([
                {
                    code: 'invalid_type',
                    expected: 'string',
                    received: 'number',
                    path: ['name'],
                    message: 'Expected string',
                },
            ])

            const response = validationErrorResponse('Validasyon hatası', zodError)
            const body = await response.json()
            expect(body.errors).toHaveLength(1)
            expect(body.errors[0].path).toBe('name')
            expect(body.errors[0].message).toBe('Expected string')
        })
    })

    describe('withValidation', () => {
        const schema = z.object({
            name: z.string().min(1, 'İsim zorunlu'),
        })

        it('calls handler with valid data', async () => {
            const handler = vi.fn().mockResolvedValue(new Response(JSON.stringify({ ok: true })))
            const wrapped = withValidation(schema, handler)

            const req = createMockRequest({ name: 'Ali' })
            await wrapped(req)

            expect(handler).toHaveBeenCalledWith({ name: 'Ali' }, req)
        })

        it('returns 400 for invalid data without calling handler', async () => {
            const handler = vi.fn()
            const wrapped = withValidation(schema, handler)

            const req = createMockRequest({ name: '' })
            const response = await wrapped(req)
            const body = await response.json()

            expect(handler).not.toHaveBeenCalled()
            expect(response.status).toBe(400)
            expect(body.success).toBe(false)
        })
    })

    describe('withQueryValidation', () => {
        const schema = z.object({
            page: z.string().min(1, 'Page zorunlu'),
        })

        it('calls handler with valid query params', async () => {
            const handler = vi.fn().mockResolvedValue(new Response(JSON.stringify({ ok: true })))
            const wrapped = withQueryValidation(schema, handler)

            const req = createMockRequestWithQuery({ page: '1' })
            await wrapped(req)

            expect(handler).toHaveBeenCalledWith({ page: '1' }, req)
        })

        it('returns 400 for invalid query params', async () => {
            const handler = vi.fn()
            const wrapped = withQueryValidation(schema, handler)

            const req = createMockRequestWithQuery({})
            const response = await wrapped(req)
            const body = await response.json()

            expect(handler).not.toHaveBeenCalled()
            expect(response.status).toBe(400)
            expect(body.success).toBe(false)
        })
    })
})
