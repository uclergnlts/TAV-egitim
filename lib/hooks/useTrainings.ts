/**
 * Trainings React Query Hooks
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys, invalidateTrainingCache } from "@/lib/queryClient";

// Types
interface Training {
    id: string;
    code: string;
    name: string;
    description?: string;
    duration_min: number;
    category: "TEMEL" | "TAZELEME" | "DIGER";
    default_location?: string;
    default_document_type?: "EGITIM_KATILIM_CIZELGESI" | "SERTIFIKA";
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

interface TrainingTopic {
    id: string;
    trainingId: string;
    title: string;
    orderNo?: number;
    isActive: boolean;
}

interface TrainingListResponse {
    success: boolean;
    data: (Training & { has_topics: boolean; topics: TrainingTopic[] })[];
}

// Fetch functions
async function fetchTrainingsList(): Promise<TrainingListResponse> {
    const response = await fetch("/api/trainings");
    
    if (!response.ok) {
        throw new Error("Eğitim listesi alınamadı");
    }

    return response.json();
}

async function fetchTrainingById(id: string): Promise<{ success: boolean; data: Training }> {
    const response = await fetch(`/api/trainings/${id}`);
    
    if (!response.ok) {
        throw new Error("Eğitim bilgisi alınamadı");
    }

    return response.json();
}

async function fetchTrainingTopics(trainingId: string): Promise<{ success: boolean; data: TrainingTopic[] }> {
    const response = await fetch(`/api/trainings/topics?trainingId=${trainingId}`);
    
    if (!response.ok) {
        throw new Error("Eğitim konuları alınamadı");
    }

    return response.json();
}

async function createTraining(data: Partial<Training>): Promise<{ success: boolean; data: Training }> {
    const response = await fetch("/api/trainings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Eğitim oluşturulamadı");
    }

    return response.json();
}

async function updateTraining(id: string, data: Partial<Training>): Promise<{ success: boolean; data: Training }> {
    const response = await fetch("/api/trainings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...data }),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Eğitim güncellenemedi");
    }

    return response.json();
}

async function deleteTraining(id: string): Promise<{ success: boolean }> {
    const response = await fetch(`/api/trainings/${id}`, {
        method: "DELETE",
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Eğitim silinemedi");
    }

    return response.json();
}

// Hooks
export function useTrainings() {
    return useQuery({
        queryKey: queryKeys.trainings.list(),
        queryFn: fetchTrainingsList,
        staleTime: 5 * 60 * 1000, // 5 minutes
    });
}

export function useTraining(id: string) {
    return useQuery({
        queryKey: queryKeys.trainings.detail(id),
        queryFn: () => fetchTrainingById(id),
        enabled: !!id,
    });
}

export function useTrainingTopics(trainingId: string) {
    return useQuery({
        queryKey: queryKeys.trainings.topics(trainingId),
        queryFn: () => fetchTrainingTopics(trainingId),
        enabled: !!trainingId,
    });
}

export function useCreateTraining() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: createTraining,
        onSuccess: () => {
            invalidateTrainingCache();
        },
    });
}

export function useUpdateTraining() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<Training> }) => 
            updateTraining(id, data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ 
                queryKey: queryKeys.trainings.detail(variables.id) 
            });
            invalidateTrainingCache();
        },
    });
}

export function useDeleteTraining() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: deleteTraining,
        onSuccess: () => {
            invalidateTrainingCache();
        },
    });
}

// Export types
export type { Training, TrainingTopic, TrainingListResponse };
