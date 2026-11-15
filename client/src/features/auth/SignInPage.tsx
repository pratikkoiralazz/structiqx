import { useState, type FormEvent } from 'react'
import { ArrowRight, Building2, CircleCheck, Layers3, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuth } from './AuthProvider'

export function SignInPage() {
  const { signIn, register } = useAuth()
  const [registering, setRegistering] = useState(false)
  const [email, setEmail] = useState('demo@structiqx.dev')
  const [password, setPassword] = useState('StructiqxDemo2025!')
  const [name, setName] = useState('')
  const [organizationName, setOrganizationName] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      if (registering) await register(name, email, password, organizationName)
      else await signIn(email, password)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to sign in.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="grid min-h-screen bg-white lg:grid-cols-[1.05fr_.95fr]">
      <section className="relative hidden overflow-hidden bg-[#202a35] px-12 py-10 text-white lg:flex lg:flex-col lg:justify-between xl:px-20">
        <div className="absolute -right-36 -top-32 h-[540px] w-[540px] rounded-full border border-white/10" />
        <div className="absolute -right-8 -top-4 h-[330px] w-[330px] rounded-full border border-white/10" />
        <div className="absolute bottom-[-130px] left-[-90px] h-[470px] w-[470px] rounded-full bg-[#d66c3c]/15 blur-3xl" />
        <Brand light />
        <div className="relative z-10 max-w-xl">
          <p className="mb-5 text-xs font-semibold uppercase tracking-[.2em] text-[#f0a47e]">Built for the work that builds everything</p>
          <h1 className="max-w-lg text-5xl font-semibold leading-[1.12] tracking-[-.045em] xl:text-[60px]">A clearer view of every project.</h1>
          <p className="mt-6 max-w-md text-base leading-7 text-white/65">Bring your projects, teams and site operations into one calm, connected workspace.</p>
          <div className="mt-10 space-y-4">
            {['Project delivery at a glance', 'Budgets connected to the field', 'Every decision, in one place'].map((item) => (
              <div key={item} className="flex items-center gap-3 text-sm text-white/80">
                <CircleCheck size={17} className="text-[#e88a60]" />
                {item}
              </div>
            ))}
          </div>
        </div>
        <p className="relative z-10 text-xs text-white/45">STRUCTIQX · CIVIL ENGINEERING OPERATING SYSTEM</p>
        <div className="absolute bottom-0 right-0 h-[44%] w-[58%] opacity-20">
          <svg viewBox="0 0 520 340" fill="none" className="h-full w-full" aria-hidden="true">
            <path d="M58 340V162L260 48l202 114v178M58 162h404M132 340V204h82v136m92 0V204h82v136M260 48V0" stroke="white" strokeWidth="2" />
            <path d="M0 340h520M90 164v-38l170-96 170 96v38" stroke="white" strokeWidth="1" strokeDasharray="5 7" />
          </svg>
        </div>
      </section>

      <section className="flex items-center justify-center px-6 py-10 sm:px-12">
        <div className="w-full max-w-[390px]">
          <div className="mb-12 lg:hidden"><Brand /></div>
          <div className="mb-8">
            <p className="text-sm font-medium text-brand">{registering ? 'Get started' : 'Welcome back'}</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-ink">{registering ? 'Create your workspace' : 'Sign in to StructiqX'}</h2>
            <p className="mt-2 text-sm text-muted">{registering ? 'Set up your organization to get started.' : 'Enter your details to access your workspace.'}</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            {registering && <>
              <Field label="Your name"><Input required autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} placeholder="Aarav Sharma" /></Field>
              <Field label="Organization name"><Input required value={organizationName} onChange={(event) => setOrganizationName(event.target.value)} placeholder="Himalayan Engineering" /></Field>
            </>}
            <Field label="Work email"><Input required type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@company.com" /></Field>
            <Field label="Password"><Input required minLength={registering ? 12 : 8} type="password" autoComplete={registering ? 'new-password' : 'current-password'} value={password} onChange={(event) => setPassword(event.target.value)} /></Field>
            {error && <p role="alert" className="rounded-lg bg-red-soft px-3 py-2 text-sm text-[#a43c34]">{error}</p>}
            <Button className="mt-2 w-full" disabled={submitting}>
              {submitting ? 'Please wait…' : registering ? 'Create workspace' : 'Sign in'}
              {!submitting && <ArrowRight size={16} />}
            </Button>
          </form>
          {!registering && (
            <div className="mt-5 rounded-xl border border-[#f1e4dc] bg-[#fdf8f5] p-4">
              <p className="text-xs font-semibold text-ink">Explore the development workspace</p>
              <p className="mt-1 text-xs leading-5 text-muted">Use the prefilled demo account to explore sample projects and reporting.</p>
            </div>
          )}
          <p className="mt-7 text-center text-sm text-muted">
            {registering ? 'Already have a workspace?' : 'New to StructiqX?'}{' '}
            <button type="button" className="font-semibold text-brand hover:text-brand-dark" onClick={() => { setRegistering(!registering); setError('') }}>
              {registering ? 'Sign in' : 'Create a workspace'}
            </button>
          </p>
          <div className="mt-12 flex items-center justify-center gap-5 text-[11px] text-muted/80">
            <span className="flex items-center gap-1"><ShieldCheck size={13} /> Secure access</span>
            <span className="flex items-center gap-1"><Layers3 size={13} /> Built for teams</span>
          </div>
        </div>
      </section>
    </main>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block space-y-1.5 text-sm font-medium text-ink">{label}{children}</label>
}

export function Brand({ light = false }: { light?: boolean }) {
  return (
    <div className={`relative z-10 flex items-center gap-2.5 ${light ? 'text-white' : 'text-ink'}`}>
      <span className="grid h-9 w-9 place-items-center rounded-[10px] bg-brand text-white shadow-sm"><Building2 size={19} strokeWidth={2.2} /></span>
      <span className="text-[17px] font-semibold tracking-[-.04em]">structiq<span className={light ? 'text-[#efa27c]' : 'text-brand'}>x</span></span>
    </div>
  )
}
