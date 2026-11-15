import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { Bell, ChevronDown, Command, FileText, FolderKanban, LayoutDashboard, LogOut, Menu, Moon, Plus, Search, Settings2, Sun, X } from 'lucide-react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/features/auth/AuthProvider'
import { Brand } from '@/features/auth/SignInPage'
import { request, setOrganizationId, type Organization } from '@/services/api'

export function WorkspaceLayout() {
  const { user, signOut } = useAuth()
  const location = useLocation()
  const queryClient = useQueryClient()
  const [selectedId, setSelectedId] = useState(() => localStorage.getItem('structiqx-organization') ?? '')
  const [search, setSearch] = useState('')
  const [mobileOpen, setMobileOpen] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('structiqx-theme') === 'dark')
  const [signOutError, setSignOutError] = useState('')
  const organizationsQuery = useQuery({
    queryKey: ['organizations'],
    queryFn: () => request<{ organizations: Organization[] }>('/organizations'),
  })
  const organizations = organizationsQuery.data?.organizations ?? []
  const activeOrganization = organizations.find((organization) => organization.id === selectedId) ?? organizations[0]

  useEffect(() => {
    if (activeOrganization) {
      setSelectedId(activeOrganization.id)
      localStorage.setItem('structiqx-organization', activeOrganization.id)
      setOrganizationId(activeOrganization.id)
    }
  }, [activeOrganization])

  useEffect(() => {
    setMobileOpen(false)
  }, [location.pathname])

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode)
    localStorage.setItem('structiqx-theme', darkMode ? 'dark' : 'light')
  }, [darkMode])

  const createOrganization = useMutation({
    mutationFn: (name: string) => request<{ organization: Organization }>('/organizations', {
      method: 'POST',
      body: JSON.stringify({ name }),
    }),
    onSuccess: ({ organization }) => {
      queryClient.setQueryData<{ organizations: Organization[] }>(['organizations'], (current) => ({
        organizations: [...(current?.organizations ?? []), { ...organization, role: 'ORGANIZATION_ADMIN' }],
      }))
      setSelectedId(organization.id)
      setCreateOpen(false)
    },
  })

  return (
    <div className="min-h-screen bg-canvas text-ink">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[252px] flex-col border-r border-line bg-white lg:flex">
        <div className="px-5 pb-5 pt-6"><Brand /></div>
        <div className="px-3">
          <label className="sr-only" htmlFor="organization-switcher">Organization</label>
          <div className="flex items-center gap-2 rounded-lg border border-line bg-white px-2.5 py-2">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-[#f4eee8] text-xs font-bold text-brand">{activeOrganization?.name.slice(0, 1) ?? 'S'}</span>
            <select
              id="organization-switcher"
              aria-label="Select organization"
              className="min-w-0 flex-1 appearance-none bg-transparent text-left text-xs font-semibold text-ink outline-none"
              value={activeOrganization?.id ?? ''}
              onChange={(event) => { setSelectedId(event.target.value); setOrganizationId(event.target.value) }}
              disabled={!organizations.length}
            >
              {organizationsQuery.isLoading && <option>Loading workspace…</option>}
              {!organizations.length && !organizationsQuery.isLoading && <option value="">No workspace found</option>}
              {organizations.map((organization) => <option key={organization.id} value={organization.id}>{organization.name}</option>)}
            </select>
            <ChevronDown size={14} className="shrink-0 text-muted" />
          </div>
          {organizationsQuery.isError && <p className="px-1 pt-2 text-xs text-red-600">{organizationsQuery.error.message}</p>}
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <button className="mt-2 flex w-full items-center gap-2 rounded-md px-2 py-2 text-xs font-medium text-muted transition hover:bg-canvas hover:text-ink">
                <Plus size={14} /> Add organization
              </button>
            </DialogTrigger>
            <CreateOrganizationDialog
              pending={createOrganization.isPending}
              error={createOrganization.error?.message}
              onCreate={(name) => createOrganization.mutate(name)}
            />
          </Dialog>
        </div>

        <div className="mt-8 px-3">
          <p className="px-2 pb-2 text-[10px] font-semibold uppercase tracking-[.13em] text-[#9aa2a8]">Workspace</p>
          <nav className="space-y-1">
            <NavigationLink to="/" icon={<LayoutDashboard size={17} />} label="Overview" />
            <NavigationLink to="/projects" icon={<FolderKanban size={17} />} label="Projects" />
            <NavigationLink to="/portal" icon={<Settings2 size={17} />} label="Client portal" />
            <NavigationLink to="/analytics" icon={<Bell size={17} />} label="Analytics" />
            <NavigationLink to="/reports" icon={<FileText size={17} />} label="Reports" />
          </nav>
          <p className="px-2 pb-2 pt-8 text-[10px] font-semibold uppercase tracking-[.13em] text-[#9aa2a8]">Manage</p>
          <nav className="space-y-1">
            <div className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] text-muted/70" title="Available in a later phase">
              <Settings2 size={17} /> Settings <span className="ml-auto text-[9px] uppercase tracking-wide">Soon</span>
            </div>
          </nav>
        </div>

        <div className="mt-auto border-t border-line p-3">
          <details className="group relative">
            <summary className="flex cursor-pointer list-none items-center gap-2.5 rounded-lg px-2 py-2 transition hover:bg-canvas">
              <Avatar name={user?.name ?? 'Member'} />
              <span className="min-w-0 flex-1 text-left">
                <span className="block truncate text-xs font-semibold text-ink">{user?.name}</span>
                <span className="block truncate text-[10px] text-muted">{user?.email}</span>
              </span>
              <ChevronDown size={14} className="text-muted transition group-open:rotate-180" />
            </summary>
            <div className="absolute bottom-full left-0 right-0 mb-2 rounded-lg border border-line bg-white p-1 shadow-pop">
              {signOutError && <p role="alert" className="px-3 py-2 text-[10px] text-red-600">{signOutError}</p>}
              <button onClick={() => void signOut().catch((error: unknown) => setSignOutError(error instanceof Error ? error.message : 'Could not sign out.'))} className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-xs text-muted hover:bg-canvas hover:text-ink">
                <LogOut size={14} /> Sign out
              </button>
            </div>
          </details>
        </div>
      </aside>

      <div className="lg:ml-[252px]">
        <header className="sticky top-0 z-20 flex h-[68px] items-center justify-between border-b border-line bg-white/95 px-4 backdrop-blur sm:px-7 lg:px-9">
          <div className="flex min-w-0 items-center gap-3">
            <Button className="lg:hidden" size="icon" variant="ghost" aria-label="Open menu" onClick={() => setMobileOpen(!mobileOpen)}>
              {mobileOpen ? <X size={18} /> : <Menu size={18} />}
            </Button>
            <div className="hidden items-center gap-2 text-xs text-muted sm:flex">
              <span>{activeOrganization?.name ?? 'Workspace'}</span><span className="text-[#c7cdd0]">/</span>
              <span className="font-medium text-ink">{location.pathname === '/projects' ? 'Projects' : location.pathname === '/portal' ? 'Client portal' : location.pathname === '/analytics' ? 'Analytics' : location.pathname === '/reports' ? 'Reports' : 'Overview'}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <label className="hidden h-9 w-[220px] items-center gap-2 rounded-lg border border-line bg-[#fbfcfb] px-3 text-muted md:flex lg:w-[260px]">
              <Search size={15} />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                aria-label="Search projects"
                placeholder="Search projects…"
                className="min-w-0 flex-1 bg-transparent text-xs text-ink outline-none placeholder:text-muted/70"
              />
              <kbd className="rounded border border-line bg-white px-1 text-[9px]">⌘ K</kbd>
            </label>
            <div className="relative">
              <details className="group">
                <summary aria-label="Notifications" className="grid h-9 w-9 cursor-pointer list-none place-items-center rounded-lg text-muted hover:bg-canvas hover:text-ink">
                  <Bell size={17} />
                </summary>
                <div className="absolute right-0 top-11 z-30 w-72 rounded-xl border border-line bg-white p-4 shadow-pop">
                  <p className="text-sm font-semibold">Notifications</p>
                  <p className="mt-1 text-xs leading-5 text-muted">Workspace activity appears on the overview. Approval notifications are planned for a later phase.</p>
                </div>
              </details>
            </div>
            <Button
              variant="ghost"
              size="icon"
              aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
              title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
              onClick={() => setDarkMode((current) => !current)}
            >
              {darkMode ? <Sun size={17} /> : <Moon size={17} />}
            </Button>
            <div className="hidden h-6 w-px bg-line sm:block" />
            <Avatar name={user?.name ?? 'Member'} className="sm:hidden" />
            <span className="hidden text-xs font-medium text-ink sm:block">{user?.name}</span>
          </div>
        </header>

        {mobileOpen && (
          <div className="fixed inset-x-0 top-[68px] z-30 border-b border-line bg-white p-3 shadow-pop lg:hidden">
            <div className="mb-3 flex items-center gap-2 px-2 text-xs text-muted"><Command size={14} /> {activeOrganization?.name}</div>
            <NavigationLink to="/" icon={<LayoutDashboard size={17} />} label="Overview" />
            <NavigationLink to="/projects" icon={<FolderKanban size={17} />} label="Projects" />
            <NavigationLink to="/portal" icon={<Settings2 size={17} />} label="Client portal" />
            <NavigationLink to="/analytics" icon={<Bell size={17} />} label="Analytics" />
            <NavigationLink to="/reports" icon={<FileText size={17} />} label="Reports" />
          </div>
        )}

        <main className="px-4 py-7 sm:px-7 lg:px-9 lg:py-9">
          {organizationsQuery.isLoading ? <div className="h-56 animate-pulse rounded-xl border border-line bg-white" /> :
            organizationsQuery.isError ? <div className="mx-auto max-w-xl rounded-xl border border-red-200 bg-white p-7 text-center"><p className="text-sm font-semibold">Couldn’t load your organizations</p><p className="mt-2 text-sm text-muted">{organizationsQuery.error.message}</p><Button variant="secondary" className="mt-4" onClick={() => void organizationsQuery.refetch()}>Try again</Button></div> :
              activeOrganization ? <Outlet context={{ search, organization: activeOrganization }} /> :
                <div className="mx-auto max-w-xl rounded-xl border border-line bg-white p-8 text-center"><h1 className="text-lg font-semibold">Create your first workspace</h1><p className="mt-2 text-sm text-muted">An organization keeps projects and teams organized in one place.</p><Button className="mt-5" onClick={() => setCreateOpen(true)}><Plus size={15} /> Create organization</Button></div>}
        </main>
      </div>
    </div>
  )
}

function NavigationLink({ to, icon, label }: { to: string; icon: React.ReactNode; label: string }) {
  return (
    <NavLink
      to={to}
      end={to === '/'}
      className={({ isActive }) => `flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-medium transition ${isActive ? 'bg-[#f9eee8] text-brand' : 'text-[#68737d] hover:bg-canvas hover:text-ink'}`}
    >
      {icon}{label}
    </NavLink>
  )
}

function Avatar({ name, className = '' }: { name: string; className?: string }) {
  const initials = name.split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase()
  return <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#e7edf0] text-[10px] font-bold text-[#53636d] ${className}`}>{initials}</span>
}

function CreateOrganizationDialog({ pending, error, onCreate }: { pending: boolean; error?: string; onCreate: (name: string) => void }) {
  const [name, setName] = useState('')
  return (
    <DialogContent>
      <DialogTitle className="text-lg font-semibold">Create an organization</DialogTitle>
      <DialogDescription className="mt-1 text-sm text-muted">Set up a separate workspace for another company or team.</DialogDescription>
      <form className="mt-5 space-y-4" onSubmit={(event) => { event.preventDefault(); onCreate(name.trim()) }}>
        <label className="block space-y-1.5 text-sm font-medium">Organization name<Input required minLength={2} maxLength={100} value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. Himalayan Engineering" /></label>
        {error && <p role="alert" className="text-xs text-red-600">{error}</p>}
        <Button type="submit" className="w-full" disabled={pending}>{pending ? 'Creating…' : 'Create organization'}</Button>
      </form>
    </DialogContent>
  )
}
