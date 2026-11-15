import { Activity, BarChart3, ArrowUpRight, ArrowDownRight } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'

const metrics = [
  { label: 'Schedule health', value: '92%', delta: '+5%', tone: 'green' },
  { label: 'Cost variance', value: '-4.8%', delta: '-1.1%', tone: 'amber' },
  { label: 'Safety performance', value: '96%', delta: '+2%', tone: 'green' },
  { label: 'Revenue realization', value: '76%', delta: '+8%', tone: 'blue' },
]

const trendBars = [55, 62, 68, 71, 76, 82, 88]

const projectHealth = [
  { project: 'East Valley Tower', score: 88, risk: 'Low' },
  { project: 'Civic Roads Package', score: 76, risk: 'Medium' },
  { project: 'Waterline Upgrade', score: 63, risk: 'Medium' },
  { project: 'Bridge Rehab', score: 92, risk: 'Low' },
]

export function AnalyticsPage() {
  return (
    <div className="mx-auto max-w-[1440px] space-y-6">
      <div>
        <p className="text-xs font-medium text-muted">Workspace / Analytics</p>
        <h1 className="mt-1.5 text-[28px] font-semibold tracking-[-.04em] text-ink">Analytics</h1>
        <p className="mt-1 text-sm text-muted">Operational and portfolio performance across delivery, cost, and quality.</p>
      </div>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <Card key={metric.label} className="p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <p className="text-[10px] uppercase tracking-[.12em] text-muted">{metric.label}</p>
              <span className="rounded-full p-1.5 bg-[#f6f7f7] text-ink">
                {metric.delta.startsWith('+') ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
              </span>
            </div>
            <p className="mt-4 text-[26px] font-semibold tracking-[-.04em] text-ink">{metric.value}</p>
            <p className="mt-2 text-[11px] text-muted">{metric.delta} vs prior period</p>
            <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-[#edf0ef]">
              <div className="h-full rounded-full bg-brand" style={{ width: `${Math.min(100, Number.parseFloat(metric.value) || 50)}%` }} />
            </div>
          </Card>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(300px,.9fr)]">
        <Card className="p-5 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-ink">Portfolio trend</h2>
              <p className="mt-1 text-xs text-muted">Execution momentum across the last 7 months</p>
            </div>
            <BarChart3 className="text-muted" size={16} />
          </div>
          <div className="mt-7 flex h-52 items-end gap-3">
            {trendBars.map((bar, index) => (
              <div key={`${bar}-${index}`} className="flex flex-1 flex-col items-center justify-end gap-2">
                <div className="w-full rounded-t-xl bg-[#f2e2d7]" style={{ height: `${bar}%` }} />
                <span className="text-[10px] text-muted">{['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'][index]}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-ink">Portfolio insight</h2>
              <p className="mt-1 text-xs text-muted">Key operational observations</p>
            </div>
            <Activity className="text-muted" size={16} />
          </div>
          <div className="mt-6 space-y-4">
            <div className="rounded-xl bg-[#f8f9f8] p-3">
              <p className="text-[10px] uppercase tracking-[.12em] text-muted">Strongest area</p>
              <p className="mt-2 text-sm font-semibold text-ink">Structural workfront is performing above plan by 7%.</p>
            </div>
            <div className="rounded-xl bg-[#f8f9f8] p-3">
              <p className="text-[10px] uppercase tracking-[.12em] text-muted">Primary risk</p>
              <p className="mt-2 text-sm font-semibold text-ink">Reinforcement deliveries remain the main schedule watch point.</p>
            </div>
            <div className="rounded-xl bg-[#f8f9f8] p-3">
              <p className="text-[10px] uppercase tracking-[.12em] text-muted">Recovery opportunity</p>
              <p className="mt-2 text-sm font-semibold text-ink">Procurement lead times can recover 4.2 days by moving supply commitments earlier.</p>
            </div>
          </div>
        </Card>
      </section>

      <Card className="overflow-hidden p-0">
        <div className="border-b border-line px-5 py-4">
          <h2 className="text-sm font-semibold text-ink">Project health score</h2>
          <p className="mt-1 text-xs text-muted">Delivery and quality status by active project</p>
        </div>
        <div className="divide-y divide-line">
          {projectHealth.map((project) => (
            <div key={project.project} className="grid gap-3 px-5 py-4 md:grid-cols-[minmax(0,1.25fr)_160px_120px] md:items-center">
              <div>
                <p className="text-sm font-semibold text-ink">{project.project}</p>
              </div>
              <div>
                <div className="mb-1 flex justify-between text-[10px] text-muted">
                  <span>Health</span>
                  <span className="font-semibold text-ink">{project.score}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-[#edf0ef]">
                  <div className="h-full rounded-full bg-brand" style={{ width: `${project.score}%` }} />
                </div>
              </div>
              <div className="text-right"><Badge tone={project.risk === 'Low' ? 'green' : 'amber'}>{project.risk}</Badge></div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
