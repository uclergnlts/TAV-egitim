'use client'

import dynamic from 'next/dynamic'
import { Suspense } from 'react'
import { Skeleton } from '@/components/Skeleton'

// Loading fallback for dynamic components
function ChartSkeleton() {
  return (
    <div className="bg-white rounded-xl shadow-sm border p-6 h-80 animate-pulse">
      <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
      <div className="h-64 bg-gray-100 rounded"></div>
    </div>
  )
}

// Lazy load heavy chart components
export const DashboardCharts = dynamic(
  () => import('@/app/admin/components/DashboardCharts'),
  {
    ssr: false, // Disable SSR for charts (client-side only)
    loading: () => <ChartSkeleton />,
  }
)

// Lazy load Filter Panel
export const LazyFilterPanel = dynamic(
  () => import('@/components/FilterPanel').then((mod) => mod.FilterPanel),
  {
    ssr: false,
    loading: () => (
      <div className="bg-white rounded-xl border shadow-sm p-4 animate-pulse">
        <div className="h-10 bg-gray-200 rounded w-full"></div>
      </div>
    ),
  }
)

// Lazy load Data Table
export const LazyEnhancedTable = dynamic(
  () => import('@/components/EnhancedTable').then((mod) => mod.EnhancedTable),
  {
    ssr: false,
    loading: () => (
      <div className="bg-white rounded-xl border shadow-sm overflow-hidden animate-pulse">
        <div className="h-64 bg-gray-100"></div>
      </div>
    ),
  }
)

// Lazy load Personnel Modal
export const LazyPersonnelModal = dynamic(
  () => import('@/components/admin/PersonnelModal'),
  {
    ssr: false,
    loading: () => (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl shadow-xl p-8 w-full max-w-2xl animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="space-y-4">
            <div className="h-12 bg-gray-100 rounded"></div>
            <div className="h-12 bg-gray-100 rounded"></div>
            <div className="h-12 bg-gray-100 rounded"></div>
          </div>
        </div>
      </div>
    ),
  }
)

// Dynamic import wrapper with error boundary
interface DynamicImportProps<T extends Record<string, unknown>> {
  component: () => Promise<{ default: React.ComponentType<T> }>
  props: T
  fallback?: React.ReactNode
}

export function DynamicImport<T extends Record<string, unknown>>({
  component: Component,
  props,
  fallback,
}: DynamicImportProps<T>) {
  const LazyComponent = dynamic(Component, {
    ssr: false,
    loading: () => <>{fallback}</>,
  })

  return (
    <Suspense fallback={fallback || <Skeleton className="w-full h-64" />}>
      <LazyComponent {...props} />
    </Suspense>
  )
}
