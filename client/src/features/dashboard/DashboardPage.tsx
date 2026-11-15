import { useQuery } from '@tanstack/react-query'
import { ArrowDownRight, ArrowUpRight, CalendarDays, CircleDollarSign, Clock3, FolderKanban, Plus, RefreshCw, TrendingUp } from 'lucide-react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Link, useOutletContext } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { request, type DashboardData, type Organization, type Project } from '@/services/api'
import { useAuth } from '@/features/auth/AuthProvider'

export function DashboardPage() {
  const { organization } = useOutletContext<{ organization: Organization }>()
  const dashboard = useQuery({
    queryKey: ['dashboard', organization.id],
    queryFn: () => request<DashboardData>('/dashboard', {}, true, organization.id),
  })
  const { user } = useAuth()
  const data = dashboard.data

  if (dashboard.isLoading) return <LoadingState />
  if (dashboard.isError) {
    return (
      <section className="mx-auto max-w-3xl rounded-xl border border-red-200 bg-white p-8 text-center">
        <p className="text-sm font-semibold text-ink">We couldn’t load your workspace</p>
        <p className="mt-2 text-sm text-muted">{dashboard.error.message}</p>
        <Button className="mt-5" variant="secondary" onClick={() => void dashboard.refetch()}><RefreshCw size={15} /> Try again</Button>
      </section>
    )
  }
  if (!data) return null

  const { metrics } = data
  const hasBudget = metrics.plannedBudget > 0
  const budgetRatio = hasBudget ? Math.round(metrics.actualExpenditure / metrics.plannedBudget * 100) : 0
  const budgetWidth = Math.min(100, budgetRatio)
  const overBudget = hasBudget && metrics.actualExpenditure > metrics.plannedBudget
  const greeting = new Date().getHours() < 12 ? 'Good morning' : new Date().getHours() < 18 ? 'Good afternoon' : 'Good evening'

  return (
    <div className="mx-auto max-w-[1440px] space-y-7">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-medium text-muted">{new Intl.DateTimeFormat('en', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }).format(new Date())}</p>
          <h1 className="mt-1.5 text-[26px] font-semibold tracking-[-.04em] text-ink sm:text-[30px]">{greeting}, {user?.name.split(' ')[0]} <span aria-hidden="true">✦</span></h1>
          <p className="mt-1 text-sm text-muted">Here’s what’s happening across your projects.</p>
        </div>
        <Link to="/projects?new=true"><Button><Plus size={16} /> New project</Button></Link>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard title="Total projects" value={metrics.totalProjects.toString()} note={`${metrics.activeProjects} currently active`} icon={<FolderKanban size={17} />} tone="orange" />
        <MetricCard title="Active projects" value={metrics.activeProjects.toString()} note={`${metrics.averageProgress}% average progress`} icon={<TrendingUp size={17} />} tone="green" />
        <MetricCard title="Planned budget" value={formatCurrency(metrics.plannedBudget)} note={hasBudget ? `${budgetRatio}% utilized to date` : 'No planned budget set'} icon={<CircleDollarSign size={17} />} tone="blue" />
        <MetricCard title="Delayed projects" value={metrics.delayedProjects.toString()} note={metrics.delayedProjects ? 'Review project schedules' : 'All projects on schedule'} icon={<Clock3 size={17} />} tone={metrics.delayedProjects ? 'amber' : 'green'} />
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.7fr)_minmax(300px,.8fr)]">
        <Card className="p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div><h2 className="text-sm font-semibold text-ink">Project progress</h2><p className="mt-1 text-xs text-muted">Completion across recent projects</p></div>
            <Badge tone="gray" className="gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-brand" /> Live portfolio</Badge>
          </div>
          <div className="mt-6 h-[235px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.projects.map((project) => ({ name: project.name.length > 18 ? `${project.name.slice(0, 17)}…` : project.name, progress: project.progress }))} margin={{ top: 5, right: 4, left: -18, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke="#eef0f1" strokeDasharray="3 4" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#8a949c', fontSize: 10 }} dy={9} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#8a949c', fontSize: 11 }} tickFormatter={(value: number) => `${value}%`} domain={[0, 100]} />
                <Tooltip contentStyle={{ borderRadius: 10, border: '1px solid #e8ebed', boxShadow: '0 6px 20px #202a3512', fontSize: 12 }} formatter={(value) => [`${value}%`]} />
                <Bar dataKey="progress" name="Complete" fill="#d66c3c" radius={[4, 4, 0, 0]} maxBarSize={38} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          {!data.projects.length && <p className="mt-2 text-center text-xs text-muted">Project completion will appear once projects are added.</p>}
        </Card>

        <Card className="flex flex-col p-5 sm:p-6">
          <div className="flex items-start justify-between">
            <div><h2 className="text-sm font-semibold text-ink">Budget overview</h2><p className="mt-1 text-xs text-muted">Across all projects</p></div>
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-green-soft text-green"><CircleDollarSign size={17} /></span>
          </div>
          <div className="mt-7">
            <p className="text-[11px] font-medium uppercase tracking-wide text-muted">Total planned budget</p>
            <p className="mt-1 text-[26px] font-semibold tracking-[-.04em] text-ink">{formatCurrency(metrics.plannedBudget)}</p>
            <div className="mt-5 h-2 overflow-hidden rounded-full bg-[#edf0ef]"><div className={`h-full rounded-full ${budgetRatio > 100 ? 'bg-[#bd554b]' : 'bg-green'}`} style={{ width: `${budgetWidth}%` }} /></div>
            <div className="mt-2 flex justify-between text-[11px]"><span className="text-muted">Spent <b className="font-semibold text-ink">{formatCurrency(metrics.actualExpenditure)}</b></span><span className={`font-semibold ${overBudget ? 'text-[#bd554b]' : 'text-green'}`}>{hasBudget ? `${budgetRatio}%` : '—'}</span></div>
          </div>
          <div className="mt-auto grid grid-cols-2 gap-3 pt-7">
            <div className="rounded-lg bg-[#f7f8f6] p-3"><p className="text-[10px] text-muted">Remaining</p><p className="mt-1 text-sm font-semibold text-ink">{hasBudget ? formatCurrency(Math.max(0, metrics.plannedBudget - metrics.actualExpenditure)) : '—'}</p></div>
            <div className="rounded-lg bg-[#f7f8f6] p-3"><p className="text-[10px] text-muted">Over budget</p><p className={`mt-1 text-sm font-semibold ${overBudget ? 'text-[#bd554b]' : 'text-ink'}`}>{overBudget ? formatCurrency(metrics.actualExpenditure - metrics.plannedBudget) : hasBudget ? 'NPR 0' : '—'}</p></div>
          </div>
        </Card>
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.7fr)_minmax(300px,.8fr)]">
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between border-b border-line px-5 py-4 sm:px-6">
            <div><h2 className="text-sm font-semibold text-ink">Recent projects</h2><p className="mt-1 text-xs text-muted">A snapshot of your project portfolio</p></div>
            <Link to="/projects" className="text-xs font-semibold text-brand hover:text-brand-dark">View all <span aria-hidden="true">→</span></Link>
          </div>
          <div className="divide-y divide-line">
            {data.projects.slice(0, 4).map((project) => <ProjectRow key={project.id} project={project} />)}
            {!data.projects.length && <EmptyProjects />}
          </div>
        </Card>
        <Card className="p-5 sm:p-6">
          <div className="flex items-start justify-between">
            <div><h2 className="text-sm font-semibold text-ink">Recent activity</h2><p className="mt-1 text-xs text-muted">Latest updates from your team</p></div>
            <CalendarDays size={16} className="text-muted" />
          </div>
          <div className="mt-5 space-y-5">
            {data.activities.length ? data.activities.map((activity) => (
              <div key={activity.id} className="flex gap-3">
                <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[#f8eee8] text-brand"><ArrowUpRight size={14} /></span>
                <div className="min-w-0">
                  <p className="text-xs leading-5 text-ink"><b className="font-semibold">{activity.user?.name ?? 'A team member'}</b> {activity.description}</p>
                  <p className="mt-1 truncate text-[10px] text-muted">{activity.project?.name ?? 'Workspace'} · {relativeTime(activity.createdAt)}</p>
                </div>
              </div>
            )) : <p className="py-6 text-center text-xs text-muted">Activity will appear here as your team works.</p>}
          </div>
          <div className="mt-5 flex items-center gap-2 border-t border-line pt-4 text-[11px] text-muted"><ArrowDownRight size={14} className="text-green" /> Activity updates as work happens</div>
        </Card>
      </section>
    </div>
  )
}

function MetricCard({ title, value, note, icon, tone }: { title: string; value: string; note: string; icon: React.ReactNode; tone: 'orange' | 'green' | 'blue' | 'amber' }) {
  const classes = {
    orange: 'bg-[#fbede6] text-brand',
    green: 'bg-green-soft text-green',
    blue: 'bg-[#eaf0f6] text-[#537393]',
    amber: 'bg-amber-soft text-[#a3751f]',
  }
  return (
    <Card className="p-4 sm:p-5">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-muted">{title}</p>
        <span className={`grid h-8 w-8 place-items-center rounded-lg ${classes[tone]}`}>{icon}</span>
      </div>
      <p className="mt-4 text-[25px] font-semibold tracking-[-.04em] text-ink">{value}</p>
      <p className="mt-2 truncate text-[10px] text-muted">{note}</p>
    </Card>
  )
}

export function ProjectRow({ project }: { project: Project }) {
  const status = project.status === 'ACTIVE' ? { label: 'In progress', tone: 'green' as const } :
    project.status === 'COMPLETED' ? { label: 'Completed', tone: 'gray' as const } :
      project.status === 'ON_HOLD' ? { label: 'On hold', tone: 'amber' as const } :
        project.status === 'CANCELLED' ? { label: 'Cancelled', tone: 'red' as const } : { label: 'Planning', tone: 'orange' as const }
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-5 py-4 sm:grid-cols-[minmax(0,1fr)_minmax(125px,.7fr)_minmax(105px,.55fr)_80px] sm:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[#f3f5f4] text-[#75817e]"><FolderKanban size={16} /></span>
        <span className="min-w-0"><span className="block truncate text-xs font-semibold text-ink">{project.name}</span><span className="mt-1 block truncate text-[10px] text-muted">{project.code} · {project.clientName}</span></span>
      </div>
      <div className="hidden min-w-0 sm:block">
        <div className="flex items-center justify-between text-[10px]"><span className="text-muted">Progress</span><span className="font-semibold text-ink">{project.progress}%</span></div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#eef0ef]"><div className="h-full rounded-full bg-brand" style={{ width: `${project.progress}%` }} /></div>
      </div>
      <span className="hidden text-[11px] text-muted sm:block">{formatDate(project.expectedCompletion)}</span>
      <Badge tone={status.tone} className="justify-self-end">{status.label}</Badge>
    </div>
  )
}

function EmptyProjects() {
  return <div className="px-6 py-10 text-center"><p className="text-sm font-medium text-ink">No projects yet</p><p className="mt-1 text-xs text-muted">Create your first project to see it here.</p></div>
}

function LoadingState() {
  return <div className="mx-auto max-w-[1440px] animate-pulse space-y-7"><div className="h-16 w-72 rounded-lg bg-white" /><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[1, 2, 3, 4].map((item) => <div key={item} className="h-28 rounded-xl border border-line bg-white" />)}</div><div className="grid gap-5 xl:grid-cols-[1.7fr_.8fr]"><div className="h-[330px] rounded-xl border border-line bg-white" /><div className="h-[330px] rounded-xl border border-line bg-white" /></div></div>
}

export function formatCurrency(value: number | string) {
  return new Intl.NumberFormat('en-NP', { style: 'currency', currency: 'NPR', maximumFractionDigits: 0 }).format(Number(value))
}

export function formatDate(value: string) {
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(value))
}

function relativeTime(value: string) {
  const hours = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 3600000))
  if (hours < 1) return 'Just now'
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}
