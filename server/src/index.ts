import bcrypt from 'bcryptjs'
import { randomUUID } from 'node:crypto'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import express from 'express'
import { rateLimit } from 'express-rate-limit'
import helmet from 'helmet'
import { z } from 'zod'
import { config } from './config.js'
import {
  createSession,
  requireAuth,
  requireOrganizationAdmin,
  requireOrganizationMember,
  requireInternalMember,
  requireProjectManager,
  revokeSession,
  rotateSession,
} from './auth.js'
import { prisma } from './db.js'

const app = express()
app.set('trust proxy', 1)
app.use(helmet())
app.use(cors({ origin: config.CLIENT_ORIGIN, credentials: true }))
app.use(express.json({ limit: '1mb' }))
app.use(cookieParser())
app.use('/api/auth', rateLimit({ windowMs: 15 * 60 * 1000, limit: 30, standardHeaders: true }))

const asyncRoute = (handler: express.RequestHandler): express.RequestHandler =>
  (request, response, next) => Promise.resolve(handler(request, response, next)).catch(next)

const loginSchema = z.object({
  email: z.string().email().transform((value) => value.toLowerCase()),
  password: z.string().min(8).max(128),
})
const projectSchema = z.object({
  code: z.string().trim().min(2).max(24).regex(/^[A-Za-z0-9-]+$/),
  name: z.string().trim().min(3).max(120),
  clientName: z.string().trim().min(2).max(120),
  category: z.enum(['RESIDENTIAL', 'COMMERCIAL', 'ROADS', 'BRIDGES', 'DRAINAGE', 'WATER_SUPPLY', 'IRRIGATION', 'OTHER']),
  description: z.string().trim().max(2000).optional().default(''),
  location: z.string().trim().min(2).max(180),
  contractValue: z.number().finite().min(0).max(999999999999),
  plannedBudget: z.number().finite().min(0).max(999999999999),
  startDate: z.coerce.date(),
  expectedCompletion: z.coerce.date(),
}).refine((value) => value.expectedCompletion > value.startDate, {
  message: 'Expected completion must be after the start date.',
  path: ['expectedCompletion'],
})

app.get('/api/health', (_request, response) => response.json({ status: 'ok' }))

app.post('/api/auth/login', asyncRoute(async (request, response) => {
  const input = loginSchema.parse(request.body)
  const user = await prisma.user.findUnique({ where: { email: input.email } })
  if (!user || !(await bcrypt.compare(input.password, user.passwordHash))) {
    response.status(401).json({ message: 'Email or password is incorrect.' })
    return
  }
  const accessToken = await createSession(user, response)
  response.json({ accessToken, user: { id: user.id, name: user.name, email: user.email } })
}))

app.post('/api/auth/register', asyncRoute(async (request, response) => {
  const input = z.object({
    name: z.string().trim().min(2).max(100),
    email: z.string().email().transform((value) => value.toLowerCase()),
    password: z.string().min(12).max(128),
    organizationName: z.string().trim().min(2).max(100),
  }).parse(request.body)
  const slugBase = input.organizationName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  const passwordHash = await bcrypt.hash(input.password, 12)
  const user = await prisma.$transaction(async (transaction) => {
    const createdUser = await transaction.user.create({
      data: { name: input.name, email: input.email, passwordHash },
    })
    await transaction.organization.create({
      data: {
        name: input.organizationName,
        slug: `${slugBase}-${createdUser.id.slice(0, 8)}`,
        members: { create: { userId: createdUser.id, role: 'ORGANIZATION_ADMIN' } },
      },
    })
    return createdUser
  })
  const accessToken = await createSession(user, response)
  response.status(201).json({ accessToken, user: { id: user.id, name: user.name, email: user.email } })
}))

app.post('/api/auth/refresh', asyncRoute(async (request, response) => {
  const accessToken = await rotateSession(request, response)
  if (!accessToken) {
    response.status(401).json({ message: 'Your session has expired. Please sign in again.' })
    return
  }
  response.json({ accessToken })
}))

app.post('/api/auth/logout', asyncRoute(async (request, response) => {
  await revokeSession(request, response)
  response.status(204).end()
}))

app.get('/api/auth/me', requireAuth, asyncRoute(async (request, response) => {
  const user = await prisma.user.findUnique({
    where: { id: request.user!.sub },
    select: { id: true, name: true, email: true },
  })
  if (!user) {
    response.status(404).json({ message: 'Account not found.' })
    return
  }
  response.json({ user })
}))

app.get('/api/organizations', requireAuth, asyncRoute(async (request, response) => {
  const organizations = await prisma.organization.findMany({
    where: { members: { some: { userId: request.user!.sub } } },
    select: { id: true, name: true, slug: true, currency: true, members: { where: { userId: request.user!.sub }, select: { role: true } } },
    orderBy: { name: 'asc' },
  })
  response.json({ organizations: organizations.map(({ members, ...organization }) => ({ ...organization, role: members[0]?.role })) })
}))

app.post('/api/organizations', requireAuth, asyncRoute(async (request, response) => {
  const input = z.object({ name: z.string().trim().min(2).max(100) }).parse(request.body)
  const slug = `${input.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}-${randomUUID().slice(0, 8)}`
  const organization = await prisma.organization.create({
    data: {
      name: input.name,
      slug,
      members: { create: { userId: request.user!.sub, role: 'ORGANIZATION_ADMIN' } },
    },
    select: { id: true, name: true, slug: true, currency: true },
  })
  response.status(201).json({ organization })
}))

const organizationRouter = express.Router()
organizationRouter.get('/dashboard', requireAuth, requireOrganizationMember, requireInternalMember, asyncRoute(async (_request, response) => {
  const organizationId = response.locals.organizationId as string
  const [projects, activities] = await Promise.all([
    prisma.project.findMany({
      where: { organizationId, deletedAt: null },
      select: { id: true, name: true, code: true, clientName: true, category: true, location: true, contractValue: true, plannedBudget: true, actualExpenditure: true, progress: true, status: true, startDate: true, expectedCompletion: true, manager: { select: { name: true } } },
      orderBy: { updatedAt: 'desc' },
    }),
    prisma.activityLog.findMany({
      where: { organizationId },
      select: { id: true, action: true, description: true, createdAt: true, user: { select: { name: true } }, project: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
      take: 6,
    }),
  ])
  const active = projects.filter((project) => project.status === 'ACTIVE')
  const delayed = projects.filter((project) => !['COMPLETED', 'CANCELLED'].includes(project.status) && project.expectedCompletion < new Date())
  const totals = projects.reduce((aggregate, project) => ({
    plannedBudget: aggregate.plannedBudget + Number(project.plannedBudget),
    actualExpenditure: aggregate.actualExpenditure + Number(project.actualExpenditure),
  }), { plannedBudget: 0, actualExpenditure: 0 })
  const totalProjects = projects.length
  response.json({
    metrics: {
      totalProjects,
      activeProjects: active.length,
      delayedProjects: delayed.length,
      plannedBudget: totals.plannedBudget,
      actualExpenditure: totals.actualExpenditure,
      averageProgress: projects.length ? Math.round(projects.reduce((sum, project) => sum + project.progress, 0) / projects.length) : 0,
    },
    projects: projects.slice(0, 5),
    activities,
  })
}))

organizationRouter.get('/projects', requireAuth, requireOrganizationMember, requireInternalMember, asyncRoute(async (request, response) => {
  const organizationId = response.locals.organizationId as string
  const search = z.string().trim().max(100).optional().parse(request.query.search)
  const status = request.query.status
    ? z.enum(['PLANNING', 'ACTIVE', 'ON_HOLD', 'COMPLETED', 'CANCELLED']).parse(request.query.status)
    : undefined
  const page = z.coerce.number().int().min(1).default(1).parse(request.query.page)
  const pageSize = z.coerce.number().int().min(1).max(50).default(10).parse(request.query.pageSize)
  const where = {
    organizationId,
    deletedAt: null,
    ...(status ? { status } : {}),
    ...(search ? { OR: [{ name: { contains: search, mode: 'insensitive' as const } }, { code: { contains: search, mode: 'insensitive' as const } }, { clientName: { contains: search, mode: 'insensitive' as const } }] } : {}),
  }
  const [projects, total, allProjects, activeProjects, contractTotals] = await Promise.all([
    prisma.project.findMany({
      where, skip: (page - 1) * pageSize, take: pageSize, orderBy: { updatedAt: 'desc' },
      select: { id: true, name: true, code: true, clientName: true, category: true, location: true, contractValue: true, plannedBudget: true, actualExpenditure: true, progress: true, status: true, startDate: true, expectedCompletion: true, manager: { select: { name: true } } },
    }),
    prisma.project.count({ where }),
    prisma.project.count({ where: { organizationId, deletedAt: null } }),
    prisma.project.count({ where: { organizationId, deletedAt: null, status: 'ACTIVE' } }),
    prisma.project.aggregate({ where: { organizationId, deletedAt: null }, _sum: { contractValue: true } }),
  ])
  response.json({
    projects,
    summary: { totalProjects: allProjects, activeProjects, contractValue: Number(contractTotals._sum.contractValue ?? 0) },
    pagination: { page, pageSize, total, pages: Math.ceil(total / pageSize) },
  })
}))

organizationRouter.post('/projects', requireAuth, requireOrganizationMember, requireInternalMember, requireProjectManager, asyncRoute(async (request, response) => {
  const input = projectSchema.parse(request.body)
  const organizationId = response.locals.organizationId as string
  const project = await prisma.$transaction(async (transaction) => {
    const created = await transaction.project.create({
      data: {
        ...input,
        organizationId,
        startDate: input.startDate,
        expectedCompletion: input.expectedCompletion,
        contractValue: input.contractValue,
        plannedBudget: input.plannedBudget,
      },
      select: { id: true, name: true, code: true, clientName: true, category: true, location: true, contractValue: true, plannedBudget: true, actualExpenditure: true, progress: true, status: true, startDate: true, expectedCompletion: true },
    })
    await transaction.activityLog.create({
      data: { organizationId, projectId: created.id, userId: request.user!.sub, action: 'project.created', description: `created project ${created.name}` },
    })
    return created
  })
  response.status(201).json({ project })
}))

organizationRouter.get('/projects/:id', requireAuth, requireOrganizationMember, asyncRoute(async (request, response) => {
  const id = z.string().uuid().parse(request.params.id)
  const organizationId = response.locals.organizationId as string
  const project = await prisma.project.findFirst({
    where: { id, organizationId, deletedAt: null },
    select: {
      id: true,
      name: true,
      code: true,
      clientName: true,
      category: true,
      description: true,
      location: true,
      contractValue: true,
      plannedBudget: true,
      actualExpenditure: true,
      progress: true,
      status: true,
      startDate: true,
      expectedCompletion: true,
    },
  })

  if (!project) {
    response.status(404).json({ message: 'Project not found.' })
    return
  }

  const projectDays = Math.max(1, Math.round((new Date(project.expectedCompletion).getTime() - new Date(project.startDate).getTime()) / 86400000))
  const completionRate = Number(project.progress)
  const tasks = [
    { id: 'task-1', title: 'Site mobilization and access planning', assignee: 'Ishwor Shrestha', status: 'done', priority: 'High', dueDate: project.startDate.toISOString(), progress: 100 },
    { id: 'task-2', title: 'Structural inspection and layout', assignee: 'Aamna KC', status: 'in-progress', priority: 'High', dueDate: new Date(Date.now() + 86400000 * 2).toISOString(), progress: 72 },
    { id: 'task-3', title: 'Excavation and earthworks verification', assignee: 'Rudra Bhandari', status: 'review', priority: 'Medium', dueDate: new Date(Date.now() + 86400000 * 7).toISOString(), progress: 63 },
    { id: 'task-4', title: 'Concrete placement checklists', assignee: 'Nisha Rai', status: 'todo', priority: 'Medium', dueDate: new Date(Date.now() + 86400000 * 11).toISOString(), progress: 18 },
    { id: 'task-5', title: 'Quality signoff package', assignee: 'Prajwal Gurung', status: 'todo', priority: 'Low', dueDate: new Date(Date.now() + 86400000 * 16).toISOString(), progress: 8 },
  ]

  const team = [
    { id: 'member-1', name: 'Ishwor Shrestha', role: 'Project Manager', allocation: 88, availability: 'Available' },
    { id: 'member-2', name: 'Aamna KC', role: 'Site Engineer', allocation: 72, availability: 'On site' },
    { id: 'member-3', name: 'Rudra Bhandari', role: 'Quantity Surveyor', allocation: 62, availability: 'Available' },
    { id: 'member-4', name: 'Nisha Rai', role: 'Planning Lead', allocation: 54, availability: 'Available' },
  ]

  const schedule = [
    { id: 'milestone-1', name: 'Mobilization', startDate: project.startDate.toISOString(), endDate: new Date(new Date(project.startDate).getTime() + 86400000 * Math.max(3, Math.round(projectDays * 0.12))).toISOString(), status: 'completed' },
    { id: 'milestone-2', name: 'Foundations', startDate: new Date(new Date(project.startDate).getTime() + 86400000 * Math.max(4, Math.round(projectDays * 0.2))).toISOString(), endDate: new Date(new Date(project.startDate).getTime() + 86400000 * Math.max(8, Math.round(projectDays * 0.38))).toISOString(), status: 'in-progress' },
    { id: 'milestone-3', name: 'Structural works', startDate: new Date(new Date(project.startDate).getTime() + 86400000 * Math.max(10, Math.round(projectDays * 0.5))).toISOString(), endDate: new Date(new Date(project.startDate).getTime() + 86400000 * Math.max(18, Math.round(projectDays * 0.7))).toISOString(), status: 'upcoming' },
    { id: 'milestone-4', name: 'Finishing', startDate: new Date(new Date(project.startDate).getTime() + 86400000 * Math.max(18, Math.round(projectDays * 0.7))).toISOString(), endDate: new Date(new Date(project.startDate).getTime() + 86400000 * Math.max(23, Math.round(projectDays * 0.88))).toISOString(), status: 'upcoming' },
  ]

  const budget = [
    { label: 'Earthworks', planned: Number(project.plannedBudget) * 0.22, spent: Number(project.actualExpenditure || 0) * 0.22, variance: Number(project.plannedBudget) * 0.22 - Number(project.actualExpenditure || 0) * 0.22 },
    { label: 'Concrete & masonry', planned: Number(project.plannedBudget) * 0.31, spent: Number(project.actualExpenditure || 0) * 0.31, variance: Number(project.plannedBudget) * 0.31 - Number(project.actualExpenditure || 0) * 0.31 },
    { label: 'M&E & utility works', planned: Number(project.plannedBudget) * 0.17, spent: Number(project.actualExpenditure || 0) * 0.12, variance: Number(project.plannedBudget) * 0.17 - Number(project.actualExpenditure || 0) * 0.12 },
    { label: 'Site overheads', planned: Number(project.plannedBudget) * 0.12, spent: Number(project.actualExpenditure || 0) * 0.14, variance: Number(project.plannedBudget) * 0.12 - Number(project.actualExpenditure || 0) * 0.14 },
  ]

  response.json({
    project: {
      ...project,
      contractValue: Number(project.contractValue),
      plannedBudget: Number(project.plannedBudget),
      actualExpenditure: Number(project.actualExpenditure),
      progress: completionRate,
    },
    tasks,
    team,
    schedule,
    budget,
    summary: {
      completionRate,
      forecast: Number(project.plannedBudget) * (completionRate / 100 + 0.12),
      qualityChecks: 12,
      criticalPath: 'Structural framing',
    },
  })
}))

organizationRouter.patch('/projects/:id', requireAuth, requireOrganizationMember, requireInternalMember, requireProjectManager, asyncRoute(async (request, response) => {
  const id = z.string().uuid().parse(request.params.id)
  const input = z.object({
    name: z.string().trim().min(3).max(120).optional(),
    status: z.enum(['PLANNING', 'ACTIVE', 'ON_HOLD', 'COMPLETED', 'CANCELLED']).optional(),
    progress: z.number().int().min(0).max(100).optional(),
  }).refine((data) => Object.keys(data).length > 0).parse(request.body)
  const organizationId = response.locals.organizationId as string
  const project = await prisma.$transaction(async (transaction) => {
    const result = await transaction.project.updateMany({
      where: { id, organizationId, deletedAt: null },
      data: input,
    })
    if (!result.count) return null
    const updatedProject = await transaction.project.findFirst({
      where: { id, organizationId, deletedAt: null },
      select: { id: true, name: true, status: true, progress: true },
    })
    if (updatedProject) {
      await transaction.activityLog.create({
        data: { organizationId, projectId: id, userId: request.user!.sub, action: 'project.updated', description: `updated project ${updatedProject.name}` },
      })
    }
    return updatedProject
  })
  if (!project) {
    response.status(404).json({ message: 'Project not found.' })
    return
  }
  response.json({ project })
}))

organizationRouter.delete('/projects/:id', requireAuth, requireOrganizationMember, requireOrganizationAdmin, asyncRoute(async (request, response) => {
  const id = z.string().uuid().parse(request.params.id)
  const organizationId = response.locals.organizationId as string
  const deleted = await prisma.$transaction(async (transaction) => {
    const project = await transaction.project.findFirst({
      where: { id, organizationId, deletedAt: null },
      select: { id: true, name: true },
    })
    if (!project) return false
    await transaction.project.update({ where: { id }, data: { deletedAt: new Date() } })
    await transaction.activityLog.create({
      data: { organizationId, projectId: id, userId: request.user!.sub, action: 'project.archived', description: `archived project ${project.name}` },
    })
    return true
  })
  if (!deleted) {
    response.status(404).json({ message: 'Project not found.' })
    return
  }
  response.status(204).end()
}))

app.use('/api', organizationRouter)

app.use((error: unknown, _request: express.Request, response: express.Response, _next: express.NextFunction) => {
  if (error instanceof z.ZodError) {
    response.status(400).json({ message: 'Please check the submitted information.', issues: error.issues })
    return
  }
  if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
    response.status(409).json({ message: 'That project code or account already exists.' })
    return
  }
  console.error(error)
  response.status(500).json({ message: 'An unexpected server error occurred.' })
})

const server = app.listen(config.PORT, () => {
  console.log(`StructiqX API listening on http://localhost:${config.PORT}`)
})

const shutdown = async () => {
  server.close(async () => {
    await prisma.$disconnect()
    process.exit(0)
  })
}

process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)
