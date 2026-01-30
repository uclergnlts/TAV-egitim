/**
 * Personnel React Query Hooks
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys, invalidatePersonnelCache } from "@/lib/queryClient";
import { FilterValue } from "@/components/FilterPanel";

// Types
interface Personnel {
    id: string;
    sicilNo: string;
    fullName: string;
    tcKimlikNo: string;
    gorevi: string;
    projeAdi: string;
    grup: string;
    personelDurumu: "CALISAN" | "AYRILDI" | "IZINLI" | "PASIF";
    cinsiyet?: "ERKEK" | "KADIN";
    telefon?: string;
    dogumTarihi?: string;
    adres?: string;
    createdAt: string;
    updatedAt: string;
}

interface PersonnelListResponse {
    success: boolean;
    data: Personnel[];
    pagination: {
        total: number;
        page: number;
        totalPages: number;
        limit: number;
    };
}

interface PersonnelFilters extends Record<string, unknown> {
    page?: number;
    limit?: number;
    query?: string;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
    advancedFilters?: FilterValue[];
}

// Fetch functions
async function fetchPersonnelList(filters: PersonnelFilters): Promise<PersonnelListResponse> {
    const params = new URLSearchParams();
    
    if (filters.page) params.append("page", filters.page.toString());
    if (filters.limit) params.append("limit", filters.limit.toString());
    if (filters.query) params.append("query", filters.query);
    if (filters.sortBy) params.append("sortBy", filters.sortBy);
    if (filters.sortOrder) params.append("sortOrder", filters.sortOrder);
    if (filters.advancedFilters && filters.advancedFilters.length > 0) {
        params.append("advancedFilters", JSON.stringify(filters.advancedFilters));
    }

    const response = await fetch(`/api/personnel?${params.toString()}`);
    
    if (!response.ok) {
        throw new Error("Personel listesi alınamadı");
    }

    return response.json();
}

async function fetchPersonnelById(id: string): Promise<{ success: boolean; data: Personnel }> {
    const response = await fetch(`/api/personnel/${id}`);
    
    if (!response.ok) {
        throw new Error("Personel bilgisi alınamadı");
    }

    return response.json();
}

async function createPersonnel(data: Partial<Personnel>): Promise<{ success: boolean; data: Personnel }> {
    const response = await fetch("/api/personnel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Personel oluşturulamadı");
    }

    return response.json();
}

async function updatePersonnel(id: string, data: Partial<Personnel>): Promise<{ success: boolean; data: Personnel }> {
    const response = await fetch(`/api/personnel/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Personel güncellenemedi");
    }

    return response.json();
}

async function deletePersonnel(id: string): Promise<{ success: boolean }> {
    const response = await fetch(`/api/personnel/${id}`, {
        method: "DELETE",
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Personel silinemedi");
    }

    return response.json();
}

// Hooks
export function usePersonnelList(filters: PersonnelFilters = {}) {
    return useQuery({
        queryKey: queryKeys.personnel.list(filters),
        queryFn: () => fetchPersonnelList(filters),
        placeholderData: (previousData) => previousData, // Keep previous data while fetching
    });
}

export function usePersonnel(id: string) {
    return useQuery({
        queryKey: queryKeys.personnel.detail(id),
        queryFn: () => fetchPersonnelById(id),
        enabled: !!id, // Only run if id is provided
    });
}

export function useCreatePersonnel() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: createPersonnel,
        onSuccess: () => {
            // Invalidate and refetch personnel list
            invalidatePersonnelCache();
        },
    });
}

export function useUpdatePersonnel() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<Personnel> }) => 
            updatePersonnel(id, data),
        onSuccess: (_, variables) => {
            // Invalidate specific personnel detail
            queryClient.invalidateQueries({ 
                queryKey: queryKeys.personnel.detail(variables.id) 
            });
            // Invalidate personnel list
            invalidatePersonnelCache();
        },
    });
}

export function useDeletePersonnel() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: deletePersonnel,
        onSuccess: () => {
            invalidatePersonnelCache();
        },
    });
}

// Export types
export type { Personnel, PersonnelListResponse, PersonnelFilters };
