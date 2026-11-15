import 'dotenv/config'
import bcrypt from 'bcryptjs'
import { PrismaClient } from '@prisma/client'

if (process.env.NODE_ENV !== 'development' && process.env.NODE_ENV !== 'test') {
  throw new Error('Development seed data is only available when NODE_ENV is development or test.')
}

const prisma = new PrismaClient()

async function main() {
  const email = 'demo@structiqx.dev'
  const passwordHash = await bcrypt.hash('StructiqxDemo2025!', 12)
  const user = await prisma.user.upsert({
    where: { email },
    update: { name: 'Aarav Sharma', passwordHash },
    create: { email, name: 'Aarav Sharma', passwordHash },
  })
  const organization = await prisma.organization.upsert({
    where: { slug: 'himalayan-engineering' },
    update: { name: 'Himalayan Engineering', currency: 'NPR' },
    create: { name: 'Himalayan Engineering', slug: 'himalayan-engineering', currency: 'NPR' },
  })
  await prisma.organizationMember.upsert({
    where: { userId_organizationId: { userId: user.id, organizationId: organization.id } },
    update: { role: 'ORGANIZATION_ADMIN' },
    create: { userId: user.id, organizationId: organization.id, role: 'ORGANIZATION_ADMIN' },
  })

  const demoProjects = [
    { code: 'PRJ-2025-001', name: 'Bhaisepati Residences', clientName: 'Everest Developers', category: 'RESIDENTIAL' as const, location: 'Lalitpur, Bagmati', contractValue: 48500000, plannedBudget: 41200000, actualExpenditure: 18300000, progress: 58, status: 'ACTIVE' as const, startDate: new Date('2025-01-15'), expectedCompletion: new Date('2026-03-30') },
    { code: 'PRJ-2025-002', name: 'Ring Road Drainage Upgrade', clientName: 'Lalitpur Metropolitan City', category: 'DRAINAGE' as const, location: 'Lalitpur, Bagmati', contractValue: 22800000, plannedBudget: 19600000, actualExpenditure: 8200000, progress: 42, status: 'ACTIVE' as const, startDate: new Date('2025-03-01'), expectedCompletion: new Date('2025-12-15') },
    { code: 'PRJ-2025-003', name: 'Sundarijal Water Treatment Plant', clientName: 'Kathmandu Upatyaka Khanepani Ltd.', category: 'WATER_SUPPLY' as const, location: 'Gokarneshwar, Bagmati', contractValue: 76400000, plannedBudget: 68900000, actualExpenditure: 12000000, progress: 24, status: 'ACTIVE' as const, startDate: new Date('2025-04-20'), expectedCompletion: new Date('2026-11-30') },
    { code: 'PRJ-2024-018', name: 'Dhulikhel Access Road', clientName: 'Dhulikhel Municipality', category: 'ROADS' as const, location: 'Dhulikhel, Kavrepalanchok', contractValue: 15300000, plannedBudget: 14100000, actualExpenditure: 14100000, progress: 100, status: 'COMPLETED' as const, startDate: new Date('2024-05-10'), expectedCompletion: new Date('2024-12-20') },
  ]

  for (const project of demoProjects) {
    await prisma.project.upsert({
      where: { organizationId_code: { organizationId: organization.id, code: project.code } },
      update: { ...project, managerId: user.id },
      create: { ...project, managerId: user.id, organizationId: organization.id },
    })
  }

  const project = await prisma.project.findUnique({
    where: { organizationId_code: { organizationId: organization.id, code: 'PRJ-2025-001' } },
  })
  if (project) {
    const activityCount = await prisma.activityLog.count({ where: { organizationId: organization.id, projectId: project.id } })
    if (!activityCount) {
      await prisma.activityLog.createMany({
        data: [
          { organizationId: organization.id, projectId: project.id, userId: user.id, action: 'project.update', description: 'updated the construction schedule' },
          { organizationId: organization.id, projectId: project.id, userId: user.id, action: 'report.submitted', description: 'submitted a daily site report' },
        ],
      })
    }
  }

  console.log(`Seeded development account ${email} and ${demoProjects.length} projects.`)
}

main()
  .catch((error: unknown) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => prisma.$disconnect())
