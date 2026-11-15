const API_BASE = '/api'

let accessToken: string | null = null
let organizationId: string | null = null
let refreshPromise: Promise<string | null> | null = null
let restorePromise: Promise<AuthUser | null> | null = null

export function setAccessToken(token: string | null) {
  accessToken = token
}

export function setOrganizationId(id: string | null) {
  organizationId = id
}

async function refreshAccessToken() {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      const response = await fetch(`${API_BASE}/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
      })
      if (!response.ok) {
        accessToken = null
        return null
      }
      const payload = (await response.json()) as { accessToken: string }
      accessToken = payload.accessToken
      return accessToken
    })().finally(() => { refreshPromise = null })
  }
  return refreshPromise
}

export class ApiError extends Error {
  constructor(message: string, public readonly status: number) {
    super(message)
    this.name = 'ApiError'
  }
}

export async function request<T>(
  path: string,
  options: RequestInit = {},
  shouldRefresh = true,
  requestOrganizationId?: string | null,
): Promise<T> {
  const headers = new Headers(options.headers)
  if (options.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json')
  if (accessToken) headers.set('Authorization', `Bearer ${accessToken}`)
  const activeOrganizationId = requestOrganizationId === undefined ? organizationId : requestOrganizationId
  if (activeOrganizationId && !path.startsWith('/auth/') && !path.startsWith('/organizations')) {
    headers.set('X-Organization-ID', activeOrganizationId)
  }
  let response: Response
  try {
    response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers,
      credentials: 'include',
    })
  } catch {
    throw new ApiError('The API is unreachable. Start the Express server and check its database connection.', 0)
  }

  if (response.status === 401 && shouldRefresh && !path.startsWith('/auth/')) {
    const refreshed = await refreshAccessToken()
    if (refreshed) return request<T>(path, options, false, requestOrganizationId)
    window.dispatchEvent(new Event('structiqx:session-expired'))
  }
  if (!response.ok) {
    if (!response.headers.get('content-type')?.includes('application/json')) {
      throw new ApiError('The API returned an unexpected response. Confirm the Express server is running.', response.status)
    }
    const error = (await response.json().catch(() => null)) as { message?: string } | null
    throw new ApiError(error?.message ?? 'The request could not be completed.', response.status)
  }
  if (response.status === 204) return undefined as T
  return (await response.json()) as T
}

export async function restoreSession() {
  if (!restorePromise) {
    restorePromise = (async () => {
      const token = await refreshAccessToken()
      if (!token) return null
      const response = await request<{ user: AuthUser }>('/auth/me')
      return response.user
    })().finally(() => { restorePromise = null })
  }
  return restorePromise
}

export interface AuthUser {
  id: string
  name: string
  email: string
}

export interface Organization {
  id: string
  name: string
  slug: string
  currency: string
  role: string
}

export type ProjectStatus = 'PLANNING' | 'ACTIVE' | 'ON_HOLD' | 'COMPLETED' | 'CANCELLED'
export type ProjectCategory = 'RESIDENTIAL' | 'COMMERCIAL' | 'ROADS' | 'BRIDGES' | 'DRAINAGE' | 'WATER_SUPPLY' | 'IRRIGATION' | 'OTHER'

export interface Project {
  id: string
  name: string
  code: string
  clientName: string
  category: ProjectCategory
  description?: string
  location: string
  contractValue: number | string
  plannedBudget: number | string
  actualExpenditure: number | string
  progress: number
  status: ProjectStatus
  startDate: string
  expectedCompletion: string
  manager?: { name: string } | null
}

export interface DashboardData {
  metrics: {
    totalProjects: number
    activeProjects: number
    delayedProjects: number
    plannedBudget: number
    actualExpenditure: number
    averageProgress: number
  }
  projects: Project[]
  activities: { id: string; action: string; description: string; createdAt: string; user: { name: string } | null; project: { name: string } | null }[]
}

export interface ProjectInput {
  code: string
  name: string
  clientName: string
  category: ProjectCategory
  description: string
  location: string
  contractValue: number
  plannedBudget: number
  startDate: string
  expectedCompletion: string
}

export interface ProjectTask {
  id: string
  title: string
  assignee: string
  status: 'todo' | 'in-progress' | 'review' | 'done'
  priority: 'Low' | 'Medium' | 'High'
  dueDate: string
  progress: number
}

export interface ProjectTeamMember {
  id: string
  name: string
  role: string
  allocation: number
  availability: string
}

export interface ProjectScheduleItem {
  id: string
  name: string
  startDate: string
  endDate: string
  status: 'completed' | 'in-progress' | 'upcoming'
}

export interface ProjectBudgetItem {
  label: string
  planned: number
  spent: number
  variance: number
}

export interface BoqItem {
  id: string
  item: string
  unit: string
  quantity: number
  rate: number
  amount: number
  category: string
}

export interface EngineeringCalculation {
  id: string
  label: string
  formula: string
  value: string
  note: string
}

export interface ProcurementItem {
  id: string
  item: string
  supplier: string
  status: 'Pending' | 'Approved' | 'In transit' | 'Delivered'
  amount: number
  eta: string
}

export interface SiteReport {
  id: string
  title: string
  date: string
  author: string
  summary: string
  weather: string
  status: 'Good' | 'Caution' | 'Issue'
}

export interface ProjectDocument {
  id: string
  name: string
  type: string
  size: string
  updatedAt: string
  owner: string
}

export interface ApprovalItem {
  id: string
  title: string
  reviewer: string
  status: 'Pending' | 'Approved' | 'Rejected'
  dueDate: string
}

export interface ClientPortalUpdate {
  id: string
  title: string
  stage: string
  summary: string
  publishedAt: string
  visibility: 'Public' | 'Private'
}

export interface AnalyticsMetric {
  label: string
  value: string
  delta: string
  tone: 'green' | 'amber' | 'red' | 'blue'
}

export interface PdfExportItem {
  id: string
  name: string
  type: string
  generatedAt: string
  status: 'Ready' | 'Processing' | 'Failed'
}

export interface SecurityCheck {
  id: string
  title: string
  owner: string
  status: 'Pass' | 'Warning' | 'Review'
  detail: string
}

export interface ProjectDetail {
  project: Project
  tasks: ProjectTask[]
  team: ProjectTeamMember[]
  schedule: ProjectScheduleItem[]
  budget: ProjectBudgetItem[]
  boq: BoqItem[]
  calculations: EngineeringCalculation[]
  procurements: ProcurementItem[]
  siteReports: SiteReport[]
  documents: ProjectDocument[]
  approvals: ApprovalItem[]
  clientPortal: ClientPortalUpdate[]
  analytics: AnalyticsMetric[]
  pdfExports: PdfExportItem[]
  securityChecks: SecurityCheck[]
  summary: {
    completionRate: number
    forecast: number
    qualityChecks: number
    criticalPath: string
  }
}
