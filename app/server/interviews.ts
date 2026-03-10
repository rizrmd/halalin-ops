import type { Prisma } from '@prisma/client'
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

export interface GetInterviewsInput {
  page: number
  pageSize: number
  q: string
  interviewMode: InterviewMode | 'all'
  result: InterviewResult | 'pending' | 'all'
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
  .inputValidator((data: unknown): GetInterviewsInput => {
    if (typeof data !== 'object' || data === null) {
      return { page: 1, pageSize: 20, q: '', interviewMode: 'all', result: 'all' }
    }
    const { page, pageSize, q, interviewMode, result } = data as Record<string, unknown>
    const validatedPage = typeof page === 'number' && page > 0 ? page : 1
    const validatedPageSize = typeof pageSize === 'number' && pageSize > 0 && pageSize <= 100 ? pageSize : 20
    const validatedQuery = typeof q === 'string' ? q.trim() : ''
    const validatedMode = typeof interviewMode === 'string' && INTERVIEW_MODES.includes(interviewMode as InterviewMode)
      ? interviewMode as InterviewMode
      : 'all'
    const validatedResult = result === 'pending'
      || (typeof result === 'string' && INTERVIEW_RESULTS.includes(result as InterviewResult))
      ? result as InterviewResult | 'pending'
      : 'all'
    return {
      page: validatedPage,
      pageSize: validatedPageSize,
      q: validatedQuery,
      interviewMode: validatedMode,
      result: validatedResult,
    }
  })
  .handler(async ({ data }): Promise<InterviewsResponse> => {
    const { page, pageSize, q, interviewMode, result } = data
    const where: Prisma.interview_sessionsWhereInput = {}

    if (q) {
      where.partners_interview_sessions_candidate_idTopartners = {
        full_name: { contains: q, mode: 'insensitive' },
      }
    }

    if (interviewMode !== 'all') {
      where.interview_mode = interviewMode
    }

    if (result === 'pending') {
      where.result = null
    }
    else if (result !== 'all') {
      where.result = result
    }

    const totalCount = await prisma.interview_sessions.count({ where })
    const totalPages = Math.max(1, Math.ceil(totalCount / pageSize))
    const currentPage = Math.min(page, totalPages)
    const skip = (currentPage - 1) * pageSize

    const interviews = await prisma.interview_sessions.findMany({
      where,
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

    const interviewListItems: InterviewListItem[] = interviews.map(session => ({
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
      currentPage,
      pageSize,
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
    }
    else if (!INTERVIEW_MODES.includes(interview_mode as InterviewMode)) {
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
    }
    catch (error) {
      console.error('Error creating interview:', error)
      throw error
    }
  })

/**
 * Question type enum values from schema.prisma
 */
export const QUESTION_TYPES = [
  'short_text',
  'long_text',
  'single_choice',
  'multiple_choice',
  'rating',
  'date',
  'boolean',
] as const

export type QuestionType = typeof QUESTION_TYPES[number]

export const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
  short_text: 'Teks Pendek',
  long_text: 'Teks Panjang',
  single_choice: 'Pilihan Tunggal',
  multiple_choice: 'Pilihan Ganda',
  rating: 'Penilaian',
  date: 'Tanggal',
  boolean: 'Ya/Tidak',
}

/**
 * Question with options for conduct form
 */
export interface QuestionWithOption {
  id: string
  bank_id: string
  section_code: string | null
  section_title: string | null
  field_key: string | null
  question_type: string
  prompt: string
  help_text: string | null
  standard_code: string | null
  is_required: boolean
  weight: number | string
  sort_order: number
  question_options: Array<{
    id: string
    option_label: string
    option_value: string
    score_value: number | string
    is_correct: boolean
    sort_order: number
  }>
}

/**
 * Interview session details for conducting
 */
export interface InterviewConductSession {
  id: string
  bank_id: string | null
  candidate_id: string
  candidate_name: string
  interviewer_id: string | null
  interviewer_name: string | null
  interview_date: string
  interview_mode: string | null
  objective: string | null
  notes: string | null
  result: string | null
  total_score: number | null
  submission_code: string | null
  is_completed: boolean
}

/**
 * Response for conduct interview data
 */
export interface ConductInterviewResponse {
  session: InterviewConductSession
  questions: QuestionWithOption[]
}

/**
 * Input for saving a response
 */
export interface SaveResponseInput {
  question_id: string
  response_text?: string
  selected_option_ids?: string[]
  awarded_score?: number
}

/**
 * Result for saving a response
 */
export interface SaveResponseResult {
  success: boolean
  error?: string
}

/**
 * Input for completing interview
 */
export interface CompleteInterviewInput {
  result?: InterviewResult
  total_score?: number
  notes?: string
}

/**
 * Result for completing interview
 */
export interface CompleteInterviewResult {
  success: boolean
  error?: string
}

/**
 * Scoring criterion for interviews
 */
export interface ScoringCriterion {
  id: string
  context: string
  code: string
  name: string
  max_score: number
  weight: number
  description: string | null
}

/**
 * Response for getting scoring criteria
 */
export interface ScoringCriteriaResponse {
  criteria: ScoringCriterion[]
  maxTotalScore: number
}

/**
 * Input for saving a score entry
 */
export interface SaveScoreInput {
  criterion_id: string
  score: number
  comment?: string
}

/**
 * Result for saving a score
 */
export interface SaveScoreResult {
  success: boolean
  error?: string
}

/**
 * Interview score entry with criterion info
 */
export interface ScoreEntryWithCriterion {
  id: string
  criterion_id: string
  criterion_name: string
  criterion_code: string
  max_score: number
  score: number
  comment: string | null
}

/**
 * Response for getting interview scores
 */
export interface InterviewScoresResponse {
  entries: ScoreEntryWithCriterion[]
  totalScore: number
  maxTotalScore: number
  percentage: number
  suggestedResult: InterviewResult | null
}

/**
 * Get interview session and questions for conducting
 */
export const getConductInterview = createServerFn({ method: 'GET' })
  .inputValidator((data: unknown): { interviewId: string } => {
    if (typeof data !== 'object' || data === null) {
      throw new Error('Invalid input')
    }
    const { interviewId } = data as Record<string, unknown>
    if (typeof interviewId !== 'string' || !interviewId) {
      throw new Error('Interview ID is required')
    }
    return { interviewId }
  })
  .handler(async ({ data }): Promise<ConductInterviewResponse> => {
    const { interviewId } = data

    // Get interview session with candidate and interviewer info
    const session = await prisma.interview_sessions.findUnique({
      where: { id: interviewId },
      select: {
        id: true,
        bank_id: true,
        candidate_id: true,
        interviewer_id: true,
        interview_date: true,
        interview_mode: true,
        objective: true,
        notes: true,
        result: true,
        total_score: true,
        submission_code: true,
        partners_interview_sessions_candidate_idTopartners: {
          select: {
            full_name: true,
          },
        },
        partners_interview_sessions_interviewer_idTopartners: {
          select: {
            full_name: true,
          },
        },
      },
    })

    if (!session) {
      throw new Error('Interview session not found')
    }

    // Check if interview is already completed
    const is_completed = session.submission_code !== null && session.submission_code !== undefined

    // Get questions from the linked question bank
    let questions: QuestionWithOption[] = []
    if (session.bank_id) {
      questions = (await prisma.questions.findMany({
        where: {
          bank_id: session.bank_id,
        },
        include: {
          question_options: {
            orderBy: {
              sort_order: 'asc',
            },
          },
        },
        orderBy: {
          sort_order: 'asc',
        },
      })).map(q => ({
        ...q,
        weight: Number(q.weight),
        question_options: q.question_options.map(opt => ({
          ...opt,
          score_value: Number(opt.score_value),
        })),
      }))
    }

    return {
      session: {
        id: session.id,
        bank_id: session.bank_id,
        candidate_id: session.candidate_id,
        candidate_name: session.partners_interview_sessions_candidate_idTopartners.full_name,
        interviewer_id: session.interviewer_id,
        interviewer_name: session.partners_interview_sessions_interviewer_idTopartners?.full_name || null,
        interview_date: session.interview_date.toISOString().split('T')[0],
        interview_mode: session.interview_mode,
        objective: session.objective,
        notes: session.notes,
        result: session.result,
        total_score: session.total_score ? Number(session.total_score) : null,
        submission_code: session.submission_code,
        is_completed,
      },
      questions,
    }
  })

/**
 * Save a response for a question
 */
export const saveInterviewResponse = createServerFn({ method: 'POST' })
  .inputValidator((data: unknown): { interviewId: string, responses: SaveResponseInput[] } => {
    if (typeof data !== 'object' || data === null) {
      throw new Error('Invalid input')
    }
    const { interviewId, responses } = data as Record<string, unknown>
    if (typeof interviewId !== 'string' || !interviewId) {
      throw new Error('Interview ID is required')
    }
    if (!Array.isArray(responses)) {
      throw new TypeError('Responses must be an array')
    }
    return { interviewId, responses: responses as SaveResponseInput[] }
  })
  .handler(async ({ data }): Promise<SaveResponseResult> => {
    const { interviewId, responses } = data

    try {
      // Verify interview exists
      const session = await prisma.interview_sessions.findUnique({
        where: { id: interviewId },
        select: { id: true, submission_code: true },
      })

      if (!session) {
        return { success: false, error: 'Interview session not found' }
      }

      if (session.submission_code) {
        return { success: false, error: 'Interview already completed' }
      }

      // Save or update responses
      for (const response of responses) {
        // For single_choice, use selected_option_ids[0]
        const selected_option_id = response.selected_option_ids?.[0] || null

        // Check if response exists
        const existingResponse = await prisma.interview_responses.findFirst({
          where: {
            interview_session_id: interviewId,
            question_id: response.question_id,
          },
        })

        if (existingResponse) {
          // Update existing response
          await prisma.interview_responses.update({
            where: {
              id: existingResponse.id,
            },
            data: {
              response_text: response.response_text || null,
              selected_option_id,
              awarded_score: response.awarded_score || null,
            },
          })
        }
        else {
          // Create new response
          await prisma.interview_responses.create({
            data: {
              interview_session_id: interviewId,
              question_id: response.question_id,
              response_text: response.response_text || null,
              selected_option_id,
              awarded_score: response.awarded_score || null,
            },
          })
        }
      }

      return { success: true }
    }
    catch (error) {
      console.error('Error saving interview responses:', error)
      return { success: false, error: 'Failed to save responses' }
    }
  })

/**
 * Complete/finalize an interview session
 */
export const completeInterview = createServerFn({ method: 'POST' })
  .inputValidator((data: unknown): { interviewId: string, completionData: CompleteInterviewInput } => {
    if (typeof data !== 'object' || data === null) {
      throw new Error('Invalid input')
    }
    const { interviewId, completionData } = data as Record<string, unknown>
    if (typeof interviewId !== 'string' || !interviewId) {
      throw new Error('Interview ID is required')
    }
    return { interviewId, completionData: completionData as CompleteInterviewInput }
  })
  .handler(async ({ data }): Promise<CompleteInterviewResult> => {
    const { interviewId, completionData } = data

    try {
      // Verify interview exists
      const session = await prisma.interview_sessions.findUnique({
        where: { id: interviewId },
        select: { id: true, submission_code: true },
      })

      if (!session) {
        return { success: false, error: 'Interview session not found' }
      }

      if (session.submission_code) {
        return { success: false, error: 'Interview already completed' }
      }

      // Generate a unique submission code
      const submission_code = `INT-${Date.now()}-${Math.random().toString(36).substring(2, 9).toUpperCase()}`

      // Update the interview session
      await prisma.interview_sessions.update({
        where: { id: interviewId },
        data: {
          result: completionData.result || null,
          total_score: completionData.total_score || null,
          notes: completionData.notes,
          submission_code,
        },
      })

      return { success: true }
    }
    catch (error) {
      console.error('Error completing interview:', error)
      return { success: false, error: 'Failed to complete interview' }
    }
  })

/**
 * Get scoring criteria for interview context
 */
export const getScoringCriteria = createServerFn({ method: 'GET' })
  .handler(async (): Promise<ScoringCriteriaResponse> => {
    const criteria = await prisma.scoring_criteria.findMany({
      where: {
        context: 'interview',
      },
      orderBy: {
        code: 'asc',
      },
    })

    const maxTotalScore = criteria.reduce((sum, c) => sum + Number(c.max_score), 0)

    return {
      criteria: criteria.map(c => ({
        id: c.id,
        context: c.context,
        code: c.code,
        name: c.name,
        max_score: Number(c.max_score),
        weight: Number(c.weight),
        description: c.description,
      })),
      maxTotalScore,
    }
  })

/**
 * Save a score entry for an interview
 */
export const saveInterviewScore = createServerFn({ method: 'POST' })
  .inputValidator((data: unknown): { interviewId: string, scores: SaveScoreInput[] } => {
    if (typeof data !== 'object' || data === null) {
      throw new Error('Invalid input')
    }
    const { interviewId, scores } = data as Record<string, unknown>
    if (typeof interviewId !== 'string' || !interviewId) {
      throw new Error('Interview ID is required')
    }
    if (!Array.isArray(scores)) {
      throw new TypeError('Scores must be an array')
    }
    return { interviewId, scores: scores as SaveScoreInput[] }
  })
  .handler(async ({ data }): Promise<SaveScoreResult> => {
    const { interviewId, scores } = data

    try {
      // Verify interview exists
      const session = await prisma.interview_sessions.findUnique({
        where: { id: interviewId },
        select: { id: true, submission_code: true },
      })

      if (!session) {
        return { success: false, error: 'Interview session not found' }
      }

      if (session.submission_code) {
        return { success: false, error: 'Interview already completed' }
      }

      // Save or update score entries
      for (const scoreEntry of scores) {
        await prisma.interview_score_entries.upsert({
          where: {
            interview_session_id_criterion_id: {
              interview_session_id: interviewId,
              criterion_id: scoreEntry.criterion_id,
            },
          },
          update: {
            score: scoreEntry.score,
            comment: scoreEntry.comment || null,
          },
          create: {
            interview_session_id: interviewId,
            criterion_id: scoreEntry.criterion_id,
            score: scoreEntry.score,
            comment: scoreEntry.comment || null,
          },
        })
      }

      return { success: true }
    }
    catch (error) {
      console.error('Error saving interview scores:', error)
      return { success: false, error: 'Failed to save scores' }
    }
  })

/**
 * Calculate interview result based on total score
 */
export function calculateInterviewResult(
  totalScore: number,
  maxScore: number,
): InterviewResult {
  if (maxScore === 0)
    return 'not_ready'

  const percentage = (totalScore / maxScore) * 100

  // Score-to-result mapping
  if (percentage >= 90)
    return 'priority_deploy'
  if (percentage >= 80)
    return 'talent_pool'
  if (percentage >= 70)
    return 'deployable_penyelia_halal'
  if (percentage >= 60)
    return 'training_first'
  if (percentage >= 50)
    return 'training_required'
  return 'not_ready'
}

/**
 * Get interview scores with breakdown
 */
export const getInterviewScores = createServerFn({ method: 'GET' })
  .inputValidator((data: unknown): { interviewId: string } => {
    if (typeof data !== 'object' || data === null) {
      throw new Error('Invalid input')
    }
    const { interviewId } = data as Record<string, unknown>
    if (typeof interviewId !== 'string' || !interviewId) {
      throw new Error('Interview ID is required')
    }
    return { interviewId }
  })
  .handler(async ({ data }): Promise<InterviewScoresResponse> => {
    const { interviewId } = data

    // Get score entries with criterion info
    const entries = await prisma.interview_score_entries.findMany({
      where: {
        interview_session_id: interviewId,
      },
      include: {
        scoring_criteria: {
          select: {
            id: true,
            code: true,
            name: true,
            max_score: true,
          },
        },
      },
    })

    const totalScore = entries.reduce((sum, e) => sum + Number(e.score), 0)
    const maxTotalScore = entries.reduce((sum, e) => sum + Number(e.scoring_criteria.max_score), 0)
    const percentage = maxTotalScore > 0 ? (totalScore / maxTotalScore) * 100 : 0

    // Get the interview session to check if it's completed
    const session = await prisma.interview_sessions.findUnique({
      where: { id: interviewId },
      select: { result: true },
    })

    return {
      entries: entries.map(e => ({
        id: e.id,
        criterion_id: e.criterion_id,
        criterion_name: e.scoring_criteria.name,
        criterion_code: e.scoring_criteria.code,
        max_score: Number(e.scoring_criteria.max_score),
        score: Number(e.score),
        comment: e.comment,
      })),
      totalScore,
      maxTotalScore,
      percentage,
      suggestedResult: session?.result || calculateInterviewResult(totalScore, maxTotalScore),
    }
  })
