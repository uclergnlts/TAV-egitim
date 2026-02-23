import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { FormField, Input, Select, Textarea, validators, validate, validateForm } from '../components/FormHelpers'

describe('FormField', () => {
    it('renders label and children', () => {
        render(
            <FormField label="Test Label">
                <input data-testid="child" />
            </FormField>
        )
        expect(screen.getByText('Test Label')).toBeInTheDocument()
        expect(screen.getByTestId('child')).toBeInTheDocument()
    })

    it('shows required asterisk', () => {
        render(
            <FormField label="Required" required>
                <input />
            </FormField>
        )
        expect(screen.getByText('*')).toBeInTheDocument()
    })

    it('shows hint when no error', () => {
        render(
            <FormField label="Field" hint="Helpful hint">
                <input />
            </FormField>
        )
        expect(screen.getByText('Helpful hint')).toBeInTheDocument()
    })

    it('shows error instead of hint', () => {
        render(
            <FormField label="Field" hint="Helpful hint" error="Something wrong">
                <input />
            </FormField>
        )
        expect(screen.getByText('Something wrong')).toBeInTheDocument()
        expect(screen.queryByText('Helpful hint')).not.toBeInTheDocument()
    })
})

describe('Input', () => {
    it('renders with error styling', () => {
        const { container } = render(<Input error placeholder="test" />)
        const input = container.querySelector('input')
        expect(input?.className).toContain('border-red-300')
    })

    it('renders with icon', () => {
        const { container } = render(<Input icon={<span data-testid="icon">X</span>} />)
        expect(screen.getByTestId('icon')).toBeInTheDocument()
        const input = container.querySelector('input')
        expect(input?.className).toContain('pl-10')
    })

    it('renders without error styling normally', () => {
        const { container } = render(<Input placeholder="normal" />)
        const input = container.querySelector('input')
        expect(input?.className).toContain('border-gray-300')
    })
})

describe('Select', () => {
    const options = [
        { value: 'a', label: 'Option A' },
        { value: 'b', label: 'Option B' },
    ]

    it('renders options', () => {
        render(<Select options={options} />)
        expect(screen.getByText('Option A')).toBeInTheDocument()
        expect(screen.getByText('Option B')).toBeInTheDocument()
    })

    it('renders placeholder', () => {
        render(<Select options={options} placeholder="Seçiniz" />)
        expect(screen.getByText('Seçiniz')).toBeInTheDocument()
    })

    it('renders with error styling', () => {
        const { container } = render(<Select options={options} error />)
        const select = container.querySelector('select')
        expect(select?.className).toContain('border-red-300')
    })
})

describe('Textarea', () => {
    it('renders with error styling', () => {
        const { container } = render(<Textarea error />)
        const textarea = container.querySelector('textarea')
        expect(textarea?.className).toContain('border-red-300')
    })

    it('renders without error styling normally', () => {
        const { container } = render(<Textarea />)
        const textarea = container.querySelector('textarea')
        expect(textarea?.className).toContain('border-gray-300')
    })
})

describe('validators', () => {
    it('required - returns error for empty value', () => {
        expect(validators.required('')).toBe('Bu alan zorunludur')
        expect(validators.required('  ')).toBe('Bu alan zorunludur')
        expect(validators.required(null)).toBe('Bu alan zorunludur')
        expect(validators.required(undefined)).toBe('Bu alan zorunludur')
    })

    it('required - returns undefined for valid value', () => {
        expect(validators.required('test')).toBeUndefined()
    })

    it('email - validates email format', () => {
        expect(validators.email('invalid')).toBe('Geçerli bir e-posta girin')
        expect(validators.email('test@example.com')).toBeUndefined()
        expect(validators.email('')).toBeUndefined()
    })

    it('minLength - validates minimum length', () => {
        const min3 = validators.minLength(3)
        expect(min3('ab')).toBe('En az 3 karakter olmalı')
        expect(min3('abc')).toBeUndefined()
        expect(min3('')).toBeUndefined()
    })

    it('maxLength - validates maximum length', () => {
        const max5 = validators.maxLength(5)
        expect(max5('abcdef')).toBe('En fazla 5 karakter olabilir')
        expect(max5('abc')).toBeUndefined()
        expect(max5('')).toBeUndefined()
    })

    it('pattern - validates regex pattern', () => {
        const onlyNumbers = validators.pattern(/^\d+$/, 'Sadece rakam')
        expect(onlyNumbers('abc')).toBe('Sadece rakam')
        expect(onlyNumbers('123')).toBeUndefined()
        expect(onlyNumbers('')).toBeUndefined()
    })

    it('sicilNo - validates sicil number', () => {
        expect(validators.sicilNo('123')).toBe('Sicil numarası 5-7 rakam olmalı')
        expect(validators.sicilNo('12345')).toBeUndefined()
        expect(validators.sicilNo('1234567')).toBeUndefined()
        expect(validators.sicilNo('12345678')).toBe('Sicil numarası 5-7 rakam olmalı')
    })

    it('tcKimlik - validates TC Kimlik number', () => {
        expect(validators.tcKimlik('123')).toBe('TC Kimlik 11 haneli olmalı')
        expect(validators.tcKimlik('12345678901')).toBeUndefined()
    })
})

describe('validate', () => {
    it('returns first error found', () => {
        const result = validate('', [validators.required, validators.minLength(3)])
        expect(result).toBe('Bu alan zorunludur')
    })

    it('returns undefined when all pass', () => {
        const result = validate('hello', [validators.required, validators.minLength(3)])
        expect(result).toBeUndefined()
    })
})

describe('validateForm', () => {
    it('returns errors for invalid fields', () => {
        const errors = validateForm(
            { name: '', email: 'invalid' },
            {
                name: [validators.required],
                email: [validators.email],
            }
        )
        expect(errors.name).toBe('Bu alan zorunludur')
        expect(errors.email).toBe('Geçerli bir e-posta girin')
    })

    it('returns empty object for valid form', () => {
        const errors = validateForm(
            { name: 'Test', email: 'test@example.com' },
            {
                name: [validators.required],
                email: [validators.email],
            }
        )
        expect(Object.keys(errors)).toHaveLength(0)
    })
})
