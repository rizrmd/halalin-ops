import { createServerFn } from '@tanstack/react-start'
import { prisma } from './db'

// Interview mode enum values from schema.prisma
export const INTERVIEW_MODES = [
  'onsite',
  'online',
  'hybrid',
] as const

export type InterviewMode = typeof INTERVIEW_MODES[number]

// Result enum values from schema.prisma
export const INTERVIEW_RESULTS = [
  'priority_deploy',
  'talent_pool',
  'training_first',
  'hold',
  'senior_halal_compliance',
  'deployable_penyelia_halal',
  'training_required',
  'not_ready',
] as const

export type InterviewResult = typeof INTERVIEW_RESULTS[number]

// Display names for interview modes (Indonesian)
export const INTERVIEW_MODE_LABELS: Record<InterviewMode, string> = {
  onsite: 'Onsite',
  online: 'Online',
  hybrid: 'Hybrid',
}

// Display names for interview results (Indonesian)
export const INTERVIEW_RESULT_LABELS: Record<InterviewResult, string> = {
  priority_deploy: 'Prioritas Deploy',
  talent_pool: 'Talent Pool',
  training_first: 'Training Dulu',
  hold: 'Tahan',
  senior_halal_compliance: 'Senior Halal Compliance',
  deployable_penyelia_halal: 'Siap Deploy',
  training_required: 'Perlu Training',
  not_ready: 'Belum Siap',
}

// Type for interview response
export interface InterviewListItem {
  id: string
  candidate_name: string
  interview_date: string
  interview_mode: string | null
  result: string | null
  candidate_id: string
}

export interface InterviewsResponse {
  interviews: InterviewListItem[]
  totalCount: number
  totalPages: number
  currentPage: number
  pageSize: number
}

/**
 * Get interview sessions list with pagination
 * @param page - Current page number (1-based)
 * @param pageSize - Number of items per page
 */
export const getInterviews = createServerFn({ method: 'GET' })
  .inputValidator((data: unknown): { page: number; pageSize: number } => {
    if (typeof data !== 'object' || data === null) {
      return { page: 1, pageSize: 20 }
    }
    const { page, pageSize } = data as Record<string, unknown>
    const validatedPage = typeof page === 'number' && page > 0 ? page : 1
    const validatedPageSize = typeof pageSize === 'number' && pageSize > 0 && pageSize <= 100 ? pageSize : 20
    return { page: validatedPage, pageSize: validatedPageSize }
  })
  .handler(async ({ data }): Promise<InterviewsResponse> => {
    const { page, pageSize } = data
    const skip = (page - 1) * pageSize
    
    // Get total count for pagination
    const totalCount = await prisma.interview_sessions.count()
    
    // Get paginated interview sessions with candidate info
    const interviews = await prisma.interview_sessions.findMany({
      select: {
        id: true,
        candidate_id: true,
        interview_date: true,
        interview_mode: true,
        result: true,
        partners_interview_sessions_candidate_idTopartners: {
          select: {
            full_name: true,
          },
        },
      },
      orderBy: {
        interview_date: 'desc',
      },
      skip,
      take: pageSize,
    })
    
    const totalPages = Math.ceil(totalCount / pageSize)
    
    // Transform to interview list items
    const interviewListItems: InterviewListItem[] = interviews.map((session) => ({
      id: session.id,
      candidate_name: session.partners_interview_sessions_candidate_idTopartners.full_name,
      interview_date: session.interview_date.toISOString().split('T')[0],
      interview_mode: session.interview_mode,
      result: session.result,
      candidate_id: session.candidate_id,
    }))
    
    return { 
      interviews: interviewListItems, 
      totalCount, 
      totalPages, 
      currentPage: page, 
      pageSize 
    }
  })
