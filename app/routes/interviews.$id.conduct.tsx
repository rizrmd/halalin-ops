import * as React from 'react'
import { createFileRoute } from '@tanstack/react-router'
import {
  getConductInterview,
  saveInterviewResponse,
  completeInterview,
  getScoringCriteria,
  saveInterviewScore,
  calculateInterviewResult,
  type ConductInterviewResponse,
  type QuestionWithOption,
  type InterviewResult,
  type ScoringCriterion,
  INTERVIEW_RESULTS,
  INTERVIEW_RESULT_LABELS,
  QUESTION_TYPE_LABELS,
} from '../server/interviews'

export const Route = createFileRoute('/interviews/$id/conduct')({
  component: ConductInterviewComponent,
  beforeLoad: async ({ context }) => {
    if (!context.user) {
      throw new Error('UNAUTHORIZED')
    }
    return { user: context.user }
  },
  loader: async ({ params }): Promise<ConductInterviewResponse & { criteria: ScoringCriterion[]; maxTotalScore: number }> => {
    const [interviewData, scoringData] = await Promise.all([
      getConductInterview({ data: { interviewId: params.id } }),
      getScoringCriteria({}),
    ])
    return {
      ...interviewData,
      criteria: scoringData.criteria,
      maxTotalScore: scoringData.maxTotalScore,
    }
  },
})

interface ResponseData {
  question_id: string
  response_text?: string
  selected_option_ids?: string[]
  awarded_score?: number
}

interface FormData {
  responses: ResponseData[]
  result?: InterviewResult
  total_score?: number
  notes: string
}

function ConductInterviewComponent() {
  const initialData = Route.useLoaderData() as ConductInterviewResponse & { criteria: ScoringCriterion[]; maxTotalScore: number }
  const { user } = Route.useRouteContext() as { user: { id: string; name: string; email: string | null; partnerType: string } }
  
  const [session] = React.useState(initialData.session)
  const [questions] = React.useState(initialData.questions)
  const [criteria] = React.useState(initialData.criteria)
  const [maxTotalScore] = React.useState(initialData.maxTotalScore)
  const [currentQuestionIndex, setCurrentQuestionIndex] = React.useState(0)
  const [responses, setResponses] = React.useState<ResponseData[]>([])
  const [scores, setScores] = React.useState<Record<string, { score: string; comment: string }>>({})
  const [result, setResult] = React.useState<InterviewResult | ''>('')
  const [totalScore, setTotalScore] = React.useState<string>('')
  const [notes, setNotes] = React.useState(session.notes || '')
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [success, setSuccess] = React.useState(false)

  // Calculate total score and suggest result based on scores
  React.useEffect(() => {
    const calculatedTotal = Object.values(scores).reduce((sum, s) => {
      const scoreValue = parseFloat(s.score) || 0
      return sum + scoreValue
    }, 0)
    
    setTotalScore(calculatedTotal.toFixed(2))
    
    // Auto-suggest result based on calculated score
    if (maxTotalScore > 0 && !result) {
      const suggestedResult = calculateInterviewResult(calculatedTotal, maxTotalScore)
      // Don't auto-set, just keep it available
    }
  }, [scores, maxTotalScore])

  // Initialize responses array based on questions
  React.useEffect(() => {
    if (questions.length > 0 && responses.length === 0) {
      const initialResponses: ResponseData[] = questions.map(q => ({
        question_id: q.id,
        response_text: '',
        selected_option_ids: [],
        awarded_score: undefined,
      }))
      setResponses(initialResponses)
    }
  }, [questions])

  const currentQuestion = questions[currentQuestionIndex]
  const totalQuestions = questions.length

  const handleResponseChange = (field: 'response_text' | 'selected_option_ids' | 'awarded_score', value: string | string[] | number) => {
    setResponses(prev => {
      const newResponses = [...prev]
      const currentResponse = { ...newResponses[currentQuestionIndex] }
      
      if (field === 'response_text') {
        currentResponse.response_text = value as string
      } else if (field === 'selected_option_ids') {
        currentResponse.selected_option_ids = value as string[]
      } else if (field === 'awarded_score') {
        currentResponse.awarded_score = typeof value === 'number' ? value : parseFloat(value as string)
      }
      
      newResponses[currentQuestionIndex] = currentResponse
      return newResponses
    })
    if (error) setError(null)
  }

  const handleScoreChange = (criterionId: string, field: 'score' | 'comment', value: string) => {
    setScores(prev => ({
      ...prev,
      [criterionId]: {
        ...prev[criterionId],
        [field]: value,
      },
    }))
    if (error) setError(null)
  }

  const handleSaveScores = async () => {
    if (criteria.length === 0) return

    setIsSubmitting(true)
    setError(null)

    try {
      const scoresToSave = Object.entries(scores).map(([criterionId, data]) => ({
        criterion_id: criterionId,
        score: parseFloat(data.score) || 0,
        comment: data.comment || undefined,
      }))

      if (scoresToSave.length === 0) {
        setIsSubmitting(false)
        return
      }

      const result = await saveInterviewScore({
        data: {
          interviewId: session.id,
          scores: scoresToSave,
        },
      })

      if (!result.success) {
        setError(result.error || 'Gagal menyimpan penilaian')
      }
    } catch (err) {
      console.error('Error saving scores:', err)
      setError('Terjadi kesalahan saat menyimpan penilaian')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSaveResponses = async () => {
    if (!currentQuestion) return

    setIsSubmitting(true)
    setError(null)

    try {
      const responseToSave = responses[currentQuestionIndex]
      const result = await saveInterviewResponse({
        data: {
          interviewId: session.id,
          responses: [responseToSave],
        },
      })

      if (!result.success) {
        setError(result.error || 'Gagal menyimpan jawaban')
      }
    } catch (err) {
      console.error('Error saving response:', err)
      setError('Terjadi kesalahan saat menyimpan jawaban')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleNavigate = (direction: 'prev' | 'next') => {
    if (direction === 'prev' && currentQuestionIndex > 0) {
      handleSaveResponses()
      setCurrentQuestionIndex(prev => prev - 1)
    } else if (direction === 'next' && currentQuestionIndex < totalQuestions - 1) {
      handleSaveResponses()
      setCurrentQuestionIndex(prev => prev + 1)
    }
  }

  const handleSubmitFinal = async () => {
    // Save all responses first
    setIsSubmitting(true)
    setError(null)

    try {
      // Save all responses
      const saveResult = await saveInterviewResponse({
        data: {
          interviewId: session.id,
          responses: responses.filter(r => 
            r.response_text || r.selected_option_ids?.length || r.awarded_score
          ),
        },
      })

      if (!saveResult.success) {
        setError(saveResult.error || 'Gagal menyimpan jawaban')
        return
      }

      // Save scoring criteria
      if (criteria.length > 0) {
        const scoresToSave = Object.entries(scores).map(([criterionId, data]) => ({
          criterion_id: criterionId,
          score: parseFloat(data.score) || 0,
          comment: data.comment || undefined,
        }))

        if (scoresToSave.length > 0) {
          const scoreResult = await saveInterviewScore({
            data: {
              interviewId: session.id,
              scores: scoresToSave,
            },
          })

          if (!scoreResult.success) {
            setError(scoreResult.error || 'Gagal menyimpan penilaian')
            return
          }
        }
      }

      // Complete the interview
      const completeResult = await completeInterview({
        data: {
          interviewId: session.id,
          completionData: {
            result: result as InterviewResult || undefined,
            total_score: totalScore ? parseFloat(totalScore) : undefined,
            notes: notes || undefined,
          },
        },
      })

      if (!completeResult.success) {
        setError(completeResult.error || 'Gagal menyelesaikan wawancara')
        return
      }

      setSuccess(true)
      setTimeout(() => {
        window.location.href = '/interviews'
      }, 2000)
    } catch (err) {
      console.error('Error completing interview:', err)
      setError('Terjadi kesalahan saat menyelesaikan wawancara')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    if (window.confirm('Apakah Anda yakin ingin membatalkan? Jawaban yang belum disimpan akan hilang.')) {
      window.location.href = '/interviews'
    }
  }

  const renderQuestionInput = (question: QuestionWithOption, response: ResponseData) => {
    const questionType = question.question_type as keyof typeof QUESTION_TYPE_LABELS

    switch (questionType) {
      case 'short_text':
        return (
          <input
            type="text"
            value={response.response_text || ''}
            onChange={(e) => handleResponseChange('response_text', e.target.value)}
            style={inputStyle}
            placeholder="Jawaban Anda"
            disabled={isSubmitting || success}
          />
        )

      case 'long_text':
        return (
          <textarea
            value={response.response_text || ''}
            onChange={(e) => handleResponseChange('response_text', e.target.value)}
            style={{ ...inputStyle, minHeight: '120px', resize: 'vertical' }}
            placeholder="Jawaban Anda"
            rows={5}
            disabled={isSubmitting || success}
          />
        )

      case 'single_choice':
        return (
          <div style={radioGroupStyle}>
            {question.question_options.map((option) => (
              <label
                key={option.id}
                style={{
                  ...radioLabelStyle,
                  ...(response.selected_option_ids?.includes(option.id) ? radioSelectedStyle : {}),
                }}
              >
                <input
                  type="radio"
                  name={`question_${question.id}`}
                  value={option.id}
                  checked={response.selected_option_ids?.includes(option.id) || false}
                  onChange={(e) => handleResponseChange('selected_option_ids', [e.target.value])}
                  disabled={isSubmitting || success}
                  style={{ cursor: 'pointer' }}
                />
                <span>{option.option_label}</span>
                {Number(option.score_value) > 0 && (
                  <span style={scoreBadgeStyle}>({Number(option.score_value)} poin)</span>
                )}
              </label>
            ))}
          </div>
        )

      case 'multiple_choice':
        return (
          <div style={checkboxGroupStyle}>
            {question.question_options.map((option) => (
              <label
                key={option.id}
                style={{
                  ...checkboxLabelStyle,
                  ...(response.selected_option_ids?.includes(option.id) ? checkboxSelectedStyle : {}),
                }}
              >
                <input
                  type="checkbox"
                  value={option.id}
                  checked={response.selected_option_ids?.includes(option.id) || false}
                  onChange={(e) => {
                    const current = response.selected_option_ids || []
                    const newValue = e.target.checked
                      ? [...current, option.id]
                      : current.filter(id => id !== option.id)
                    handleResponseChange('selected_option_ids', newValue)
                  }}
                  disabled={isSubmitting || success}
                  style={{ cursor: 'pointer' }}
                />
                <span>{option.option_label}</span>
                {Number(option.score_value) > 0 && (
                  <span style={scoreBadgeStyle}>({Number(option.score_value)} poin)</span>
                )}
              </label>
            ))}
          </div>
        )

      case 'rating':
        return (
          <div style={ratingGroupStyle}>
            {[1, 2, 3, 4, 5].map((rating) => (
              <button
                key={rating}
                type="button"
                onClick={() => handleResponseChange('awarded_score', rating)}
                style={{
                  ...ratingButtonStyle,
                  ...(response.awarded_score === rating ? ratingSelectedStyle : {}),
                }}
                disabled={isSubmitting || success}
              >
                {rating}
              </button>
            ))}
          </div>
        )

      case 'date':
        return (
          <input
            type="date"
            value={response.response_text || ''}
            onChange={(e) => handleResponseChange('response_text', e.target.value)}
            style={inputStyle}
            disabled={isSubmitting || success}
          />
        )

      case 'boolean':
        return (
          <div style={radioGroupStyle}>
            <label
              style={{
                ...radioLabelStyle,
                ...(response.response_text === 'true' ? radioSelectedStyle : {}),
              }}
            >
              <input
                type="radio"
                name={`question_${question.id}_boolean`}
                value="true"
                checked={response.response_text === 'true'}
                onChange={(e) => handleResponseChange('response_text', e.target.value)}
                disabled={isSubmitting || success}
                style={{ cursor: 'pointer' }}
              />
              Ya
            </label>
            <label
              style={{
                ...radioLabelStyle,
                ...(response.response_text === 'false' ? radioSelectedStyle : {}),
              }}
            >
              <input
                type="radio"
                name={`question_${question.id}_boolean`}
                value="false"
                checked={response.response_text === 'false'}
                onChange={(e) => handleResponseChange('response_text', e.target.value)}
                disabled={isSubmitting || success}
                style={{ cursor: 'pointer' }}
              />
              Tidak
            </label>
          </div>
        )

      default:
        return (
          <input
            type="text"
            value={response.response_text || ''}
            onChange={(e) => handleResponseChange('response_text', e.target.value)}
            style={inputStyle}
            placeholder="Jawaban Anda"
            disabled={isSubmitting || success}
          />
        )
    }
  }

  // Styles
  const containerStyle: React.CSSProperties = {
    maxWidth: '1280px',
    margin: '0 auto',
    padding: '2rem 1rem',
  }

  const headerStyle: React.CSSProperties = {
    marginBottom: '1.5rem',
  }

  const titleStyle: React.CSSProperties = {
    fontSize: '1.875rem',
    fontWeight: 'bold',
    color: '#111827',
    margin: 0,
  }

  const infoCardStyle: React.CSSProperties = {
    backgroundColor: 'white',
    borderRadius: '0.5rem',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    padding: '1.5rem',
    marginBottom: '1.5rem',
  }

  const infoGridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(1, 1fr)',
    gap: '1rem',
  }

  const infoLabelStyle: React.CSSProperties = {
    fontSize: '0.75rem',
    fontWeight: 600,
    color: '#6b7280',
    textTransform: 'uppercase',
    marginBottom: '0.25rem',
  }

  const infoValueStyle: React.CSSProperties = {
    fontSize: '1rem',
    color: '#111827',
    fontWeight: 500,
  }

  const progressContainerStyle: React.CSSProperties = {
    marginBottom: '1.5rem',
  }

  const progressStyle: React.CSSProperties = {
    height: '0.5rem',
    backgroundColor: '#e5e7eb',
    borderRadius: '9999px',
    overflow: 'hidden',
    marginBottom: '0.5rem',
  }

  const progressBarStyle: React.CSSProperties = {
    height: '100%',
    backgroundColor: '#2563eb',
    transition: 'width 0.3s ease',
    width: `${((currentQuestionIndex + 1) / totalQuestions) * 100}%`,
  }

  const progressTextStyle: React.CSSProperties = {
    fontSize: '0.875rem',
    color: '#6b7280',
    textAlign: 'right',
  }

  const questionCardStyle: React.CSSProperties = {
    backgroundColor: 'white',
    borderRadius: '0.5rem',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    padding: '1.5rem',
    marginBottom: '1.5rem',
  }

  const questionHeaderStyle: React.CSSProperties = {
    marginBottom: '1rem',
  }

  const questionMetaStyle: React.CSSProperties = {
    fontSize: '0.75rem',
    color: '#6b7280',
    marginBottom: '0.5rem',
  }

  const questionPromptStyle: React.CSSProperties = {
    fontSize: '1.125rem',
    fontWeight: 600,
    color: '#111827',
    marginBottom: '0.75rem',
  }

  const questionHelpStyle: React.CSSProperties = {
    fontSize: '0.875rem',
    color: '#6b7280',
    fontStyle: 'italic',
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '0.625rem 0.75rem',
    border: '1px solid #d1d5db',
    borderRadius: '0.375rem',
    fontSize: '0.875rem',
    color: '#111827',
    backgroundColor: 'white',
    boxSizing: 'border-box',
  }

  const radioGroupStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  }

  const radioLabelStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    cursor: 'pointer',
    fontSize: '0.875rem',
    color: '#374151',
    padding: '0.75rem 1rem',
    border: '1px solid #d1d5db',
    borderRadius: '0.375rem',
    backgroundColor: 'white',
    transition: 'all 0.2s',
  }

  const radioSelectedStyle: React.CSSProperties = {
    backgroundColor: '#eff6ff',
    borderColor: '#2563eb',
  }

  const checkboxGroupStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  }

  const checkboxLabelStyle: React.CSSProperties = {
    ...radioLabelStyle,
  }

  const checkboxSelectedStyle: React.CSSProperties = {
    ...radioSelectedStyle,
  }

  const ratingGroupStyle: React.CSSProperties = {
    display: 'flex',
    gap: '0.5rem',
  }

  const ratingButtonStyle: React.CSSProperties = {
    width: '3rem',
    height: '3rem',
    border: '2px solid #d1d5db',
    borderRadius: '0.5rem',
    fontSize: '1.125rem',
    fontWeight: 600,
    color: '#374151',
    backgroundColor: 'white',
    cursor: 'pointer',
    transition: 'all 0.2s',
  }

  const ratingSelectedStyle: React.CSSProperties = {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
    color: 'white',
  }

  const scoreBadgeStyle: React.CSSProperties = {
    marginLeft: 'auto',
    fontSize: '0.75rem',
    color: '#16a34a',
    fontWeight: 600,
  }

  const navigationStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '1rem',
    marginTop: '1.5rem',
    paddingTop: '1.5rem',
    borderTop: '1px solid #e5e7eb',
  }

  const buttonBaseStyle: React.CSSProperties = {
    padding: '0.75rem 1.5rem',
    fontSize: '0.875rem',
    fontWeight: 500,
    borderRadius: '0.375rem',
    cursor: 'pointer',
    transition: 'all 0.2s',
    minHeight: '44px',
  }

  const secondaryButtonStyle: React.CSSProperties = {
    ...buttonBaseStyle,
    backgroundColor: 'white',
    border: '1px solid #d1d5db',
    color: '#374151',
  }

  const primaryButtonStyle: React.CSSProperties = {
    ...buttonBaseStyle,
    backgroundColor: '#2563eb',
    border: '1px solid #2563eb',
    color: 'white',
  }

  const disabledButtonStyle: React.CSSProperties = {
    ...primaryButtonStyle,
    backgroundColor: '#9ca3af',
    borderColor: '#9ca3af',
    cursor: 'not-allowed',
  }

  const errorAlertStyle: React.CSSProperties = {
    backgroundColor: '#fef2f2',
    border: '1px solid #fecaca',
    borderRadius: '0.375rem',
    padding: '1rem',
    marginBottom: '1rem',
    color: '#dc2626',
  }

  const successAlertStyle: React.CSSProperties = {
    backgroundColor: '#dcfce7',
    border: '1px solid #86efac',
    borderRadius: '0.375rem',
    padding: '1rem',
    marginBottom: '1rem',
    color: '#166534',
  }

  const finalSectionStyle: React.CSSProperties = {
    backgroundColor: 'white',
    borderRadius: '0.5rem',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    padding: '1.5rem',
    marginTop: '2rem',
  }

  const finalSectionTitleStyle: React.CSSProperties = {
    fontSize: '1.25rem',
    fontWeight: 600,
    color: '#111827',
    marginBottom: '1rem',
  }

  const formGroupStyle: React.CSSProperties = {
    marginBottom: '1.5rem',
  }

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '0.875rem',
    fontWeight: 500,
    color: '#374151',
    marginBottom: '0.375rem',
  }

  const textareaStyle: React.CSSProperties = {
    ...inputStyle,
    minHeight: '100px',
    resize: 'vertical',
  }

  const selectStyle: React.CSSProperties = {
    ...inputStyle,
    cursor: 'pointer',
    appearance: 'none',
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3E%3C/svg%3E")`,
    backgroundPosition: 'right 0.5rem center',
    backgroundRepeat: 'no-repeat',
    backgroundSize: '1.5em 1.5em',
    paddingRight: '2.5rem',
  }

  if (success) {
    return (
      <div style={containerStyle}>
        <div style={successAlertStyle}>
          <p style={{ fontWeight: 600, marginBottom: '0.5rem' }}>Wawancara Berhasil Diselesaikan!</p>
          <p>Mengalihkan ke daftar wawancara...</p>
        </div>
      </div>
    )
  }

  return (
    <div style={containerStyle}>
      <style>{`
        @media (min-width: 640px) {
          .info-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
      `}</style>

      <div style={headerStyle}>
        <h1 style={titleStyle}>Lakukan Wawancara</h1>
        <p style={{ fontSize: '1rem', color: '#6b7280', marginTop: '0.5rem' }}>
          Jawab pertanyaan berdasarkan performa kandidat
        </p>
      </div>

      {error && <div style={errorAlertStyle} role="alert">{error}</div>}

      {/* Session Info */}
      <div style={infoCardStyle}>
        <div className="info-grid" style={infoGridStyle}>
          <div>
            <div style={infoLabelStyle}>Kandidat</div>
            <div style={infoValueStyle}>{session.candidate_name}</div>
          </div>
          <div>
            <div style={infoLabelStyle}>Tanggal</div>
            <div style={infoValueStyle}>{session.interview_date}</div>
          </div>
          <div>
            <div style={infoLabelStyle}>Mode</div>
            <div style={infoValueStyle}>{session.interview_mode || '-'}</div>
          </div>
          <div>
            <div style={infoLabelStyle}>Pewawancara</div>
            <div style={infoValueStyle}>{session.interviewer_name || '-'}</div>
          </div>
          {session.objective && (
            <div style={{ gridColumn: '1 / -1' }}>
              <div style={infoLabelStyle}>Tujuan</div>
              <div style={infoValueStyle}>{session.objective}</div>
            </div>
          )}
        </div>
      </div>

      {totalQuestions === 0 ? (
        <div style={infoCardStyle}>
          <p style={{ color: '#f59e0b', fontWeight: 500 }}>
            Tidak ada pertanyaan untuk wawancara ini. Template pertanyaan belum ditautkan atau kosong.
          </p>
          <div style={{ marginTop: '1.5rem' }}>
            <button
              onClick={handleSubmitFinal}
              style={primaryButtonStyle}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Menyelesaikan...' : 'Selesaikan Wawancara Tanpa Pertanyaan'}
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Progress Bar */}
          <div style={progressContainerStyle}>
            <div style={progressStyle}>
              <div style={progressBarStyle} />
            </div>
            <div style={progressTextStyle}>
              Pertanyaan {currentQuestionIndex + 1} dari {totalQuestions}
            </div>
          </div>

          {/* Question Card */}
          {currentQuestion && (
            <div style={questionCardStyle}>
              <div style={questionHeaderStyle}>
                {currentQuestion.section_title && (
                  <div style={questionMetaStyle}>
                    Bagian: {currentQuestion.section_title}
                  </div>
                )}
                <div style={questionPromptStyle}>
                  {currentQuestion.prompt}
                  {currentQuestion.is_required && (
                    <span style={{ color: '#dc2626', marginLeft: '0.25rem' }}>*</span>
                  )}
                </div>
                {currentQuestion.help_text && (
                  <div style={questionHelpStyle}>
                    {currentQuestion.help_text}
                  </div>
                )}
              </div>

              {renderQuestionInput(currentQuestion, responses[currentQuestionIndex])}

              {/* Navigation */}
              <div style={navigationStyle}>
                <button
                  onClick={() => handleNavigate('prev')}
                  style={currentQuestionIndex === 0 ? { ...secondaryButtonStyle, opacity: 0.5, cursor: 'not-allowed' } : secondaryButtonStyle}
                  disabled={currentQuestionIndex === 0 || isSubmitting}
                >
                  ← Sebelumnya
                </button>

                {currentQuestionIndex === totalQuestions - 1 ? (
                  <button
                    onClick={() => document.getElementById('final-section')?.scrollIntoView({ behavior: 'smooth' })}
                    style={primaryButtonStyle}
                    disabled={isSubmitting}
                  >
                    Lanjut ke Penilaian →
                  </button>
                ) : (
                  <button
                    onClick={() => handleNavigate('next')}
                    style={primaryButtonStyle}
                    disabled={isSubmitting}
                  >
                    Berikutnya →
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Final Section */}
          <div id="final-section" style={finalSectionStyle}>
            <h2 style={finalSectionTitleStyle}>Penilaian Akhir</h2>

            {/* Scoring Criteria Section */}
            {criteria.length > 0 && (
              <div style={{ marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#111827', marginBottom: '1rem' }}>
                  Kriteria Penilaian
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {criteria.map((criterion) => (
                    <div key={criterion.id} style={{ padding: '1rem', border: '1px solid #e5e7eb', borderRadius: '0.5rem' }}>
                      <div style={{ marginBottom: '0.75rem' }}>
                        <div style={{ fontWeight: 600, color: '#111827', marginBottom: '0.25rem' }}>
                          {criterion.name}
                        </div>
                        {criterion.description && (
                          <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                            {criterion.description}
                          </div>
                        )}
                        <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.25rem' }}>
                          Skor Maksimal: {criterion.max_score}
                        </div>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1rem', alignItems: 'start' }}>
                        <div>
                          <label htmlFor={`score_${criterion.id}`} style={{ ...labelStyle, marginBottom: '0.25rem' }}>
                            Skor
                          </label>
                          <input
                            type="number"
                            id={`score_${criterion.id}`}
                            value={scores[criterion.id]?.score || ''}
                            onChange={(e) => handleScoreChange(criterion.id, 'score', e.target.value)}
                            style={inputStyle}
                            placeholder="0"
                            step="0.01"
                            min="0"
                            max={criterion.max_score}
                            disabled={isSubmitting || success}
                          />
                        </div>
                        <div>
                          <label htmlFor={`comment_${criterion.id}`} style={{ ...labelStyle, marginBottom: '0.25rem' }}>
                            Komentar
                          </label>
                          <input
                            type="text"
                            id={`comment_${criterion.id}`}
                            value={scores[criterion.id]?.comment || ''}
                            onChange={(e) => handleScoreChange(criterion.id, 'comment', e.target.value)}
                            style={inputStyle}
                            placeholder="Catatan untuk kriteria ini"
                            disabled={isSubmitting || success}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Score Summary */}
                <div style={{ marginTop: '1.5rem', padding: '1rem', backgroundColor: '#f9fafb', borderRadius: '0.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontWeight: 600, color: '#374151' }}>Total Skor</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#2563eb' }}>
                      {totalScore || '0'} / {maxTotalScore}
                    </div>
                  </div>
                  {totalScore && maxTotalScore > 0 && (
                    <div style={{ marginTop: '0.5rem', textAlign: 'right', fontSize: '0.875rem', color: '#6b7280' }}>
                      {((parseFloat(totalScore) / maxTotalScore) * 100).toFixed(1)}% dari skor maksimal
                    </div>
                  )}
                  {totalScore && maxTotalScore > 0 && !result && (
                    <div style={{ marginTop: '0.5rem', textAlign: 'right', fontSize: '0.875rem', color: '#16a34a', fontWeight: 500 }}>
                      Hasil yang disarankan: {INTERVIEW_RESULT_LABELS[calculateInterviewResult(parseFloat(totalScore), maxTotalScore)]}
                    </div>
                  )}
                </div>
              </div>
            )}

            <div style={formGroupStyle}>
              <label htmlFor="result" style={labelStyle}>Hasil Wawancara</label>
              <select
                id="result"
                value={result}
                onChange={(e) => setResult(e.target.value as InterviewResult | '')}
                style={selectStyle}
                disabled={isSubmitting || success}
              >
                <option value="">Pilih Hasil</option>
                {INTERVIEW_RESULTS.map(r => (
                  <option key={r} value={r}>{INTERVIEW_RESULT_LABELS[r]}</option>
                ))}
              </select>
            </div>

            <div style={formGroupStyle}>
              <label htmlFor="totalScore" style={labelStyle}>Total Skor</label>
              <input
                type="number"
                id="totalScore"
                value={totalScore}
                onChange={(e) => setTotalScore(e.target.value)}
                style={inputStyle}
                placeholder="Masukkan total skor"
                step="0.01"
                min="0"
                disabled={isSubmitting || success}
              />
            </div>

            <div style={formGroupStyle}>
              <label htmlFor="finalNotes" style={labelStyle}>Catatan Akhir</label>
              <textarea
                id="finalNotes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                style={textareaStyle}
                placeholder="Catatan tambahan untuk wawancara ini"
                rows={4}
                disabled={isSubmitting || success}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
              <button
                type="button"
                onClick={handleCancel}
                style={secondaryButtonStyle}
                disabled={isSubmitting}
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSubmitFinal}
                style={isSubmitting ? disabledButtonStyle : primaryButtonStyle}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Menyimpan...' : 'Selesaikan Wawancara'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
