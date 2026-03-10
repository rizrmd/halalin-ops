import { createServerFn } from '@tanstack/react-start'
import { prisma } from './db'

// Partner type enum values from schema.prisma
export const PARTNER_TYPES = [
  'candidate',
  'mitra',
  'penyelia_halal',
  'tenaga_ahli',
  'halal_auditor',
  'interviewer',
] as const

export type PartnerType = typeof PARTNER_TYPES[number]

// Display names for partner types (Indonesian)
export const PARTNER_TYPE_LABELS: Record<PartnerType, string> = {
  candidate: 'Kandidat',
  mitra: 'Mitra',
  penyelia_halal: 'Penyelia Halal',
  tenaga_ahli: 'Tenaga Ahli',
  halal_auditor: 'Auditor Halal',
  interviewer: 'Pewawancara',
}

// Type for partner response
export interface PartnerListItem {
  id: string
  full_name: string
  email: string | null
  phone: string | null
  partner_type: string
}

// Type for creating a partner
export interface CreatePartnerInput {
  full_name: string
  email?: string
  phone?: string
  partner_type: PartnerType
  domicile_city?: string
  domicile_province?: string
  experience_level?: string
  is_active?: boolean
  notes?: string
}

// Validation result type
export interface ValidationError {
  field: string
  message: string
}

// Type for create partner response
export interface CreatePartnerResult {
  success: boolean
  partner?: PartnerListItem
  errors?: ValidationError[]
}

export interface PartnersResponse {
  partners: PartnerListItem[]
  totalCount: number
  totalPages: number
  currentPage: number
  pageSize: number
}

/**
 * Get partners list with pagination
 * @param page - Current page number (1-based)
 * @param pageSize - Number of items per page
 */
export const getPartners = createServerFn({ method: 'GET' })
  .inputValidator((data: unknown): { page: number, pageSize: number } => {
    if (typeof data !== 'object' || data === null) {
      return { page: 1, pageSize: 20 }
    }
    const { page, pageSize } = data as Record<string, unknown>
    const validatedPage = typeof page === 'number' && page > 0 ? page : 1
    const validatedPageSize = typeof pageSize === 'number' && pageSize > 0 && pageSize <= 100 ? pageSize : 20
    return { page: validatedPage, pageSize: validatedPageSize }
  })
  .handler(async ({ data }): Promise<PartnersResponse> => {
    const { page, pageSize } = data
    const skip = (page - 1) * pageSize

    // Get total count for pagination
    const totalCount = await prisma.partners.count()

    // Get paginated partners
    const partners = await prisma.partners.findMany({
      select: {
        id: true,
        full_name: true,
        email: true,
        phone: true,
        partner_type: true,
      },
      orderBy: {
        full_name: 'asc',
      },
      skip,
      take: pageSize,
    })

    const totalPages = Math.ceil(totalCount / pageSize)

    return { partners, totalCount, totalPages, currentPage: page, pageSize }
  })

/**
 * Get a single partner by ID
 */
export const getPartnerById = createServerFn({ method: 'GET' })
  .inputValidator((data: unknown): { id: string } => {
    if (typeof data !== 'object' || data === null) {
      throw new Error('ID partner diperlukan')
    }
    const { id } = data as Record<string, unknown>
    if (typeof id !== 'string' || !id) {
      throw new Error('ID partner tidak valid')
    }
    return { id }
  })
  .handler(async ({ data }) => {
    const { id } = data
    const partner = await prisma.partners.findUnique({
      where: { id },
      select: {
        id: true,
        full_name: true,
        email: true,
        phone: true,
        partner_type: true,
        domicile_city: true,
        domicile_province: true,
        experience_level: true,
        is_active: true,
        notes: true,
        created_at: true,
      },
    })
    if (!partner) {
      throw new Error('Partner tidak ditemukan')
    }
    return partner
  })

/**
 * Create a new partner
 */
export const createPartner = createServerFn({ method: 'POST' })
  .inputValidator((data: unknown): CreatePartnerInput => {
    const errors: ValidationError[] = []

    if (typeof data !== 'object' || data === null) {
      errors.push({ field: 'form', message: 'Data formulir tidak valid' })
      throw new Error(JSON.stringify(errors))
    }

    const input = data as Record<string, unknown>

    // Validate required fields
    const full_name = input.full_name
    if (!full_name || typeof full_name !== 'string' || full_name.trim() === '') {
      errors.push({ field: 'full_name', message: 'Nama lengkap wajib diisi' })
    }

    const partner_type = input.partner_type
    if (!partner_type || typeof partner_type !== 'string') {
      errors.push({ field: 'partner_type', message: 'Tipe mitra wajib dipilih' })
    }
    else if (!PARTNER_TYPES.includes(partner_type as PartnerType)) {
      errors.push({ field: 'partner_type', message: 'Tipe mitra tidak valid' })
    }

    // Validate optional fields format
    const email = input.email
    if (email && typeof email === 'string' && email.trim() !== '') {
      const emailRegex = /^[^\s@]+@[^\s@][^\s.@]*\.[^\s@]+$/
      if (!emailRegex.test(email)) {
        errors.push({ field: 'email', message: 'Format email tidak valid' })
      }
    }

    const phone = input.phone
    if (phone && typeof phone === 'string' && phone.trim() !== '' && phone.length < 8) {
      errors.push({ field: 'phone', message: 'Nomor telepon minimal 8 karakter' })
    }

    if (errors.length > 0) {
      throw new Error(JSON.stringify(errors))
    }

    return {
      full_name: (full_name as string).trim(),
      email: email && typeof email === 'string' ? email.trim() || undefined : undefined,
      phone: phone && typeof phone === 'string' ? phone.trim() || undefined : undefined,
      partner_type: partner_type as PartnerType,
      domicile_city: input.domicile_city && typeof input.domicile_city === 'string'
        ? input.domicile_city.trim() || undefined
        : undefined,
      domicile_province: input.domicile_province && typeof input.domicile_province === 'string'
        ? input.domicile_province.trim() || undefined
        : undefined,
      experience_level: input.experience_level && typeof input.experience_level === 'string'
        ? input.experience_level.trim() || undefined
        : undefined,
      is_active: input.is_active === true,
      notes: input.notes && typeof input.notes === 'string'
        ? input.notes.trim() || undefined
        : undefined,
    }
  })
  .handler(async ({ data }): Promise<CreatePartnerResult> => {
    try {
      const partner = await prisma.partners.create({
        data: {
          full_name: data.full_name,
          email: data.email || null,
          phone: data.phone || null,
          partner_type: data.partner_type,
          domicile_city: data.domicile_city || null,
          domicile_province: data.domicile_province || null,
          experience_level: data.experience_level || null,
          is_active: data.is_active ?? true,
          notes: data.notes || null,
        },
        select: {
          id: true,
          full_name: true,
          email: true,
          phone: true,
          partner_type: true,
        },
      })

      return {
        success: true,
        partner,
      }
    }
    catch (error) {
      // Handle unique constraint violations
      if (error instanceof Error && error.message.includes('Unique constraint')) {
        if (error.message.includes('email')) {
          return {
            success: false,
            errors: [{ field: 'email', message: 'Email sudah digunakan' }],
          }
        }
      }

      throw error
    }
  })
