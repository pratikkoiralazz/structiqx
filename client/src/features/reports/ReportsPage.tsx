import { Download, FileText, Printer, TrendingUp } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

const reportSections = [
  { title: 'Project status', value: '92%', note: 'Overall delivery health' },
  { title: 'Budget health', value: '96%', note: 'Budget adherence vs plan' },
  { title: 'Quality score', value: '4.8/5', note: 'Inspection and QA review' },
  { title: 'Safety index', value: '97%', note: 'Site incident control' },
]

const activities = [
  { label: 'Structural works', value: '72% complete', detail: 'Progress remains ahead of the baseline plan.' },
  { label: 'Reinforcement delivery', value: 'Delayed by 4 days', detail: 'Material lead times have been revised and re-sequenced.' },
  { label: 'Progress approvals', value: '6 pending', detail: 'Three sign-offs are expected before the next site gate.' },
]

const exportItems = [
  { name: 'Monthly project summary', type: 'Executive report', date: '2026-11-15' },
  { name: 'Cost and schedule review', type: 'PMO brief', date: '2026-11-09' },
  { name: 'Quality and safety pack', type: 'Site compliance', date: '2026-11-03' },
]

export function ReportsPage() {
  return (
    <div className="print-report mx-auto max-w-[1440px] space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-medium text-muted">Workspace / Reports</p>
          <h1 className="mt-1.5 text-[28px] font-semibold tracking-[-.04em] text-ink">Reports & exports</h1>
          <p className="mt-1 text-sm text-muted">Generate concise summary packs for leadership, clients, and project controls.</p>
        </div>
        <div className="flex flex-wrap gap-2 print:hidden">
          <Button variant="secondary" onClick={() => window.print()}><Printer size={15} /> Print/PDF</Button>
          <Button><Download size={15} /> Export pack</Button>
        </div>
      </div>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {reportSections.map((item) => (
          <Card key={item.title} className="p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <p className="text-[10px] uppercase tracking-[.12em] text-muted">{item.title}</p>
              <TrendingUp className="text-brand" size={15} />
            </div>
            <p className="mt-4 text-[26px] font-semibold tracking-[-.04em] text-ink">{item.value}</p>
            <p className="mt-1 text-[11px] text-muted">{item.note}</p>
          </Card>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,.8fr)]">
        <Card className="overflow-hidden p-0">
          <div className="border-b border-line px-5 py-4">
            <h2 className="text-sm font-semibold text-ink">Project highlights</h2>
            <p className="mt-1 text-xs text-muted">Current status summary aligned to the leadership brief</p>
          </div>
          <div className="divide-y divide-line">
            {activities.map((activity) => (
              <div key={activity.label} className="grid gap-3 px-5 py-4 md:grid-cols-[minmax(0,1fr)_180px] md:items-center">
                <div>
                  <p className="text-sm font-semibold text-ink">{activity.label}</p>
                  <p className="mt-1 text-[11px] text-muted">{activity.detail}</p>
                </div>
                <div className="text-right">
                  <Badge tone={activity.value.includes('Delayed') ? 'amber' : activity.value.includes('pending') ? 'gray' : 'green'}>{activity.value}</Badge>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-ink">Summary note</h2>
              <p className="mt-1 text-xs text-muted">Leadership callout</p>
            </div>
            <FileText className="text-muted" size={16} />
          </div>
          <p className="mt-5 text-sm leading-7 text-muted">
            Site execution remains stable and within the approved delivery plan. Current focus is on reducing reinforcement lead-time risk, accelerating sign-off cycles, and maintaining budget discipline through the next works package.
          </p>
        </Card>
      </section>

      <Card className="overflow-hidden p-0">
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <div>
            <h2 className="text-sm font-semibold text-ink">Export library</h2>
            <p className="mt-1 text-xs text-muted">Prepared reports available for distribution</p>
          </div>
          <Badge tone="gray">3 files</Badge>
        </div>
        <div className="divide-y divide-line">
          {exportItems.map((item) => (
            <div key={item.name} className="grid gap-3 px-5 py-4 md:grid-cols-[minmax(0,1.4fr)_160px_130px_120px] md:items-center">
              <div>
                <p className="text-sm font-semibold text-ink">{item.name}</p>
                <p className="mt-1 text-[11px] text-muted">{item.type}</p>
              </div>
              <div className="text-[11px] text-muted">{item.date}</div>
              <div className="text-[11px] text-muted">Ready</div>
              <Button variant="secondary" size="sm">Download</Button>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
