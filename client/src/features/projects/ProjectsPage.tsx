import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { z } from 'zod'
import { ChevronLeft, ChevronRight, CircleAlert, Plus, Search } from 'lucide-react'
import { useLocation, useNavigate, useOutletContext } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { formatCurrency, ProjectRow } from '@/features/dashboard/DashboardPage'
import { request, type Project, type ProjectInput } from '@/services/api'

const projectFormSchema = z.object({
  code: z.string().trim().min(2, 'Enter a project code.').max(24).regex(/^[A-Za-z0-9-]+$/, 'Use letters, numbers, and hyphens only.'),
  name: z.string().trim().min(3, 'Project name must be at least 3 characters.').max(120),
  clientName: z.string().trim().min(2, 'Enter a client name.').max(120),
  category: z.enum(['RESIDENTIAL', 'COMMERCIAL', 'ROADS', 'BRIDGES', 'DRAINAGE', 'WATER_SUPPLY', 'IRRIGATION', 'OTHER']),
  description: z.string().max(2000),
  location: z.string().trim().min(2, 'Enter a project location.').max(180),
  contractValue: z.coerce.number().min(0, 'Value cannot be negative.'),
  plannedBudget: z.coerce.number().min(0, 'Budget cannot be negative.'),
  startDate: z.string().min(1, 'Select a start date.'),
  expectedCompletion: z.string().min(1, 'Select a completion date.'),
}).refine((value) => value.expectedCompletion > value.startDate, {
  message: 'Completion must be after the start date.',
  path: ['expectedCompletion'],
})

type ProjectFormInput = z.input<typeof projectFormSchema>
type ProjectFormValues = z.output<typeof projectFormSchema>
type OutletData = { search: string; organization: { id: string } }

export function ProjectsPage() {
  const { search: globalSearch, organization } = useOutletContext<OutletData>()
  const [search, setSearch] = useState(globalSearch)
  const [createOpen, setCreateOpen] = useState(false)
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const location = useLocation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  useEffect(() => setSearch(globalSearch), [globalSearch])
  useEffect(() => {
    if (new URLSearchParams(location.search).get('new') === 'true') {
      setCreateOpen(true)
      navigate('/projects', { replace: true })
    }
  }, [location.search, navigate])

  const projectsQuery = useQuery({
    queryKey: ['projects', organization.id, search, status, page],
    queryFn: () => request<{ projects: Project[]; summary: { totalProjects: number; activeProjects: number; contractValue: number }; pagination: { page: number; pages: number; total: number } }>(
      `/projects?search=${encodeURIComponent(search)}&status=${encodeURIComponent(status)}&page=${page}&pageSize=8`,
      {},
      true,
      organization.id,
    ),
  })
  const createProject = useMutation({
    mutationFn: (input: ProjectInput) => request<{ project: Project }>('/projects', { method: 'POST', body: JSON.stringify(input) }, true, organization.id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['projects'] })
      void queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      setCreateOpen(false)
    },
  })

  const projects = projectsQuery.data?.projects ?? []
  const pages = projectsQuery.data?.pagination.pages ?? 1

  return (
    <div className="mx-auto max-w-[1440px] space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div><p className="text-xs font-medium text-muted">Workspace / Projects</p><h1 className="mt-1.5 text-[28px] font-semibold tracking-[-.04em] text-ink">Projects</h1><p className="mt-1 text-sm text-muted">Manage project delivery, budgets and milestones.</p></div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild><Button><Plus size={16} /> New project</Button></DialogTrigger>
          <CreateProjectDialog pending={createProject.isPending} error={createProject.error?.message} onCreate={(input) => createProject.mutate(input)} />
        </Dialog>
      </div>

      <section className="grid gap-3 sm:grid-cols-3">
        <QuickStat label="Total projects" value={projectsQuery.data?.summary.totalProjects.toString() ?? '—'} icon={<span className="h-2 w-2 rounded-full bg-brand" />} />
        <QuickStat label="Active" value={projectsQuery.data?.summary.activeProjects.toString() ?? '—'} icon={<span className="h-2 w-2 rounded-full bg-green" />} />
        <QuickStat label="Portfolio value" value={projectsQuery.data ? formatCurrency(projectsQuery.data.summary.contractValue) : '—'} icon={<span className="h-2 w-2 rounded-full bg-[#8293a0]" />} />
      </section>

      <Card className="overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-line p-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <div className="relative w-full sm:max-w-[300px]"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" /><Input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1) }} placeholder="Search projects…" className="h-9 pl-9 text-xs" aria-label="Search projects" /></div>
          <label className="flex items-center gap-2 text-xs text-muted">Status
            <select value={status} onChange={(event) => { setStatus(event.target.value); setPage(1) }} aria-label="Filter projects by status" className="h-9 rounded-lg border border-line bg-white px-3 text-xs text-ink outline-none focus:border-brand/60">
              <option value="">All statuses</option><option value="PLANNING">Planning</option><option value="ACTIVE">In progress</option><option value="ON_HOLD">On hold</option><option value="COMPLETED">Completed</option><option value="CANCELLED">Cancelled</option>
            </select>
          </label>
        </div>
        <div className="hidden grid-cols-[minmax(0,1fr)_minmax(125px,.7fr)_minmax(105px,.55fr)_80px] gap-3 bg-[#fafbfa] px-6 py-2.5 text-[10px] font-semibold uppercase tracking-[.08em] text-[#8b959c] sm:grid">
          <span>Project</span><span>Progress</span><span>Due date</span><span className="text-right">Status</span>
        </div>
        {projectsQuery.isLoading ? <div className="space-y-3 p-5"><div className="h-12 animate-pulse rounded-lg bg-canvas" /><div className="h-12 animate-pulse rounded-lg bg-canvas" /><div className="h-12 animate-pulse rounded-lg bg-canvas" /></div> :
          projectsQuery.isError ? <div className="p-12 text-center"><CircleAlert className="mx-auto text-[#be6255]" size={22} /><p className="mt-3 text-sm font-semibold text-ink">Projects couldn’t be loaded</p><p className="mt-1 text-xs text-muted">{projectsQuery.error.message}</p><Button variant="secondary" size="sm" className="mt-4" onClick={() => void projectsQuery.refetch()}>Try again</Button></div> :
            projects.length ? <div className="divide-y divide-line">{projects.map((project) => <ProjectRow key={project.id} project={project} />)}</div> :
              <div className="px-5 py-14 text-center"><p className="text-sm font-semibold text-ink">{search ? 'No matching projects' : 'No projects yet'}</p><p className="mt-1 text-xs text-muted">{search ? 'Try another project name, code, or client.' : 'Create your first project to get your portfolio moving.'}</p>{!search && <Button className="mt-4" size="sm" onClick={() => setCreateOpen(true)}><Plus size={14} /> Create a project</Button>}</div>}
        <div className="flex items-center justify-between border-t border-line px-4 py-3 text-xs text-muted sm:px-5">
          <span>{projectsQuery.data ? `${projectsQuery.data.pagination.total} projects` : ' '}</span>
          <div className="flex items-center gap-2"><span className="mr-1">Page {page} of {pages}</span><Button variant="secondary" size="icon" className="h-7 w-7" aria-label="Previous page" disabled={page <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))}><ChevronLeft size={14} /></Button><Button variant="secondary" size="icon" className="h-7 w-7" aria-label="Next page" disabled={page >= pages} onClick={() => setPage((value) => Math.min(pages, value + 1))}><ChevronRight size={14} /></Button></div>
        </div>
      </Card>
    </div>
  )
}

function QuickStat({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return <Card className="flex items-center gap-3 px-4 py-3.5"><span className="grid h-8 w-8 place-items-center rounded-lg bg-[#f5f6f5]">{icon}</span><span className="min-w-0"><span className="block text-[10px] text-muted">{label}</span><span className="mt-0.5 block truncate text-sm font-semibold text-ink">{value}</span></span></Card>
}

function CreateProjectDialog({ pending, error, onCreate }: { pending: boolean; error?: string; onCreate: (input: ProjectInput) => void }) {
  const form = useForm<ProjectFormInput, unknown, ProjectFormValues>({
    resolver: zodResolver(projectFormSchema),
    defaultValues: {
      code: '', name: '', clientName: '', category: 'OTHER', description: '', location: '',
      contractValue: 0, plannedBudget: 0, startDate: '', expectedCompletion: '',
    },
  })

  function submit(values: ProjectFormValues) {
    onCreate({
      ...values,
      contractValue: Number(values.contractValue),
      plannedBudget: Number(values.plannedBudget),
      startDate: new Date(values.startDate).toISOString(),
      expectedCompletion: new Date(values.expectedCompletion).toISOString(),
    })
  }

  return (
    <DialogContent className="max-w-[620px]">
      <DialogTitle className="text-lg font-semibold">Create a project</DialogTitle>
      <DialogDescription className="mt-1 text-sm text-muted">Add the project essentials. You can fill in the rest as work progresses.</DialogDescription>
      <form onSubmit={form.handleSubmit(submit)} className="mt-5 space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Project name" error={form.formState.errors.name?.message}><Input {...form.register('name')} placeholder="e.g. Riverside Apartments" /></FormField>
          <FormField label="Project code" error={form.formState.errors.code?.message}><Input {...form.register('code')} placeholder="e.g. PRJ-2025-009" /></FormField>
          <FormField label="Client" error={form.formState.errors.clientName?.message}><Input {...form.register('clientName')} placeholder="Client or organization" /></FormField>
          <FormField label="Category" error={form.formState.errors.category?.message}>
            <select {...form.register('category')} className="h-10 w-full rounded-lg border border-line bg-white px-3 text-sm text-ink outline-none focus:border-brand/60 focus:ring-2 focus:ring-brand/10">
              <option value="RESIDENTIAL">Residential buildings</option><option value="COMMERCIAL">Commercial buildings</option><option value="ROADS">Roads</option><option value="BRIDGES">Bridges</option><option value="DRAINAGE">Drainage</option><option value="WATER_SUPPLY">Water supply</option><option value="IRRIGATION">Irrigation</option><option value="OTHER">Other infrastructure</option>
            </select>
          </FormField>
          <FormField label="Location" error={form.formState.errors.location?.message}><Input {...form.register('location')} placeholder="Municipality, district" /></FormField>
          <FormField label="Contract value (NPR)" error={form.formState.errors.contractValue?.message}><Input type="number" min="0" step="1000" {...form.register('contractValue', { valueAsNumber: true })} /></FormField>
          <FormField label="Planned budget (NPR)" error={form.formState.errors.plannedBudget?.message}><Input type="number" min="0" step="1000" {...form.register('plannedBudget', { valueAsNumber: true })} /></FormField>
          <FormField label="Start date" error={form.formState.errors.startDate?.message}><Input type="date" {...form.register('startDate')} /></FormField>
          <FormField label="Expected completion" error={form.formState.errors.expectedCompletion?.message}><Input type="date" {...form.register('expectedCompletion')} /></FormField>
        </div>
        <FormField label="Description" error={form.formState.errors.description?.message}><textarea {...form.register('description')} rows={3} className="w-full resize-y rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink outline-none placeholder:text-muted/70 focus:border-brand/60 focus:ring-2 focus:ring-brand/10" placeholder="A short overview of the project…" /></FormField>
        {error && <p role="alert" className="rounded-lg bg-red-soft px-3 py-2 text-xs text-[#a43c34]">{error}</p>}
        <div className="flex justify-end gap-2 border-t border-line pt-4"><Button type="button" variant="secondary" onClick={() => form.reset()}>Reset</Button><Button type="submit" disabled={pending}>{pending ? 'Creating…' : 'Create project'}</Button></div>
      </form>
    </DialogContent>
  )
}

function FormField({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return <label className="block space-y-1.5 text-xs font-medium text-ink">{label}{children}{error && <span className="block text-[10px] font-normal text-[#b74e43]">{error}</span>}</label>
}

