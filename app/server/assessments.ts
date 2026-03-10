import type { Prisma } from '@prisma/client'
import { randomBytes } from 'node:crypto'
import { Decimal } from '@prisma/client/runtime/library'
import { createServerFn } from '@tanstack/react-start'
import { prisma } from './db'

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

// Type for assessment list item
export interface AssessmentListItem {
  id: string
  participant_id: string
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

// Type for participant option in dropdown
export interface ParticipantOption {
  id: string
  full_name: string
  email: string | null
  partner_type: string
}

// Type for question bank option in dropdown
export interface QuestionBankOption {
  id: string
  title: string
  description: string | null
  template_code: string | null
}

// Type for form options response
export interface AssessmentFormOptionsResponse {
  participants: ParticipantOption[]
  questionBanks: QuestionBankOption[]
}

// Type for validation error
export interface ValidationError {
  field: string
  message: string
}

// Type for create assessment result
export interface CreateAssessmentResult {
  success: boolean
  assessmentId?: string
  errors?: ValidationError[]
}

// Type for assessments response with pagination
export interface AssessmentsResponse {
  assessments: AssessmentListItem[]
  totalCount: number
  totalPages: number
  currentPage: number
  pageSize: number
}

export const COMPETENCY_RESULTS = [
  'priority_deploy',
  'talent_pool',
  'training_first',
  'hold',
  'senior_halal_compliance',
  'deployable_penyelia_halal',
  'training_required',
  'not_ready',
] as const

export type CompetencyResult = typeof COMPETENCY_RESULTS[number]

export interface GetAssessmentsInput {
  page: number
  pageSize: number
  q: string
  status: AssessmentListItem['status'] | 'all'
  competencyResult: CompetencyResult | 'pending' | 'all'
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

const ASSESSMENT_STATUSES: AssessmentListItem['status'][] = ['not_started', 'in_progress', 'submitted', 'reviewed']

/**
 * Get assessments list with pagination
 */
export const getAssessments = createServerFn({ method: 'GET' })
  .inputValidator((data: unknown): GetAssessmentsInput => {
    if (typeof data !== 'object' || data === null) {
      return { page: 1, pageSize: 20, q: '', status: 'all', competencyResult: 'all' }
    }
    const { page, pageSize, q, status, competencyResult } = data as Record<string, unknown>
    const validatedPage = typeof page === 'number' && page > 0 ? page : 1
    const validatedPageSize = typeof pageSize === 'number' && pageSize > 0 && pageSize <= 100 ? pageSize : 20
    const validatedQuery = typeof q === 'string' ? q.trim() : ''
    const validatedStatus = typeof status === 'string' && ASSESSMENT_STATUSES.includes(status as AssessmentListItem['status'])
      ? status as AssessmentListItem['status']
      : 'all'
    const validatedCompetencyResult = competencyResult === 'pending'
      || (typeof competencyResult === 'string' && COMPETENCY_RESULTS.includes(competencyResult as CompetencyResult))
      ? competencyResult as CompetencyResult | 'pending'
      : 'all'
    return {
      page: validatedPage,
      pageSize: validatedPageSize,
      q: validatedQuery,
      status: validatedStatus,
      competencyResult: validatedCompetencyResult,
    }
  })
  .handler(async ({ data }): Promise<AssessmentsResponse> => {
    const { page, pageSize, q, status, competencyResult } = data
    const where: Prisma.assessment_attemptsWhereInput = {}

    if (q) {
      where.OR = [
        {
          partners_assessment_attempts_participant_idTopartners: {
            full_name: { contains: q, mode: 'insensitive' },
          },
        },
        {
          partners_assessment_attempts_participant_idTopartners: {
            email: { contains: q, mode: 'insensitive' },
          },
        },
        {
          question_banks: {
            title: { contains: q, mode: 'insensitive' },
          },
        },
        {
          question_banks: {
            template_code: { contains: q, mode: 'insensitive' },
          },
        },
      ]
    }

    if (status === 'not_started') {
      where.started_at = null
      where.submitted_at = null
    }
    else if (status === 'in_progress') {
      where.started_at = { not: null }
      where.submitted_at = null
    }
    else if (status === 'submitted') {
      where.submitted_at = { not: null }
      where.competency_result = null
    }
    else if (status === 'reviewed') {
      where.competency_result = { not: null }
    }

    if (competencyResult === 'pending') {
      where.competency_result = null
    }
    else if (competencyResult !== 'all') {
      where.competency_result = competencyResult
    }

    const totalCount = await prisma.assessment_attempts.count({ where })
    const totalPages = Math.max(1, Math.ceil(totalCount / pageSize))
    const currentPage = Math.min(page, totalPages)
    const skip = (currentPage - 1) * pageSize

    const attempts = await prisma.assessment_attempts.findMany({
      where,
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
      }
      else if (attempt.submitted_at && !attempt.competency_result) {
        status = 'submitted'
      }
      else if (attempt.competency_result) {
        status = 'reviewed'
      }

      return {
        id: attempt.id,
        participant_id: attempt.participant_id,
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

    return { assessments, totalCount, totalPages, currentPage, pageSize }
  })

/**
 * Get form options for creating new assessment
 * Returns participants (mitra, candidate, penyelia_halal) and self_assessment question banks
 */
export const getAssessmentFormOptions = createServerFn({ method: 'GET' })
  .handler(async (): Promise<AssessmentFormOptionsResponse> => {
    // Get eligible participants (mitra, candidate, penyelia_halal)
    const participants = await prisma.partners.findMany({
      where: {
        partner_type: {
          in: ['mitra', 'candidate', 'penyelia_halal'],
        },
        is_active: true,
      },
      select: {
        id: true,
        full_name: true,
        email: true,
        partner_type: true,
      },
      orderBy: {
        full_name: 'asc',
      },
    })

    // Get self_assessment question banks
    const questionBanks = await prisma.question_banks.findMany({
      where: {
        purpose: 'self_assessment',
        is_active: true,
      },
      select: {
        id: true,
        title: true,
        description: true,
        template_code: true,
      },
      orderBy: {
        created_at: 'desc',
      },
    })

    return {
      participants: participants.map(p => ({
        id: p.id,
        full_name: p.full_name,
        email: p.email,
        partner_type: p.partner_type,
      })),
      questionBanks: questionBanks.map(qb => ({
        id: qb.id,
        title: qb.title,
        description: qb.description,
        template_code: qb.template_code,
      })),
    }
  })

/**
 * Create a new assessment attempt
 */
export const createAssessment = createServerFn({ method: 'POST' })
  .inputValidator((data: unknown): { participant_id: string, bank_id: string } => {
    if (typeof data !== 'object' || data === null) {
      throw new Error('Invalid input data')
    }
    const { participant_id, bank_id } = data as Record<string, unknown>
    if (typeof participant_id !== 'string' || !participant_id) {
      throw new Error('Participant ID is required')
    }
    if (typeof bank_id !== 'string' || !bank_id) {
      throw new Error('Question bank ID is required')
    }
    return { participant_id, bank_id }
  })
  .handler(async ({ data }): Promise<CreateAssessmentResult> => {
    try {
      const { participant_id, bank_id } = data

      // Generate a unique submission code
      const submission_code = `ASSESS-${randomBytes(4).toString('hex').toUpperCase()}`

      // Create the assessment attempt with started_at timestamp
      const assessment = await prisma.assessment_attempts.create({
        data: {
          participant_id,
          bank_id,
          submission_code,
          started_at: new Date(),
          objective_score: 0,
          essay_score: 0,
          total_score: 0,
        },
      })

      return {
        success: true,
        assessmentId: assessment.id,
      }
    }
    catch (error) {
      console.error('Error creating assessment:', error)
      return {
        success: false,
        errors: [
          {
            field: 'general',
            message: 'Gagal membuat assessment. Silakan coba lagi.',
          },
        ],
      }
    }
  })

/**
 * Question with options for assessment take form
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
 * Assessment attempt session details for taking assessment
 */
export interface AssessmentAttemptSession {
  id: string
  bank_id: string
  participant_id: string
  participant_name: string
  template_title: string
  template_code: string | null
  submission_code: string | null
  started_at: string | null
  submitted_at: string | null
  objective_score: number
  essay_score: number
  total_score: number
  competency_result: string | null
  is_completed: boolean
}

/**
 * Response for take assessment data
 */
export interface TakeAssessmentResponse {
  session: AssessmentAttemptSession
  questions: QuestionWithOption[]
}

/**
 * Input for saving a response
 */
export interface SaveAssessmentResponseInput {
  question_id: string
  answer_text?: string
  selected_option_ids?: string[]
  awarded_score?: number
}

/**
 * Result for saving a response
 */
export interface SaveAssessmentResponseResult {
  success: boolean
  error?: string
}

/**
 * Input for submitting assessment
 */
export interface SubmitAssessmentInput {
  responses: SaveAssessmentResponseInput[]
}

/**
 * Result for submitting assessment
 */
export interface SubmitAssessmentResult {
  success: boolean
  totalScore?: number
  objectiveScore?: number
  essayScore?: number
  error?: string
}

/**
 * Get assessment attempt and questions for taking
 */
export const getTakeAssessment = createServerFn({ method: 'GET' })
  .inputValidator((data: unknown): { attemptId: string } => {
    if (typeof data !== 'object' || data === null) {
      throw new Error('Invalid input')
    }
    const { attemptId } = data as Record<string, unknown>
    if (typeof attemptId !== 'string' || !attemptId) {
      throw new Error('Attempt ID is required')
    }
    return { attemptId }
  })
  .handler(async ({ data }): Promise<TakeAssessmentResponse> => {
    const { attemptId } = data

    // Get assessment attempt with participant and question bank info
    const attempt = await prisma.assessment_attempts.findUnique({
      where: { id: attemptId },
      select: {
        id: true,
        bank_id: true,
        participant_id: true,
        submission_code: true,
        started_at: true,
        submitted_at: true,
        objective_score: true,
        essay_score: true,
        total_score: true,
        competency_result: true,
        partners_assessment_attempts_participant_idTopartners: {
          select: {
            full_name: true,
          },
        },
        question_banks: {
          select: {
            title: true,
            template_code: true,
          },
        },
      },
    })

    if (!attempt) {
      throw new Error('Assessment attempt not found')
    }

    // Check if assessment is already completed
    const is_completed = attempt.submitted_at !== null && attempt.submitted_at !== undefined

    // Get questions from the linked question bank
    let questions: QuestionWithOption[] = []
    if (attempt.bank_id) {
      questions = (await prisma.questions.findMany({
        where: {
          bank_id: attempt.bank_id,
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
        id: attempt.id,
        bank_id: attempt.bank_id,
        participant_id: attempt.participant_id,
        participant_name: attempt.partners_assessment_attempts_participant_idTopartners.full_name,
        template_title: attempt.question_banks.title,
        template_code: attempt.question_banks.template_code,
        submission_code: attempt.submission_code,
        started_at: attempt.started_at?.toISOString() || null,
        submitted_at: attempt.submitted_at?.toISOString() || null,
        objective_score: Number(attempt.objective_score),
        essay_score: Number(attempt.essay_score),
        total_score: Number(attempt.total_score),
        competency_result: attempt.competency_result,
        is_completed,
      },
      questions,
    }
  })

/**
 * Save a response for a question in assessment
 */
export const saveAssessmentResponse = createServerFn({ method: 'POST' })
  .inputValidator((data: unknown): { attemptId: string, responses: SaveAssessmentResponseInput[] } => {
    if (typeof data !== 'object' || data === null) {
      throw new Error('Invalid input')
    }
    const { attemptId, responses } = data as Record<string, unknown>
    if (typeof attemptId !== 'string' || !attemptId) {
      throw new Error('Attempt ID is required')
    }
    if (!Array.isArray(responses)) {
      throw new TypeError('Responses must be an array')
    }
    return { attemptId, responses: responses as SaveAssessmentResponseInput[] }
  })
  .handler(async ({ data }): Promise<SaveAssessmentResponseResult> => {
    const { attemptId, responses } = data

    try {
      // Verify attempt exists
      const attempt = await prisma.assessment_attempts.findUnique({
        where: { id: attemptId },
        select: { id: true, submitted_at: true },
      })

      if (!attempt) {
        return { success: false, error: 'Assessment attempt not found' }
      }

      if (attempt.submitted_at) {
        return { success: false, error: 'Assessment already submitted' }
      }

      // Save or update responses
      for (const response of responses) {
        // For single_choice, use selected_option_ids[0]
        // For multiple_choice, we need to create multiple entries or store as text
        const selected_option_id = response.selected_option_ids?.[0] || null

        // Check if response exists
        const existingResponse = await prisma.assessment_responses.findFirst({
          where: {
            attempt_id: attemptId,
            question_id: response.question_id,
          },
        })

        if (existingResponse) {
          // Update existing response
          await prisma.assessment_responses.update({
            where: {
              id: existingResponse.id,
            },
            data: {
              answer_text: response.answer_text || null,
              selected_option_id,
              awarded_score: response.awarded_score !== undefined && response.awarded_score !== null ? new Decimal(response.awarded_score) : undefined,
            },
          })
        }
        else {
          // Create new response
          await prisma.assessment_responses.create({
            data: {
              attempt_id: attemptId,
              question_id: response.question_id,
              answer_text: response.answer_text || null,
              selected_option_id,
              awarded_score: response.awarded_score !== undefined && response.awarded_score !== null ? new Decimal(response.awarded_score) : undefined,
            },
          })
        }
      }

      return { success: true }
    }
    catch (error) {
      console.error('Error saving assessment responses:', error)
      return { success: false, error: 'Failed to save responses' }
    }
  })

/**
 * Submit/finalize an assessment attempt
 */
export const submitAssessment = createServerFn({ method: 'POST' })
  .inputValidator((data: unknown): { attemptId: string, responses?: SaveAssessmentResponseInput[] } => {
    if (typeof data !== 'object' || data === null) {
      throw new Error('Invalid input')
    }
    const { attemptId, responses } = data as Record<string, unknown>
    if (typeof attemptId !== 'string' || !attemptId) {
      throw new Error('Attempt ID is required')
    }
    return { attemptId, responses: responses as SaveAssessmentResponseInput[] | undefined }
  })
  .handler(async ({ data }): Promise<SubmitAssessmentResult> => {
    const { attemptId, responses } = data

    try {
      // Verify attempt exists
      const attempt = await prisma.assessment_attempts.findUnique({
        where: { id: attemptId },
        select: {
          id: true,
          submitted_at: true,
          bank_id: true,
        },
      })

      if (!attempt) {
        return { success: false, error: 'Assessment attempt not found' }
      }

      if (attempt.submitted_at) {
        return { success: false, error: 'Assessment already submitted' }
      }

      // Save responses if provided
      if (responses && responses.length > 0) {
        for (const response of responses) {
          const selected_option_id = response.selected_option_ids?.[0] || null

          await prisma.assessment_responses.create({
            data: {
              attempt_id: attemptId,
              question_id: response.question_id,
              answer_text: response.answer_text || null,
              selected_option_id,
              awarded_score: response.awarded_score !== undefined && response.awarded_score !== null ? new Decimal(response.awarded_score) : undefined,
            },
          })
        }
      }

      // Calculate scores from saved responses
      const savedResponses = await prisma.assessment_responses.findMany({
        where: {
          attempt_id: attemptId,
        },
        include: {
          questions: {
            select: {
              question_type: true,
              weight: true,
            },
          },
          question_options: {
            select: {
              score_value: true,
              is_correct: true,
            },
          },
        },
      })

      let objectiveScore = 0
      let essayScore = 0

      for (const response of savedResponses) {
        const questionType = response.questions?.question_type
        const weight = Number(response.questions?.weight || 1)

        if (questionType === 'short_text' || questionType === 'long_text') {
          // Essay questions - score will be manually assigned later
          essayScore += Number(response.awarded_score || 0) * weight
        }
        else {
          // Objective questions (single_choice, multiple_choice, rating, date, boolean)
          // Calculate score based on correct answers
          if (response.selected_option_id && response.question_options) {
            // Use is_correct to determine if answer is correct
            if (response.question_options.is_correct) {
              // If the selected option is correct, award the score_value
              objectiveScore += Number(response.question_options.score_value) * weight
            }
            // If not correct, no points awarded (0)
          }
        }
      }

      const totalScore = objectiveScore + essayScore

      // Update the assessment attempt
      await prisma.assessment_attempts.update({
        where: { id: attemptId },
        data: {
          submitted_at: new Date(),
          objective_score: new Decimal(objectiveScore || 0),
          essay_score: new Decimal(essayScore || 0),
          total_score: new Decimal(totalScore || 0),
        },
      })

      return {
        success: true,
        totalScore,
        objectiveScore,
        essayScore,
      }
    }
    catch (error) {
      console.error('Error submitting assessment:', error)
      return { success: false, error: 'Failed to submit assessment' }
    }
  })

/**
 * Assessment result details for display
 */
export interface QuestionResult {
  id: string
  prompt: string
  question_type: string
  section_title: string | null
  user_answer: string | null
  selected_option_label: string | null
  correct_option_label: string | null
  is_correct: boolean | null
  awarded_score: number
  max_score: number
}

export interface AssessmentResultResponse {
  session: AssessmentAttemptSession
  results: QuestionResult[]
  totalQuestions: number
  correctAnswers: number
  incorrectAnswers: number
}

/**
 * Get assessment results for display after submission
 */
export const getAssessmentResults = createServerFn({ method: 'GET' })
  .inputValidator((data: unknown): { attemptId: string } => {
    if (typeof data !== 'object' || data === null) {
      throw new Error('Invalid input')
    }
    const { attemptId } = data as Record<string, unknown>
    if (typeof attemptId !== 'string' || !attemptId) {
      throw new Error('Attempt ID is required')
    }
    return { attemptId }
  })
  .handler(async ({ data }): Promise<AssessmentResultResponse> => {
    const { attemptId } = data

    // Get assessment attempt with participant and question bank info
    const attempt = await prisma.assessment_attempts.findUnique({
      where: { id: attemptId },
      select: {
        id: true,
        bank_id: true,
        participant_id: true,
        submission_code: true,
        started_at: true,
        submitted_at: true,
        objective_score: true,
        essay_score: true,
        total_score: true,
        competency_result: true,
        partners_assessment_attempts_participant_idTopartners: {
          select: {
            full_name: true,
          },
        },
        question_banks: {
          select: {
            title: true,
            template_code: true,
          },
        },
      },
    })

    if (!attempt) {
      throw new Error('Assessment attempt not found')
    }

    const session: AssessmentAttemptSession = {
      id: attempt.id,
      bank_id: attempt.bank_id,
      participant_id: attempt.participant_id,
      participant_name: attempt.partners_assessment_attempts_participant_idTopartners.full_name,
      template_title: attempt.question_banks.title,
      template_code: attempt.question_banks.template_code,
      submission_code: attempt.submission_code,
      started_at: attempt.started_at?.toISOString() || null,
      submitted_at: attempt.submitted_at?.toISOString() || null,
      objective_score: Number(attempt.objective_score),
      essay_score: Number(attempt.essay_score),
      total_score: Number(attempt.total_score),
      competency_result: attempt.competency_result,
      is_completed: !!attempt.submitted_at,
    }

    // Get questions and responses
    const questions = await prisma.questions.findMany({
      where: {
        bank_id: attempt.bank_id,
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
    })

    // Get user responses
    const responses = await prisma.assessment_responses.findMany({
      where: {
        attempt_id: attemptId,
      },
      include: {
        question_options: {
          select: {
            option_label: true,
            is_correct: true,
            score_value: true,
          },
        },
        questions: {
          select: {
            id: true,
            question_type: true,
          },
        },
      },
    })

    // Build results
    const results: QuestionResult[] = []
    let correctAnswers = 0
    let incorrectAnswers = 0

    for (const question of questions) {
      const response = responses.find(r => r.question_id === question.id)

      // Find the correct option(s)
      const correctOptions = question.question_options.filter(opt => opt.is_correct)
      const correctOptionLabels = correctOptions.map(opt => opt.option_label).join(', ')
      const maxScore = correctOptions.reduce((sum, opt) => sum + Number(opt.score_value), 0)

      let userAnswer: string | null = null
      let selectedOptionLabel: string | null = null
      let isCorrect: boolean | null = null
      let awardedScore = 0

      if (response) {
        userAnswer = response.answer_text
        awardedScore = Number(response.awarded_score)

        if (response.question_options) {
          selectedOptionLabel = response.question_options.option_label
          isCorrect = response.question_options.is_correct

          if (isCorrect) {
            correctAnswers++
          }
          else {
            incorrectAnswers++
          }
        }
        else if (question.question_type === 'short_text' || question.question_type === 'long_text') {
          // Essay questions don't have correct/incorrect
          awardedScore = Number(response.awarded_score)
        }
      }

      results.push({
        id: question.id,
        prompt: question.prompt,
        question_type: question.question_type,
        section_title: question.section_title,
        user_answer: userAnswer,
        selected_option_label: selectedOptionLabel,
        correct_option_label: correctOptionLabels,
        is_correct: isCorrect,
        awarded_score: awardedScore,
        max_score: maxScore,
      })
    }

    return {
      session,
      results,
      totalQuestions: questions.length,
      correctAnswers,
      incorrectAnswers,
    }
  })
