// @ts-check
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Starting database seed...')

  // Create default organization (use proper UUID format)
  try {
    const org = await prisma.organizations.create({
      data: {
        id: '00000000-0000-0000-0000-000000000001',
        name: 'Default Organization',
        org_type: 'internal',
      },
    })
    console.log('✓ Created organization:', org.name)
  } catch (e) {
    if (e.code !== 'P2002') throw e
    console.log('✓ Organization already exists')
    const org = await prisma.organizations.findUnique({ where: { id: '00000000-0000-0000-0000-000000000001' }})
    if (!org) throw new Error('Organization not found')
  }

  // Create admin user
  const hashedPassword = await bcrypt.hash('admin123', 10)
  try {
    const admin = await prisma.partners.create({
      data: {
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
  } catch (e) {
    if (e.code !== 'P2002') throw e
    console.log('✓ Admin user already exists, updating password...')
    // Update password for existing admin - need to get ID first
    const existingAdmin = await prisma.partners.findFirst({ where: { email: 'admin@halalin.co.id' }})
    if (existingAdmin) {
      await prisma.partners.update({
        where: { id: existingAdmin.id },
        data: { password_hash: hashedPassword },
      })
      console.log('✓ Admin password updated for:', existingAdmin.email)
    }
  }

  // Create sample partner user
  const partnerPassword = await bcrypt.hash('partner123', 10)
  try {
    const partner = await prisma.partners.create({
      data: {
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
  } catch (e) {
    if (e.code !== 'P2002') throw e
    console.log('✓ Partner user already exists')
  }

  // Create sample project
  try {
    const project = await prisma.projects.create({
      data: {
        id: '00000000-0000-0000-0000-000000000004',
        code: 'PROJ-001',
        title: 'Sample Project',
        status: 'active',
        owner_org_id: '00000000-0000-0000-0000-000000000001',
      },
    })
    console.log('✓ Created project:', project.title)
  } catch (e) {
    if (e.code !== 'P2002') throw e
    console.log('✓ Project already exists')
  }

  // Create additional users with password: halalin123!
  const commonPassword = await bcrypt.hash('halalin123!', 10)
  
  // Candidate users
  const candidates = [
    { id: '00000000-0000-0000-0000-000000000010', email: 'ahmad.hidayat@halalin.co.id', name: 'Ahmad Hidayat' },
    { id: '00000000-0000-0000-0000-000000000011', email: 'budi.santoso@halalin.co.id', name: 'Budi Santoso' },
    { id: '00000000-0000-0000-0000-000000000012', email: 'dedi.kurniawan@halalin.co.id', name: 'Dedi Kurniawan' },
    { id: '00000000-0000-0000-0000-000000000013', email: 'rina.wijaya@halalin.co.id', name: 'Rina Wijaya' },
    { id: '00000000-0000-0000-0000-000000000014', email: 'siti.nurhaliza@halalin.co.id', name: 'Siti Nurhaliza' },
  ]
  
  for (const candidate of candidates) {
    try {
      await prisma.partners.create({
        data: {
          id: candidate.id,
          full_name: candidate.name,
          email: candidate.email,
          password_hash: commonPassword,
          partner_type: 'candidate',
          is_admin: false,
          is_active: true,
        },
      })
      console.log('✓ Created candidate:', candidate.email)
    } catch (e) {
      if (e.code !== 'P2002') throw e
      console.log('✓ Candidate exists:', candidate.email)
    }
  }
  
  // Penyelia Halal
  try {
    await prisma.partners.create({
      data: {
        id: '00000000-0000-0000-0000-000000000020',
        full_name: 'Dian Prasetyo',
        email: 'dian.prasetyo@halalin.co.id',
        password_hash: commonPassword,
        partner_type: 'penyelia_halal',
        is_admin: false,
        is_active: true,
      },
    })
    console.log('✓ Created penyelia_halal: dian.prasetyo@halalin.co.id')
  } catch (e) {
    if (e.code !== 'P2002') throw e
    console.log('✓ Penyelia halal exists: dian.prasetyo@halalin.co.id')
  }
  
  // Tenaga Ahli
  try {
    await prisma.partners.create({
      data: {
        id: '00000000-0000-0000-0000-000000000030',
        full_name: 'Siti Rahma',
        email: 'siti.rahma@halalin.co.id',
        password_hash: commonPassword,
        partner_type: 'tenaga_ahli',
        is_admin: false,
        is_active: true,
      },
    })
    console.log('✓ Created tenaga_ahli: siti.rahma@halalin.co.id')
  } catch (e) {
    if (e.code !== 'P2002') throw e
    console.log('✓ Tenaga ahli exists: siti.rahma@halalin.co.id')
  }
  
  // Halal Auditor
  try {
    await prisma.partners.create({
      data: {
        id: '00000000-0000-0000-0000-000000000040',
        full_name: 'Ahmad Fauzi',
        email: 'ahmad.fauzi@halalin.co.id',
        password_hash: commonPassword,
        partner_type: 'halal_auditor',
        is_admin: false,
        is_active: true,
      },
    })
    console.log('✓ Created halal_auditor: ahmad.fauzi@halalin.co.id')
  } catch (e) {
    if (e.code !== 'P2002') throw e
    console.log('✓ Halal auditor exists: ahmad.fauzi@halalin.co.id')
  }

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
  console.log('\n=== Login Credentials ===')
  console.log('\nAdmin:')
  console.log('  admin@halalin.co.id / admin123')
  console.log('\nPartner:')
  console.log('  partner@halalin.co.id / partner123')
  console.log('\nCandidates (password: halalin123!):')
  console.log('  ahmad.hidayat@halalin.co.id')
  console.log('  budi.santoso@halalin.co.id')
  console.log('  dedi.kurniawan@halalin.co.id')
  console.log('  rina.wijaya@halalin.co.id')
  console.log('  siti.nurhaliza@halalin.co.id')
  console.log('\nPenyelia Halal (password: halalin123!):')
  console.log('  dian.prasetyo@halalin.co.id')
  console.log('\nTenaga Ahli (password: halalin123!):')
  console.log('  siti.rahma@halalin.co.id')
  console.log('\nHalal Auditor (password: halalin123!):')
  console.log('  ahmad.fauzi@halalin.co.id')
}

main()
  .catch((e) => {
    console.error('Seed error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
