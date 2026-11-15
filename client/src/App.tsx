import { lazy, Suspense } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider, useAuth } from '@/features/auth/AuthProvider'
import { SignInPage } from '@/features/auth/SignInPage'
import { WorkspaceLayout } from '@/app/WorkspaceLayout'

const DashboardPage = lazy(() => import('@/features/dashboard/DashboardPage').then((module) => ({ default: module.DashboardPage })))
const ProjectsPage = lazy(() => import('@/features/projects/ProjectsPage').then((module) => ({ default: module.ProjectsPage })))
const ProjectWorkspacePage = lazy(() => import('@/features/projects/ProjectWorkspacePage').then((module) => ({ default: module.ProjectWorkspacePage })))

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, retry: 1, refetchOnWindowFocus: false },
  },
})

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <ApplicationRoutes />
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  )
}

function ApplicationRoutes() {
  const { user, loading } = useAuth()
  if (loading) {
    return <div className="grid min-h-screen place-items-center bg-canvas"><div className="h-8 w-8 animate-spin rounded-full border-2 border-line border-t-brand" role="status" aria-label="Loading session" /></div>
  }
  if (!user) return <SignInPage />

  return (
    <Routes>
      <Route element={<WorkspaceLayout />}>
        <Route index element={<Suspense fallback={<PageLoading />}><DashboardPage /></Suspense>} />
        <Route path="projects" element={<Suspense fallback={<PageLoading />}><ProjectsPage /></Suspense>} />
        <Route path="projects/:projectId" element={<Suspense fallback={<PageLoading />}><ProjectWorkspacePage /></Suspense>} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

function PageLoading() {
  return <div className="h-56 animate-pulse rounded-xl border border-line bg-white" role="status" aria-label="Loading page" />
}
