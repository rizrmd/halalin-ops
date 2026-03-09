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

// Type for creating an interview
export interface CreateInterviewInput {
  candidate_id: string
  interviewer_id?: string
  interview_date: string
  interview_mode: InterviewMode
  bank_id?: string
  objective?: string
  notes?: string
}

// Validation result type
export interface ValidationError {
  field: string
  message: string
}

// Type for create interview response
export interface CreateInterviewResult {
  success: boolean
  interview?: {
    id: string
    candidate_id: string
    candidate_name: string
    interview_date: string
    interview_mode: string | null
  }
  errors?: ValidationError[]
}

// Type for dropdown options
export interface CandidateOption {
  id: string
  full_name: string
  partner_type: string
}

export interface InterviewerOption {
  id: string
  full_name: string
  partner_type: string
}

export interface QuestionBankOption {
  id: string
  title: string
  purpose: string
}

export interface FormOptionsResponse {
  candidates: CandidateOption[]
  interviewers: InterviewerOption[]
  questionBanks: QuestionBankOption[]
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

/**
 * Get form options for interview creation (candidates, interviewers, question banks)
 */
export const getInterviewFormOptions = createServerFn({ method: 'GET' })
  .handler(async (): Promise<FormOptionsResponse> => {
    // Get candidates (partners with type 'candidate')
    const candidates = await prisma.partners.findMany({
      where: {
        partner_type: 'candidate',
        is_active: true,
      },
      select: {
        id: true,
        full_name: true,
        partner_type: true,
      },
      orderBy: {
        full_name: 'asc',
      },
    })

    // Get interviewers (partners with type 'interviewer' or 'mitra')
    const interviewers = await prisma.partners.findMany({
      where: {
        partner_type: {
          in: ['interviewer', 'mitra', 'penyelia_halal'],
        },
        is_active: true,
      },
      select: {
        id: true,
        full_name: true,
        partner_type: true,
      },
      orderBy: {
        full_name: 'asc',
      },
    })

    // Get active question banks for interview purpose
    const questionBanks = await prisma.question_banks.findMany({
      where: {
        purpose: 'interview',
        is_active: true,
      },
      select: {
        id: true,
        title: true,
        purpose: true,
      },
      orderBy: {
        title: 'asc',
      },
    })

    return {
      candidates,
      interviewers,
      questionBanks,
    }
  })

/**
 * Create a new interview session
 */
export const createInterview = createServerFn({ method: 'POST' })
  .inputValidator((data: unknown): CreateInterviewInput => {
    const errors: ValidationError[] = []

    if (typeof data !== 'object' || data === null) {
      errors.push({ field: 'form', message: 'Data formulir tidak valid' })
      throw new Error(JSON.stringify(errors))
    }

    const input = data as Record<string, unknown>

    // Validate required fields
    const candidate_id = input.candidate_id as string | undefined
    if (candidate_id === undefined || typeof candidate_id !== 'string' || candidate_id.trim() === '') {
      errors.push({ field: 'candidate_id', message: 'Kandidat wajib dipilih' })
    }

    const interview_date = input.interview_date as string | undefined
    if (interview_date === undefined || typeof interview_date !== 'string' || interview_date.trim() === '') {
      errors.push({ field: 'interview_date', message: 'Tanggal wawancara wajib diisi' })
    }

    const interview_mode = input.interview_mode
    if (!interview_mode || typeof interview_mode !== 'string') {
      errors.push({ field: 'interview_mode', message: 'Mode wawancara wajib dipilih' })
    } else if (!INTERVIEW_MODES.includes(interview_mode as InterviewMode)) {
      errors.push({ field: 'interview_mode', message: 'Mode wawancara tidak valid' })
    }

    if (errors.length > 0) {
      throw new Error(JSON.stringify(errors))
    }

    return {
      candidate_id: (candidate_id as string).trim(),
      interviewer_id: input.interviewer_id && typeof input.interviewer_id === 'string'
        ? input.interviewer_id.trim() || undefined
        : undefined,
      interview_date: (interview_date as string).trim(),
      interview_mode: interview_mode as InterviewMode,
      bank_id: input.bank_id && typeof input.bank_id === 'string'
        ? input.bank_id.trim() || undefined
        : undefined,
      objective: input.objective && typeof input.objective === 'string'
        ? input.objective.trim() || undefined
        : undefined,
      notes: input.notes && typeof input.notes === 'string'
        ? input.notes.trim() || undefined
        : undefined,
    }
  })
  .handler(async ({ data }): Promise<CreateInterviewResult> => {
    try {
      // Validate that candidate exists and is a candidate type
      const candidate = await prisma.partners.findUnique({
        where: { id: data.candidate_id },
        select: { id: true, partner_type: true },
      })

      if (!candidate) {
        return {
          success: false,
          errors: [{ field: 'candidate_id', message: 'Kandidat tidak ditemukan' }],
        }
      }

      if (candidate.partner_type !== 'candidate') {
        return {
          success: false,
          errors: [{ field: 'candidate_id', message: 'Partner yang dipilih bukan kandidat' }],
        }
      }

      // Validate interviewer if provided
      if (data.interviewer_id) {
        const interviewer = await prisma.partners.findUnique({
          where: { id: data.interviewer_id },
          select: { id: true },
        })

        if (!interviewer) {
          return {
            success: false,
            errors: [{ field: 'interviewer_id', message: 'Pewawancara tidak ditemukan' }],
          }
        }
      }

      // Validate question bank if provided
      if (data.bank_id) {
        const questionBank = await prisma.question_banks.findUnique({
          where: { id: data.bank_id },
          select: { id: true, purpose: true },
        })

        if (!questionBank || questionBank.purpose !== 'interview') {
          return {
            success: false,
            errors: [{ field: 'bank_id', message: 'Bank pertanyaan tidak valid' }],
          }
        }
      }

      // Create the interview session
      const interview = await prisma.interview_sessions.create({
        data: {
          candidate_id: data.candidate_id,
          interviewer_id: data.interviewer_id || null,
          interview_date: new Date(data.interview_date),
          interview_mode: data.interview_mode,
          bank_id: data.bank_id || null,
          objective: data.objective || null,
          notes: data.notes || null,
        },
        select: {
          id: true,
          candidate_id: true,
          interview_date: true,
          interview_mode: true,
          partners_interview_sessions_candidate_idTopartners: {
            select: {
              full_name: true,
            },
          },
        },
      })

      return {
        success: true,
        interview: {
          id: interview.id,
          candidate_id: interview.candidate_id,
          candidate_name: interview.partners_interview_sessions_candidate_idTopartners.full_name,
          interview_date: interview.interview_date.toISOString().split('T')[0],
          interview_mode: interview.interview_mode,
        },
      }
    } catch (error) {
      console.error('Error creating interview:', error)
      throw error
    }
  })
