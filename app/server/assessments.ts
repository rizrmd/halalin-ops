import { createServerFn } from '@tanstack/react-start'
import { prisma } from './db'

// Type for assessment list item
export interface AssessmentListItem {
  id: string
  participant_name: string
  participant_email: string | null
  template_title: string
  template_code: string | null
  objective_score: number
  essay_score: number
  total_score: number
  competency_result: string | null
  started_at: string | null
  submitted_at: string | null
  status: 'not_started' | 'in_progress' | 'submitted' | 'reviewed'
}

// Type for assessments response with pagination
export interface AssessmentsResponse {
  assessments: AssessmentListItem[]
  totalCount: number
  totalPages: number
  currentPage: number
  pageSize: number
}

// Display names for competency results (Indonesian)
export const COMPETENCY_RESULT_LABELS: Record<string, string> = {
  priority_deploy: 'Prioritas Penempatan',
  talent_pool: 'Talent Pool',
  training_first: 'Pelatihan Dulu',
  hold: 'Tunda',
  senior_halal_compliance: 'Kepatuhan Halal Senior',
  deployable_penyelia_halal: 'Penyelia Halal Siap Terjun',
  training_required: 'Perlu Pelatihan',
  not_ready: 'Belum Siap',
}

// Status display labels
export const ASSESSMENT_STATUS_LABELS: Record<string, string> = {
  not_started: 'Belum Dimulai',
  in_progress: 'Sedang Dikerjakan',
  submitted: 'Sudah Disubmit',
  reviewed: 'Sudah Direview',
}

/**
 * Get assessments list with pagination
 */
export const getAssessments = createServerFn({ method: 'GET' })
  .inputValidator((data: unknown): { page: number; pageSize: number } => {
    if (typeof data !== 'object' || data === null) {
      return { page: 1, pageSize: 20 }
    }
    const { page, pageSize } = data as Record<string, unknown>
    const validatedPage = typeof page === 'number' && page > 0 ? page : 1
    const validatedPageSize = typeof pageSize === 'number' && pageSize > 0 && pageSize <= 100 ? pageSize : 20
    return { page: validatedPage, pageSize: validatedPageSize }
  })
  .handler(async ({ data }): Promise<AssessmentsResponse> => {
    const { page, pageSize } = data
    const skip = (page - 1) * pageSize
    
    // Get total count for pagination
    const totalCount = await prisma.assessment_attempts.count()
    
    // Get paginated assessment attempts with related data
    const attempts = await prisma.assessment_attempts.findMany({
      select: {
        id: true,
        participant_id: true,
        objective_score: true,
        essay_score: true,
        total_score: true,
        competency_result: true,
        started_at: true,
        submitted_at: true,
        partners_assessment_attempts_participant_idTopartners: {
          select: {
            full_name: true,
            email: true,
          },
        },
        question_banks: {
          select: {
            title: true,
            template_code: true,
          },
        },
      },
      orderBy: {
        submitted_at: 'desc',
      },
      skip,
      take: pageSize,
    })
    
    // Transform to assessment list items
    const assessments: AssessmentListItem[] = attempts.map((attempt) => {
      // Determine status based on dates and result
      let status: 'not_started' | 'in_progress' | 'submitted' | 'reviewed' = 'not_started'
      
      if (attempt.started_at && !attempt.submitted_at) {
        status = 'in_progress'
      } else if (attempt.submitted_at && !attempt.competency_result) {
        status = 'submitted'
      } else if (attempt.competency_result) {
        status = 'reviewed'
      }
      
      return {
        id: attempt.id,
        participant_name: attempt.partners_assessment_attempts_participant_idTopartners.full_name,
        participant_email: attempt.partners_assessment_attempts_participant_idTopartners.email,
        template_title: attempt.question_banks.title,
        template_code: attempt.question_banks.template_code,
        objective_score: Number(attempt.objective_score),
        essay_score: Number(attempt.essay_score),
        total_score: Number(attempt.total_score),
        competency_result: attempt.competency_result,
        started_at: attempt.started_at ? attempt.started_at.toISOString() : null,
        submitted_at: attempt.submitted_at ? attempt.submitted_at.toISOString() : null,
        status,
      }
    })
    
    const totalPages = Math.ceil(totalCount / pageSize)
    
    return { assessments, totalCount, totalPages, currentPage: page, pageSize }
  })
