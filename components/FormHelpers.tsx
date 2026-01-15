"use client";

import React from "react";

interface FormFieldProps {
    label: string;
    error?: string;
    required?: boolean;
    hint?: string;
    children: React.ReactNode;
    className?: string;
}

/**
 * Form field wrapper with label, error, and hint support
 */
export function FormField({ label, error, required, hint, children, className = "" }: FormFieldProps) {
    return (
        <div className={`space-y-1 ${className}`}>
            <label className="block text-sm font-medium text-gray-700">
                {label}
                {required && <span className="text-red-500 ml-0.5">*</span>}
            </label>
            {children}
            {hint && !error && (
                <p className="text-xs text-gray-500">{hint}</p>
            )}
            {error && (
                <p className="text-xs text-red-600 flex items-center gap-1 animate-fadeIn">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {error}
                </p>
            )}
        </div>
    );
}

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    error?: boolean;
    icon?: React.ReactNode;
}

/**
 * Enhanced input with error state and icon support
 */
export function Input({ error, icon, className = "", ...props }: InputProps) {
    return (
        <div className="relative">
            {icon && (
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    {icon}
                </div>
            )}
            <input
                className={`w-full px-4 py-2.5 border rounded-lg text-sm transition-colors focus:ring-2 focus:ring-offset-0 ${icon ? "pl-10" : ""
                    } ${error
                        ? "border-red-300 focus:border-red-500 focus:ring-red-200 bg-red-50/50"
                        : "border-gray-300 focus:border-blue-500 focus:ring-blue-200"
                    } ${className}`}
                {...props}
            />
        </div>
    );
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
    error?: boolean;
    options: { value: string; label: string }[];
    placeholder?: string;
}

/**
 * Enhanced select with error state
 */
export function Select({ error, options, placeholder, className = "", ...props }: SelectProps) {
    return (
        <select
            className={`w-full px-4 py-2.5 border rounded-lg text-sm transition-colors focus:ring-2 focus:ring-offset-0 ${error
                    ? "border-red-300 focus:border-red-500 focus:ring-red-200 bg-red-50/50"
                    : "border-gray-300 focus:border-blue-500 focus:ring-blue-200"
                } ${className}`}
            {...props}
        >
            {placeholder && (
                <option value="" disabled>
                    {placeholder}
                </option>
            )}
            {options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                    {opt.label}
                </option>
            ))}
        </select>
    );
}

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    error?: boolean;
}

/**
 * Enhanced textarea with error state
 */
export function Textarea({ error, className = "", ...props }: TextareaProps) {
    return (
        <textarea
            className={`w-full px-4 py-2.5 border rounded-lg text-sm transition-colors focus:ring-2 focus:ring-offset-0 resize-none ${error
                    ? "border-red-300 focus:border-red-500 focus:ring-red-200 bg-red-50/50"
                    : "border-gray-300 focus:border-blue-500 focus:ring-blue-200"
                } ${className}`}
            {...props}
        />
    );
}

/**
 * Validation helper functions
 */
export const validators = {
    required: (value: any) => (!value || (typeof value === "string" && !value.trim()) ? "Bu alan zorunludur" : undefined),

    email: (value: string) =>
        value && !/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(value) ? "Geçerli bir e-posta girin" : undefined,

    minLength: (min: number) => (value: string) =>
        value && value.length < min ? `En az ${min} karakter olmalı` : undefined,

    maxLength: (max: number) => (value: string) =>
        value && value.length > max ? `En fazla ${max} karakter olabilir` : undefined,

    pattern: (regex: RegExp, message: string) => (value: string) =>
        value && !regex.test(value) ? message : undefined,

    sicilNo: (value: string) =>
        value && !/^\d{5,7}$/.test(value) ? "Sicil numarası 5-7 rakam olmalı" : undefined,

    tcKimlik: (value: string) =>
        value && !/^\d{11}$/.test(value) ? "TC Kimlik 11 haneli olmalı" : undefined,
};

/**
 * Run multiple validators on a value
 */
export function validate(value: any, rules: Array<(value: any) => string | undefined>): string | undefined {
    for (const rule of rules) {
        const error = rule(value);
        if (error) return error;
    }
    return undefined;
}

/**
 * Validate a form object
 */
export function validateForm<T extends Record<string, any>>(
    values: T,
    schema: Partial<Record<keyof T, Array<(value: any) => string | undefined>>>
): Partial<Record<keyof T, string>> {
    const errors: Partial<Record<keyof T, string>> = {};

    for (const [field, rules] of Object.entries(schema)) {
        if (rules) {
            const error = validate(values[field as keyof T], rules);
            if (error) {
                errors[field as keyof T] = error;
            }
        }
    }

    return errors;
}
