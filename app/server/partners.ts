import { createServerFn } from '@tanstack/react-start'
import { prisma } from './db'

// Type for partner response
export interface PartnerListItem {
  id: string
  full_name: string
  email: string | null
  phone: string | null
  partner_type: string
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
  .inputValidator((data: unknown): { page: number; pageSize: number } => {
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

    return {
      partners,
      totalCount,
      totalPages,
      currentPage: page,
      pageSize,
    }
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
