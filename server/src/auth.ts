import { createHash, randomUUID } from 'node:crypto'
import type { NextFunction, Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import { z } from 'zod'
import { config } from './config.js'
import { prisma } from './db.js'

const accessLifetime = '15m'
const refreshLifetimeMs = 30 * 24 * 60 * 60 * 1000
const refreshCookie = 'structiqx_refresh'

type AccessClaims = { sub: string; email: string }

declare global {
  namespace Express {
    interface Request {
      user?: AccessClaims
    }
  }
}

const digest = (token: string) => createHash('sha256').update(token).digest('hex')

function signAccessToken(user: { id: string; email: string }) {
  return jwt.sign({ email: user.email }, config.JWT_ACCESS_SECRET, {
    subject: user.id,
    expiresIn: accessLifetime,
  })
}

async function issueRefreshToken(userId: string, response: Response) {
  const token = randomUUID() + randomUUID()
  await prisma.refreshToken.create({
    data: { tokenHash: digest(token), userId, expiresAt: new Date(Date.now() + refreshLifetimeMs) },
  })
  response.cookie(refreshCookie, token, {
    httpOnly: true,
    secure: config.isProduction,
    sameSite: 'lax',
    path: '/api/auth',
    maxAge: refreshLifetimeMs,
  })
}

export async function createSession(user: { id: string; email: string }, response: Response) {
  await issueRefreshToken(user.id, response)
  return signAccessToken(user)
}

export async function rotateSession(request: Request, response: Response) {
  const token = request.cookies?.[refreshCookie]
  if (typeof token !== 'string') return null

  const existing = await prisma.refreshToken.findUnique({
    where: { tokenHash: digest(token) },
    include: { user: { select: { id: true, email: true } } },
  })
  if (!existing || existing.revokedAt || existing.expiresAt <= new Date()) {
    response.clearCookie(refreshCookie, { path: '/api/auth' })
    return null
  }

  const replacementToken = randomUUID() + randomUUID()
  const rotated = await prisma.$transaction(async (transaction) => {
    const revoked = await transaction.refreshToken.updateMany({
      where: { id: existing.id, revokedAt: null, expiresAt: { gt: new Date() } },
      data: { revokedAt: new Date() },
    })
    if (!revoked.count) return false
    await transaction.refreshToken.create({
      data: {
        tokenHash: digest(replacementToken),
        userId: existing.userId,
        expiresAt: new Date(Date.now() + refreshLifetimeMs),
      },
    })
    return true
  })
  if (!rotated) {
    response.clearCookie(refreshCookie, { path: '/api/auth' })
    return null
  }
  response.cookie(refreshCookie, replacementToken, {
    httpOnly: true,
    secure: config.isProduction,
    sameSite: 'lax',
    path: '/api/auth',
    maxAge: refreshLifetimeMs,
  })
  return signAccessToken(existing.user)
}

export async function revokeSession(request: Request, response: Response) {
  const token = request.cookies?.[refreshCookie]
  if (typeof token === 'string') {
    await prisma.refreshToken.updateMany({
      where: { tokenHash: digest(token), revokedAt: null },
      data: { revokedAt: new Date() },
    })
  }
  response.clearCookie(refreshCookie, { path: '/api/auth' })
}

export function requireAuth(request: Request, response: Response, next: NextFunction) {
  const authorization = request.header('authorization')
  const token = authorization?.startsWith('Bearer ') ? authorization.slice(7) : ''
  if (!token) {
    response.status(401).json({ message: 'Authentication required.' })
    return
  }
  try {
    const claims = jwt.verify(token, config.JWT_ACCESS_SECRET)
    if (typeof claims === 'string' || typeof claims.sub !== 'string' || typeof claims.email !== 'string') {
      response.status(401).json({ message: 'Invalid access token.' })
      return
    }
    request.user = { sub: claims.sub, email: claims.email }
    next()
  } catch {
    response.status(401).json({ message: 'Access token is invalid or expired.' })
  }
}

const roleHierarchy = {
  ORGANIZATION_ADMIN: 3,
  PROJECT_MANAGER: 2,
  CIVIL_ENGINEER: 1,
  SITE_ENGINEER: 1,
  SITE_SUPERVISOR: 1,
  ACCOUNTANT: 1,
  CLIENT: 0,
} as const

export async function requireOrganizationMember(
  request: Request,
  response: Response,
  next: NextFunction,
) {
  const organizationId = z.string().uuid().safeParse(request.header('x-organization-id'))
  if (!organizationId.success || !request.user) {
    response.status(400).json({ message: 'A valid organization context is required.' })
    return
  }

  try {
    const membership = await prisma.organizationMember.findUnique({
      where: { userId_organizationId: { userId: request.user.sub, organizationId: organizationId.data } },
      select: { role: true },
    })
    if (!membership) {
      response.status(403).json({ message: 'You do not have access to this organization.' })
      return
    }
    response.locals.organizationId = organizationId.data
    response.locals.organizationRole = membership.role
    next()
  } catch (error) {
    next(error)
  }
}

export function requireOrganizationAdmin(_request: Request, response: Response, next: NextFunction) {
  const role = response.locals.organizationRole as keyof typeof roleHierarchy | undefined
  if (!role || roleHierarchy[role] < roleHierarchy.ORGANIZATION_ADMIN) {
    response.status(403).json({ message: 'Organization administrator permission is required.' })
    return
  }
  next()
}

export function requireProjectManager(_request: Request, response: Response, next: NextFunction) {
  const role = response.locals.organizationRole as keyof typeof roleHierarchy | undefined
  if (!role || roleHierarchy[role] < roleHierarchy.PROJECT_MANAGER) {
    response.status(403).json({ message: 'Project manager permission is required.' })
    return
  }
  next()
}

export function requireInternalMember(_request: Request, response: Response, next: NextFunction) {
  const role = response.locals.organizationRole as keyof typeof roleHierarchy | undefined
  if (!role || role === 'CLIENT') {
    response.status(403).json({ message: 'This workspace view is available to internal team members.' })
    return
  }
  next()
}
