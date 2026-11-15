import { useMemo, useState } from 'react'
import { ArrowLeft, BriefcaseBusiness, CalendarRange, CheckCircle2, Clock3, Gauge, Wallet } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { Link, useOutletContext, useParams } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { request, type Organization, type ProjectDetail } from '@/services/api'

const tabs = ['overview', 'tasks', 'schedule', 'team', 'budget', 'boq', 'engineering', 'procurement', 'site-reports', 'documents', 'approvals', 'client-portal', 'analytics', 'pdf-exports', 'security'] as const

type TabKey = (typeof tabs)[number]

export function ProjectWorkspacePage() {
  const { organization } = useOutletContext<{ organization: Organization }>()
  const { projectId } = useParams()
  const [activeTab, setActiveTab] = useState<TabKey>('overview')

  const detailQuery = useQuery({
    queryKey: ['project-detail', organization.id, projectId],
    queryFn: () => request<ProjectDetail>(`/projects/${projectId}`, {}, true, organization.id),
    enabled: Boolean(projectId),
  })

  const project = detailQuery.data?.project
  const summary = detailQuery.data?.summary
  const tasks = detailQuery.data?.tasks ?? []
  const team = detailQuery.data?.team ?? []
  const schedule = detailQuery.data?.schedule ?? []
  const budget = detailQuery.data?.budget ?? []
  const boq = detailQuery.data?.boq ?? []
  const calculations = detailQuery.data?.calculations ?? []
  const procurements = detailQuery.data?.procurements ?? []
  const siteReports = detailQuery.data?.siteReports ?? []
  const documents = detailQuery.data?.documents ?? []
  const approvals = detailQuery.data?.approvals ?? []
  const clientPortal = detailQuery.data?.clientPortal ?? []
  const analytics = detailQuery.data?.analytics ?? []
  const pdfExports = detailQuery.data?.pdfExports ?? []
  const securityChecks = detailQuery.data?.securityChecks ?? []

  const taskStatus = useMemo(() => ({
    todo: tasks.filter((task) => task.status === 'todo').length,
    progress: tasks.filter((task) => task.status === 'in-progress').length,
    review: tasks.filter((task) => task.status === 'review').length,
    done: tasks.filter((task) => task.status === 'done').length,
  }), [tasks])

  if (detailQuery.isLoading) {
    return <div className="mx-auto max-w-[1200px] animate-pulse space-y-5"><div className="h-12 w-56 rounded-xl bg-white" /><div className="h-56 rounded-xl border border-line bg-white" /><div className="grid gap-4 md:grid-cols-3"><div className="h-28 rounded-xl border border-line bg-white" /><div className="h-28 rounded-xl border border-line bg-white" /><div className="h-28 rounded-xl border border-line bg-white" /></div></div>
  }

  if (detailQuery.isError || !project || !summary) {
    return (
      <div className="mx-auto max-w-xl rounded-xl border border-red-200 bg-white p-8 text-center">
        <p className="text-sm font-semibold text-ink">Project workspace couldn’t be loaded</p>
        <p className="mt-2 text-sm text-muted">{detailQuery.error?.message ?? 'The project is not available.'}</p>
        <Link to="/projects" className="mt-4 inline-block"><Button variant="secondary">Back to projects</Button></Link>
      </div>
    )
  }

  const statusTone = project.status === 'ACTIVE' ? 'green' : project.status === 'COMPLETED' ? 'gray' : project.status === 'ON_HOLD' ? 'amber' : project.status === 'CANCELLED' ? 'red' : 'orange'

  return (
    <div className="mx-auto max-w-[1440px] space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Link to="/projects"><Button variant="secondary" size="icon" className="h-9 w-9"><ArrowLeft size={16} /></Button></Link>
          <div>
            <p className="text-xs uppercase tracking-[.14em] text-muted">Project workspace</p>
            <h1 className="mt-1 text-[28px] font-semibold tracking-[-.04em] text-ink">{project.name}</h1>
          </div>
        </div>
        <Badge tone={statusTone} className="self-start sm:self-auto">{statusLabel(project.status)}</Badge>
      </div>

      <section className="overflow-hidden rounded-2xl border border-line bg-white p-5 sm:p-6">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-[.12em] text-muted">{project.code} · {project.clientName}</p>
            <p className="mt-3 max-w-[700px] text-sm leading-6 text-muted">{project.description || 'Delivering a civil works package with an emphasis on planning control, field coordination, and cost visibility.'}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <StatPill icon={<BriefcaseBusiness size={14} />} label={project.category.replace('_', ' ')} />
            <StatPill icon={<CalendarRange size={14} />} label={`${formatDate(project.startDate)} → ${formatDate(project.expectedCompletion)}`} />
            <StatPill icon={<Gauge size={14} />} label={`${project.progress}% complete`} />
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MiniMetric title="Progress" value={`${summary.completionRate}%`} note="Completion status" icon={<Gauge size={16} />} tone="orange" />
          <MiniMetric title="Forecast" value={formatCurrency(summary.forecast)} note="Projected final cost" icon={<Wallet size={16} />} tone="blue" />
          <MiniMetric title="Quality checks" value={summary.qualityChecks.toString()} note="Passed inspections" icon={<CheckCircle2 size={16} />} tone="green" />
          <MiniMetric title="Critical path" value={summary.criticalPath} note="Current focus" icon={<Clock3 size={16} />} tone="amber" />
        </div>
      </section>

      <section className="rounded-2xl border border-line bg-white p-2">
        <div className="flex flex-wrap gap-2">
          {tabs.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`rounded-xl px-3 py-2 text-xs font-semibold capitalize transition ${activeTab === tab ? 'bg-[#f9eee8] text-brand' : 'text-muted hover:bg-canvas hover:text-ink'}`}
            >
              {tab}
            </button>
          ))}
        </div>
      </section>

      {activeTab === 'overview' && (
        <div className="grid gap-6 xl:grid-cols-[1.5fr_0.9fr]">
          <Card className="p-5 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-ink">Task overview</h2>
                <p className="mt-1 text-xs text-muted">Current package status</p>
              </div>
              <Badge tone="gray">{tasks.length} items</Badge>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-4">
              <TaskStat label="Planned" count={taskStatus.todo} tone="gray" />
              <TaskStat label="In progress" count={taskStatus.progress} tone="orange" />
              <TaskStat label="Review" count={taskStatus.review} tone="amber" />
              <TaskStat label="Done" count={taskStatus.done} tone="green" />
            </div>
            <div className="mt-6 space-y-3">
              {tasks.slice(0, 4).map((task) => (
                <div key={task.id} className="rounded-xl border border-line bg-[#fafbfa] p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-ink">{task.title}</p>
                      <p className="mt-1 text-[11px] text-muted">{task.assignee} · due {formatDate(task.dueDate)}</p>
                    </div>
                    <Badge tone={taskStatusTone(task.status)}>{task.status.replace('-', ' ')}</Badge>
                  </div>
                  <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#edf0ef]">
                    <div className="h-full rounded-full bg-brand" style={{ width: `${task.progress}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-5 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-ink">Budget at a glance</h2>
                <p className="mt-1 text-xs text-muted">Cost performance</p>
              </div>
              <Wallet size={16} className="text-muted" />
            </div>
            <div className="mt-5 space-y-4">
              {budget.slice(0, 4).map((item) => (
                <div key={item.label}>
                  <div className="mb-1 flex items-center justify-between text-[11px] text-muted">
                    <span>{item.label}</span>
                    <span className="font-semibold text-ink">{formatCurrency(item.spent)}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-[#eef0ef]">
                    <div className="h-full rounded-full bg-[#d66c3c]" style={{ width: `${Math.min(100, (item.spent / Math.max(item.planned, 1)) * 100)}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'tasks' && (
        <Card className="overflow-hidden p-0">
          <div className="flex items-center justify-between border-b border-line px-5 py-4">
            <div>
              <h2 className="text-sm font-semibold text-ink">Task register</h2>
              <p className="mt-1 text-xs text-muted">Work packages and responsibilities</p>
            </div>
            <Button size="sm">Add task</Button>
          </div>
          <div className="divide-y divide-line">
            {tasks.map((task) => (
              <div key={task.id} className="grid gap-3 px-5 py-4 md:grid-cols-[minmax(0,1.4fr)_140px_110px_110px] md:items-center">
                <div>
                  <p className="text-sm font-semibold text-ink">{task.title}</p>
                  <p className="mt-1 text-[11px] text-muted">{task.assignee} · Priority {task.priority}</p>
                </div>
                <div className="text-[11px] text-muted">{task.status.replace('-', ' ')}</div>
                <div className="text-[11px] text-muted">Due {formatDate(task.dueDate)}</div>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-full overflow-hidden rounded-full bg-[#edf0ef]">
                    <div className="h-full rounded-full bg-brand" style={{ width: `${task.progress}%` }} />
                  </div>
                  <span className="text-[10px] font-semibold text-ink">{task.progress}%</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {activeTab === 'schedule' && (
        <Card className="p-5 sm:p-6">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-ink">Project schedule</h2>
              <p className="mt-1 text-xs text-muted">Milestone timeline and lead activities</p>
            </div>
            <Badge tone="gray">Gantt view</Badge>
          </div>
          <div className="space-y-4">
            {schedule.map((item) => (
              <div key={item.id} className="grid gap-3 md:grid-cols-[180px_minmax(0,1fr)_120px] md:items-center">
                <div>
                  <p className="text-sm font-semibold text-ink">{item.name}</p>
                  <p className="mt-1 text-[11px] text-muted">{formatDate(item.startDate)} to {formatDate(item.endDate)}</p>
                </div>
                <div>
                  <div className="relative h-3 overflow-hidden rounded-full bg-[#edf0ef]">
                    <div className={`absolute inset-y-0 left-0 rounded-full ${scheduleTint(item.status)}`} style={{ width: `${milestoneWidth(item.startDate, item.endDate)}%` }} />
                  </div>
                </div>
                <div className="text-right">
                  <Badge tone={milestoneTone(item.status)}>{item.status}</Badge>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {activeTab === 'team' && (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {team.map((member) => (
            <Card key={member.id} className="p-5">
              <div className="flex items-center gap-3">
                <div className="grid h-11 w-11 place-items-center rounded-full bg-[#edf3f5] text-xs font-bold text-[#53636d]">
                  {getInitials(member.name)}
                </div>
                <div>
                  <p className="text-sm font-semibold text-ink">{member.name}</p>
                  <p className="text-[11px] text-muted">{member.role}</p>
                </div>
              </div>
              <div className="mt-4 space-y-3">
                <div>
                  <div className="mb-1 flex justify-between text-[10px] text-muted">
                    <span>Allocation</span>
                    <span className="font-semibold text-ink">{member.allocation}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-[#edf0ef]">
                    <div className="h-full rounded-full bg-green" style={{ width: `${member.allocation}%` }} />
                  </div>
                </div>
                <div className="flex items-center justify-between text-[11px] text-muted">
                  <span>Availability</span>
                  <span className="font-semibold text-ink">{member.availability}</span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {activeTab === 'budget' && (
        <Card className="overflow-hidden p-0">
          <div className="flex items-center justify-between border-b border-line px-5 py-4">
            <div>
              <h2 className="text-sm font-semibold text-ink">Cost breakdown</h2>
              <p className="mt-1 text-xs text-muted">Budget vs actual spend</p>
            </div>
            <Badge tone="green">{formatCurrency(budget.reduce((sum, item) => sum + item.spent, 0))} spent</Badge>
          </div>
          <div className="divide-y divide-line">
            {budget.map((item) => (
              <div key={item.label} className="grid gap-4 px-5 py-4 md:grid-cols-[minmax(0,1fr)_180px_180px_110px] md:items-center">
                <div>
                  <p className="text-sm font-semibold text-ink">{item.label}</p>
                  <p className="mt-1 text-[11px] text-muted">Variance {formatCurrency(item.variance)}</p>
                </div>
                <div className="text-[11px] text-muted">Planned {formatCurrency(item.planned)}</div>
                <div className="text-[11px] text-muted">Actual {formatCurrency(item.spent)}</div>
                <div className="text-right">
                  <Badge tone={item.variance >= 0 ? 'green' : 'red'}>{item.variance >= 0 ? 'On track' : 'Watch'}</Badge>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {activeTab === 'boq' && (
        <Card className="overflow-hidden p-0">
          <div className="flex items-center justify-between border-b border-line px-5 py-4">
            <div>
              <h2 className="text-sm font-semibold text-ink">Bill of quantities</h2>
              <p className="mt-1 text-xs text-muted">Estimate package for the current scope</p>
            </div>
            <Badge tone="orange">{formatCurrency(boq.reduce((sum, item) => sum + item.amount, 0))}</Badge>
          </div>
          <div className="hidden grid-cols-[minmax(0,1.5fr)_100px_110px_150px_120px] gap-3 border-b border-line bg-[#fafbfa] px-5 py-2.5 text-[10px] font-semibold uppercase tracking-[.08em] text-[#8b959c] md:grid">
            <span>Item</span>
            <span>Unit</span>
            <span>Qty</span>
            <span>Rate</span>
            <span className="text-right">Amount</span>
          </div>
          <div className="divide-y divide-line">
            {boq.map((item) => (
              <div key={item.id} className="grid gap-3 px-5 py-4 md:grid-cols-[minmax(0,1.5fr)_100px_110px_150px_120px] md:items-center">
                <div>
                  <p className="text-sm font-semibold text-ink">{item.item}</p>
                  <p className="mt-1 text-[11px] text-muted">{item.category}</p>
                </div>
                <div className="text-[11px] text-muted">{item.unit}</div>
                <div className="text-[11px] text-muted">{formatNumber(item.quantity)}</div>
                <div className="text-[11px] text-muted">{formatCurrency(item.rate)}</div>
                <div className="text-right text-sm font-semibold text-ink">{formatCurrency(item.amount)}</div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {activeTab === 'engineering' && (
        <div className="grid gap-5 xl:grid-cols-2">
          {calculations.map((calculation) => (
            <Card key={calculation.id} className="p-5 sm:p-6">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] uppercase tracking-[.12em] text-muted">Engineering check</p>
                  <h3 className="mt-2 text-lg font-semibold text-ink">{calculation.label}</h3>
                </div>
                <Badge tone="blue">{calculation.value}</Badge>
              </div>
              <p className="mt-4 text-[11px] uppercase tracking-[.12em] text-muted">Formula</p>
              <p className="mt-2 text-sm text-ink">{calculation.formula}</p>
              <p className="mt-5 text-sm leading-6 text-muted">{calculation.note}</p>
            </Card>
          ))}
        </div>
      )}

      {activeTab === 'procurement' && (
        <Card className="overflow-hidden p-0">
          <div className="flex items-center justify-between border-b border-line px-5 py-4">
            <div>
              <h2 className="text-sm font-semibold text-ink">Procurement tracker</h2>
              <p className="mt-1 text-xs text-muted">Materials and supplier order status</p>
            </div>
            <Badge tone="green">{procurements.length} active items</Badge>
          </div>
          <div className="divide-y divide-line">
            {procurements.map((item) => (
              <div key={item.id} className="grid gap-3 px-5 py-4 md:grid-cols-[minmax(0,1.4fr)_180px_140px_120px] md:items-center">
                <div>
                  <p className="text-sm font-semibold text-ink">{item.item}</p>
                  <p className="mt-1 text-[11px] text-muted">{item.supplier}</p>
                </div>
                <div className="text-[11px] text-muted">ETA {formatDate(item.eta)}</div>
                <div className="text-[11px] text-muted">{formatCurrency(item.amount)}</div>
                <Badge tone={procurementTone(item.status)} className="justify-self-start md:justify-self-end">{item.status}</Badge>
              </div>
            ))}
          </div>
        </Card>
      )}

      {activeTab === 'site-reports' && (
        <div className="grid gap-5 xl:grid-cols-2">
          {siteReports.map((report) => (
            <Card key={report.id} className="p-5 sm:p-6">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] uppercase tracking-[.12em] text-muted">{formatDate(report.date)}</p>
                  <h3 className="mt-2 text-lg font-semibold text-ink">{report.title}</h3>
                </div>
                <Badge tone={reportTone(report.status)}>{report.status}</Badge>
              </div>
              <p className="mt-4 text-sm leading-6 text-muted">{report.summary}</p>
              <div className="mt-5 flex items-center justify-between text-[11px] text-muted">
                <span>By {report.author}</span>
                <span>Weather: {report.weather}</span>
              </div>
            </Card>
          ))}
        </div>
      )}

      {activeTab === 'documents' && (
        <Card className="overflow-hidden p-0">
          <div className="flex items-center justify-between border-b border-line px-5 py-4">
            <div>
              <h2 className="text-sm font-semibold text-ink">Document register</h2>
              <p className="mt-1 text-xs text-muted">Controlled project files and approvals</p>
            </div>
            <Button size="sm">Upload document</Button>
          </div>
          <div className="divide-y divide-line">
            {documents.map((document) => (
              <div key={document.id} className="grid gap-3 px-5 py-4 md:grid-cols-[minmax(0,1.4fr)_110px_120px_140px] md:items-center">
                <div>
                  <p className="text-sm font-semibold text-ink">{document.name}</p>
                  <p className="mt-1 text-[11px] text-muted">{document.owner}</p>
                </div>
                <div className="text-[11px] text-muted">{document.type}</div>
                <div className="text-[11px] text-muted">{document.size}</div>
                <div className="text-[11px] text-muted">Updated {formatDate(document.updatedAt)}</div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {activeTab === 'approvals' && (
        <Card className="overflow-hidden p-0">
          <div className="flex items-center justify-between border-b border-line px-5 py-4">
            <div>
              <h2 className="text-sm font-semibold text-ink">Approvals</h2>
              <p className="mt-1 text-xs text-muted">Pending and completed sign-offs</p>
            </div>
            <Badge tone="amber">{approvals.filter((item) => item.status === 'Pending').length} pending</Badge>
          </div>
          <div className="divide-y divide-line">
            {approvals.map((approval) => (
              <div key={approval.id} className="grid gap-3 px-5 py-4 md:grid-cols-[minmax(0,1.3fr)_160px_130px_120px] md:items-center">
                <div>
                  <p className="text-sm font-semibold text-ink">{approval.title}</p>
                  <p className="mt-1 text-[11px] text-muted">Reviewer: {approval.reviewer}</p>
                </div>
                <div className="text-[11px] text-muted">Due {formatDate(approval.dueDate)}</div>
                <div className="text-[11px] text-muted">{approval.status}</div>
                <Badge tone={approvalTone(approval.status)} className="justify-self-start md:justify-self-end">{approval.status}</Badge>
              </div>
            ))}
          </div>
        </Card>
      )}

      {activeTab === 'client-portal' && (
        <div className="grid gap-5 xl:grid-cols-2">
          {clientPortal.map((update) => (
            <Card key={update.id} className="p-5 sm:p-6">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] uppercase tracking-[.12em] text-muted">{update.stage}</p>
                  <h3 className="mt-2 text-lg font-semibold text-ink">{update.title}</h3>
                </div>
                <Badge tone={update.visibility === 'Public' ? 'green' : 'gray'}>{update.visibility}</Badge>
              </div>
              <p className="mt-4 text-sm leading-6 text-muted">{update.summary}</p>
              <p className="mt-5 text-[11px] text-muted">Published {formatDate(update.publishedAt)}</p>
            </Card>
          ))}
        </div>
      )}

      {activeTab === 'analytics' && (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {analytics.map((metric) => (
            <Card key={metric.label} className="p-5">
              <p className="text-[10px] uppercase tracking-[.12em] text-muted">{metric.label}</p>
              <div className="mt-4 flex items-center justify-between">
                <p className="text-[26px] font-semibold tracking-[-.04em] text-ink">{metric.value}</p>
                <Badge tone={metric.tone}>{metric.delta}</Badge>
              </div>
            </Card>
          ))}
        </div>
      )}

      {activeTab === 'pdf-exports' && (
        <Card className="overflow-hidden p-0">
          <div className="flex items-center justify-between border-b border-line px-5 py-4">
            <div>
              <h2 className="text-sm font-semibold text-ink">PDF exports</h2>
              <p className="mt-1 text-xs text-muted">Generated schedules, reports, and approval packages</p>
            </div>
            <Button size="sm">Generate PDF</Button>
          </div>
          <div className="divide-y divide-line">
            {pdfExports.map((item) => (
              <div key={item.id} className="grid gap-3 px-5 py-4 md:grid-cols-[minmax(0,1.5fr)_120px_160px_120px] md:items-center">
                <div>
                  <p className="text-sm font-semibold text-ink">{item.name}</p>
                  <p className="mt-1 text-[11px] text-muted">{item.type}</p>
                </div>
                <div className="text-[11px] text-muted">{formatDate(item.generatedAt)}</div>
                <div className="text-[11px] text-muted">Ready for delivery</div>
                <Badge tone={pdfTone(item.status)} className="justify-self-start md:justify-self-end">{item.status}</Badge>
              </div>
            ))}
          </div>
        </Card>
      )}

      {activeTab === 'security' && (
        <div className="grid gap-5 xl:grid-cols-2">
          {securityChecks.map((check) => (
            <Card key={check.id} className="p-5 sm:p-6">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] uppercase tracking-[.12em] text-muted">{check.owner}</p>
                  <h3 className="mt-2 text-lg font-semibold text-ink">{check.title}</h3>
                </div>
                <Badge tone={securityTone(check.status)}>{check.status}</Badge>
              </div>
              <p className="mt-4 text-sm leading-6 text-muted">{check.detail}</p>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

function MiniMetric({ title, value, note, icon, tone }: { title: string; value: string; note: string; icon: React.ReactNode; tone: 'orange' | 'blue' | 'green' | 'amber' }) {
  const tones = {
    orange: 'bg-[#fbede6] text-brand',
    blue: 'bg-[#edf4fb] text-[#4a6d90]',
    green: 'bg-green-soft text-green',
    amber: 'bg-amber-soft text-[#9f691c]',
  }

  return (
    <div className="rounded-xl border border-line bg-[#fafbfa] p-4">
      <div className="flex items-center justify-between">
        <p className="text-[10px] uppercase tracking-[.12em] text-muted">{title}</p>
        <span className={`grid h-8 w-8 place-items-center rounded-lg ${tones[tone]}`}>{icon}</span>
      </div>
      <p className="mt-5 text-[22px] font-semibold tracking-[-.04em] text-ink">{value}</p>
      <p className="mt-1 text-[10px] text-muted">{note}</p>
    </div>
  )
}

function StatPill({ label, icon }: { label: string; icon: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-line bg-[#fafbfa] px-2.5 py-1.5 text-[11px] font-medium text-ink">
      <span className="text-brand">{icon}</span>
      {label}
    </span>
  )
}

function TaskStat({ label, count, tone }: { label: string; count: number; tone: 'gray' | 'orange' | 'amber' | 'green' }) {
  const colors = {
    gray: 'bg-[#f0f2f3] text-[#64707a]',
    orange: 'bg-[#fbede6] text-brand',
    amber: 'bg-amber-soft text-[#a3751f]',
    green: 'bg-green-soft text-green',
  }

  return (
    <div className="rounded-xl border border-line bg-[#fafbfa] p-3">
      <p className="text-[10px] uppercase tracking-[.12em] text-muted">{label}</p>
      <div className={`mt-3 inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${colors[tone]}`}>{count}</div>
    </div>
  )
}

function statusLabel(status: string) {
  return status === 'ACTIVE' ? 'In progress' : status === 'COMPLETED' ? 'Completed' : status === 'ON_HOLD' ? 'On hold' : status === 'CANCELLED' ? 'Cancelled' : 'Planning'
}

function taskStatusTone(status: string) {
  if (status === 'done') return 'green'
  if (status === 'review') return 'amber'
  if (status === 'in-progress') return 'orange'
  return 'gray'
}

function milestoneTone(status: string) {
  if (status === 'completed') return 'green'
  if (status === 'in-progress') return 'orange'
  return 'gray'
}

function scheduleTint(status: string) {
  if (status === 'completed') return 'bg-green'
  if (status === 'in-progress') return 'bg-brand'
  return 'bg-[#d2d9dd]'
}

function milestoneWidth(startDate: string, endDate: string) {
  const start = new Date(startDate).getTime()
  const end = new Date(endDate).getTime()
  const now = Date.now()
  if (Number.isNaN(start) || Number.isNaN(end) || end <= start) return 80
  const clamped = Math.min(Math.max((now - start) / (end - start), 0), 1)
  return Math.max(20, clamped * 100)
}

function getInitials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(value))
}

function formatCurrency(value: number | string) {
  return new Intl.NumberFormat('en-NP', { style: 'currency', currency: 'NPR', maximumFractionDigits: 0 }).format(Number(value))
}

function formatNumber(value: number) {
  return new Intl.NumberFormat('en-NP', { maximumFractionDigits: 2 }).format(value)
}

function procurementTone(status: string) {
  if (status === 'Approved') return 'green'
  if (status === 'Delivered') return 'blue'
  if (status === 'In transit') return 'amber'
  return 'gray'
}

function reportTone(status: string) {
  if (status === 'Good') return 'green'
  if (status === 'Caution') return 'amber'
  return 'red'
}

function approvalTone(status: string) {
  if (status === 'Approved') return 'green'
  if (status === 'Rejected') return 'red'
  return 'amber'
}

function pdfTone(status: string) {
  if (status === 'Ready') return 'green'
  if (status === 'Processing') return 'amber'
  return 'red'
}

function securityTone(status: string) {
  if (status === 'Pass') return 'green'
  if (status === 'Warning') return 'amber'
  return 'red'
}
