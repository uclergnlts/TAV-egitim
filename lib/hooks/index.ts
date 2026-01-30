/**
 * React Query Hooks Index
 * Export all hooks from a single entry point
 */

// Personnel hooks
export {
    usePersonnelList,
    usePersonnel,
    useCreatePersonnel,
    useUpdatePersonnel,
    useDeletePersonnel,
    type Personnel,
    type PersonnelListResponse,
    type PersonnelFilters,
} from "./usePersonnel";

// Training hooks
export {
    useTrainings,
    useTraining,
    useTrainingTopics,
    useCreateTraining,
    useUpdateTraining,
    useDeleteTraining,
    type Training,
    type TrainingTopic,
    type TrainingListResponse,
} from "./useTrainings";

// Dashboard hooks
export {
    useDashboardStats,
    usePrefetchDashboard,
    type DashboardStats,
    type DashboardResponse,
} from "./useDashboard";
