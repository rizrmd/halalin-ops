// @ts-check
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Starting database seed...')

  // Create default organization (use proper UUID format)
  const org = await prisma.organizations.upsert({
    where: { id: '00000000-0000-0000-0000-000000000001' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000001',
      name: 'Default Organization',
      org_type: 'internal',
    },
  })
  console.log('✓ Created organization:', org.name)

  // Create admin user (use proper UUID format)
  const hashedPassword = await bcrypt.hash('admin123', 10)
  const admin = await prisma.partners.upsert({
    where: { email: 'admin@halalin.co.id' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000002',
      full_name: 'Admin User',
      email: 'admin@halalin.co.id',
      password_hash: hashedPassword,
      partner_type: 'mitra',
      is_admin: true,
      is_active: true,
    },
  })
  console.log('✓ Created admin user:', admin.email)

  // Create sample partner user (use proper UUID format)
  const partnerPassword = await bcrypt.hash('partner123', 10)
  const partner = await prisma.partners.upsert({
    where: { email: 'partner@halalin.co.id' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000003',
      full_name: 'Partner User',
      email: 'partner@halalin.co.id',
      password_hash: partnerPassword,
      partner_type: 'mitra',
      is_admin: false,
      is_active: true,
    },
  })
  console.log('✓ Created partner user:', partner.email)

  // Create sample project (use proper UUID format)
  const project = await prisma.projects.upsert({
    where: { code: 'PROJ-001' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000004',
      code: 'PROJ-001',
      title: 'Sample Project',
      status: 'active',
      owner_org_id: org.id,
    },
  })
  console.log('✓ Created project:', project.title)

  // Create standards
  const standards = [
    { code: 'STD-001', name: 'Standard 1', description: 'First standard' },
    { code: 'STD-002', name: 'Standard 2', description: 'Second standard' },
    { code: 'STD-003', name: 'Standard 3', description: 'Third standard' },
  ]

  for (const std of standards) {
    await prisma.project_standards.upsert({
      where: { code: std.code },
      update: {},
      create: {
        id: `std-${std.code}`,
        code: std.code,
        name: std.name,
        description: std.description,
      },
    })
  }
  console.log('✓ Created standards')

  // Create interview criteria
  const criteria = await prisma.scoring_criteria.upsert({
    where: { 
      context_code: {
        context: 'interview',
        code: 'CRIT-001'
      }
    },
    update: {},
    create: {
      id: 'crit-001',
      context: 'interview',
      code: 'CRIT-001',
      name: 'Communication Skills',
      description: 'Evaluate communication abilities',
      weight: 1,
    },
  })
  console.log('✓ Created scoring criteria:', criteria.name)

  console.log('\n✅ Database seeded successfully!')
  console.log('\nDefault credentials:')
  console.log('Admin: admin@halalin.co.id / admin123')
  console.log('Partner: partner@halalin.co.id / partner123')
}

main()
  .catch((e) => {
    console.error('Seed error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
