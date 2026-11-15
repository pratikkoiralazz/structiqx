import { FileText, MessageSquareText, ShieldCheck, TrendingUp } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

const updates = [
  { title: 'Quarterly progress review', stage: 'Progress update', summary: 'The site team completed 72% of the structural works phase and remains on the revised schedule.', date: '2026-11-12', visibility: 'Public' },
  { title: 'Design clarification package', stage: 'Design coordination', summary: 'Latest revision set for retaining wall layout and drainage alignment has been shared with the client team.', date: '2026-11-07', visibility: 'Private' },
  { title: 'Inspection milestone approved', stage: 'Quality signoff', summary: 'The formwork inspection passed and the next concrete pour is scheduled for the coming week.', date: '2026-11-01', visibility: 'Public' },
]

const documents = [
  { name: 'Monthly owner report', type: 'PDF', owner: 'PMO', updated: '2026-11-09' },
  { name: 'Structural drawing set', type: 'DWG', owner: 'Design team', updated: '2026-11-04' },
  { name: 'Contract change log', type: 'DOCX', owner: 'Commercial', updated: '2026-10-29' },
]

const decisions = [
  { topic: 'Drainage staging', status: 'Approved', owner: 'Client review board' },
  { topic: 'Procurement variance', status: 'Pending', owner: 'Commercial lead' },
  { topic: 'Temporary works draft', status: 'Under review', owner: 'Site team' },
]

export function ClientPortalPage() {
  return (
    <div className="mx-auto max-w-[1440px] space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-medium text-muted">Workspace / Client portal</p>
          <h1 className="mt-1.5 text-[28px] font-semibold tracking-[-.04em] text-ink">Client portal</h1>
          <p className="mt-1 text-sm text-muted">Keep project stakeholders informed with timely updates, approvals, and shared delivery records.</p>
        </div>
        <Button>Publish update</Button>
      </div>

      <section className="grid gap-4 md:grid-cols-3">
        <Card className="p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-[.12em] text-muted">Portfolio visibility</p>
            <TrendingUp className="text-brand" size={16} />
          </div>
          <p className="mt-4 text-[26px] font-semibold tracking-[-.04em] text-ink">94%</p>
          <p className="mt-1 text-[11px] text-muted">Stakeholder coverage across active portals</p>
        </Card>
        <Card className="p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-[.12em] text-muted">Open approvals</p>
            <ShieldCheck className="text-green" size={16} />
          </div>
          <p className="mt-4 text-[26px] font-semibold tracking-[-.04em] text-ink">6</p>
          <p className="mt-1 text-[11px] text-muted">Items waiting for client sign-off</p>
        </Card>
        <Card className="p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-[.12em] text-muted">Engagement score</p>
            <MessageSquareText className="text-[#537393]" size={16} />
          </div>
          <p className="mt-4 text-[26px] font-semibold tracking-[-.04em] text-ink">4.8/5</p>
          <p className="mt-1 text-[11px] text-muted">Average feedback rating in the past 30 days</p>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(320px,.9fr)]">
        <Card className="overflow-hidden p-0">
          <div className="flex items-center justify-between border-b border-line px-5 py-4">
            <div>
              <h2 className="text-sm font-semibold text-ink">Portal updates</h2>
              <p className="mt-1 text-xs text-muted">Recent notes published to client-facing channels</p>
            </div>
            <Badge tone="gray">3 published</Badge>
          </div>
          <div className="divide-y divide-line">
            {updates.map((update) => (
              <div key={update.title} className="px-5 py-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-[10px] uppercase tracking-[.12em] text-muted">{update.stage}</p>
                    <h3 className="mt-2 text-base font-semibold text-ink">{update.title}</h3>
                  </div>
                  <Badge tone={update.visibility === 'Public' ? 'green' : 'gray'}>{update.visibility}</Badge>
                </div>
                <p className="mt-3 text-sm leading-6 text-muted">{update.summary}</p>
                <p className="mt-3 text-[11px] text-muted">Published {formatDate(update.date)}</p>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-ink">Decision log</h2>
              <p className="mt-1 text-xs text-muted">Client actions and approvals</p>
            </div>
            <FileText size={16} className="text-muted" />
          </div>
          <div className="mt-5 space-y-4">
            {decisions.map((item) => (
              <div key={item.topic} className="rounded-xl border border-line bg-[#fafbfa] p-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-ink">{item.topic}</p>
                  <Badge tone={statusTone(item.status)}>{item.status}</Badge>
                </div>
                <p className="mt-2 text-[11px] text-muted">Owner: {item.owner}</p>
              </div>
            ))}
          </div>
        </Card>
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.2fr)_minmax(300px,.8fr)]">
        <Card className="overflow-hidden p-0">
          <div className="border-b border-line px-5 py-4">
            <h2 className="text-sm font-semibold text-ink">Shared documents</h2>
            <p className="mt-1 text-xs text-muted">Client-facing packages and latest distribution files</p>
          </div>
          <div className="divide-y divide-line">
            {documents.map((doc) => (
              <div key={doc.name} className="grid gap-3 px-5 py-4 md:grid-cols-[minmax(0,1.25fr)_100px_130px_120px] md:items-center">
                <div>
                  <p className="text-sm font-semibold text-ink">{doc.name}</p>
                  <p className="mt-1 text-[11px] text-muted">Owner: {doc.owner}</p>
                </div>
                <div className="text-[11px] text-muted">{doc.type}</div>
                <div className="text-[11px] text-muted">Updated {formatDate(doc.updated)}</div>
                <Button variant="secondary" size="sm">Open</Button>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5 sm:p-6">
          <h2 className="text-sm font-semibold text-ink">Client communication</h2>
          <p className="mt-1 text-xs text-muted">Latest engagement signals</p>
          <div className="mt-5 space-y-4">
            <div className="rounded-xl bg-[#f7f8f6] p-3">
              <p className="text-[10px] uppercase tracking-[.12em] text-muted">Response time</p>
              <p className="mt-2 text-[22px] font-semibold tracking-[-.04em] text-ink">1.4 days</p>
            </div>
            <div className="rounded-xl bg-[#f7f8f6] p-3">
              <p className="text-[10px] uppercase tracking-[.12em] text-muted">Open issues</p>
              <p className="mt-2 text-[22px] font-semibold tracking-[-.04em] text-ink">4</p>
            </div>
            <div className="rounded-xl bg-[#f7f8f6] p-3">
              <p className="text-[10px] uppercase tracking-[.12em] text-muted">Resolution rate</p>
              <p className="mt-2 text-[22px] font-semibold tracking-[-.04em] text-ink">87%</p>
            </div>
          </div>
        </Card>
      </section>
    </div>
  )
}

function statusTone(status: string) {
  if (status === 'Approved') return 'green'
  if (status === 'Pending') return 'amber'
  return 'gray'
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(value))
}
