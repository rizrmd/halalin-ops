import * as React from 'react'
import { createFileRoute } from '@tanstack/react-router'
import {
  getTakeAssessment,
  saveAssessmentResponse,
  submitAssessment,
  type TakeAssessmentResponse,
  type QuestionWithOption,
  QUESTION_TYPE_LABELS,
} from '../server/assessments'

export const Route = createFileRoute('/assessments/$id/take')({
  component: TakeAssessmentComponent,
  beforeLoad: async ({ context }) => {
    if (!context.user) {
      throw new Error('UNAUTHORIZED')
    }
    return { user: context.user }
  },
  loader: async ({ params }): Promise<TakeAssessmentResponse> => {
    return await getTakeAssessment({ data: { attemptId: params.id } })
  },
})

interface ResponseData {
  question_id: string
  answer_text?: string
  selected_option_ids?: string[]
  awarded_score?: number
}

function TakeAssessmentComponent() {
  const initialData = Route.useLoaderData() as TakeAssessmentResponse
  const { user } = Route.useRouteContext() as { user: { id: string; name: string; email: string | null; partnerType: string } }
  
  const [session] = React.useState(initialData.session)
  const [questions] = React.useState(initialData.questions)
  const [currentQuestionIndex, setCurrentQuestionIndex] = React.useState(0)
  const [responses, setResponses] = React.useState<ResponseData[]>([])
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [success, setSuccess] = React.useState(false)
  const [autoSaveStatus, setAutoSaveStatus] = React.useState<'saved' | 'saving' | 'idle'>('idle')

  // Initialize responses array based on questions
  React.useEffect(() => {
    if (questions.length > 0 && responses.length === 0) {
      const initialResponses: ResponseData[] = questions.map(q => ({
        question_id: q.id,
        answer_text: '',
        selected_option_ids: [],
        awarded_score: undefined,
      }))
      setResponses(initialResponses)
    }
  }, [questions])

  const currentQuestion = questions[currentQuestionIndex]
  const totalQuestions = questions.length

  const handleResponseChange = (field: 'answer_text' | 'selected_option_ids' | 'awarded_score', value: string | string[] | number) => {
    setResponses(prev => {
      const newResponses = [...prev]
      const currentResponse = { ...newResponses[currentQuestionIndex] }
      
      if (field === 'answer_text') {
        currentResponse.answer_text = value as string
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

  const handleAutoSave = React.useCallback(async () => {
    if (!currentQuestion || isSubmitting || success) return

    setAutoSaveStatus('saving')
    
    try {
      const responseToSave = responses[currentQuestionIndex]
      const result = await saveAssessmentResponse({
        data: {
          attemptId: session.id,
          responses: [responseToSave],
        },
      })

      if (result.success) {
        setAutoSaveStatus('saved')
        setTimeout(() => setAutoSaveStatus('idle'), 2000)
      } else {
        setAutoSaveStatus('idle')
      }
    } catch (err) {
      console.error('Error auto-saving response:', err)
      setAutoSaveStatus('idle')
    }
  }, [currentQuestion, currentQuestionIndex, responses, session.id, isSubmitting, success])

  // Auto-save on response change with debounce
  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (currentQuestion && responses[currentQuestionIndex]) {
        handleAutoSave()
      }
    }, 1000) // Save 1 second after last change

    return () => clearTimeout(timer)
  }, [responses, currentQuestionIndex, handleAutoSave, currentQuestion])

  const handleSaveCurrentResponse = async () => {
    if (!currentQuestion) return

    setIsSubmitting(true)
    setError(null)

    try {
      const responseToSave = responses[currentQuestionIndex]
      const result = await saveAssessmentResponse({
        data: {
          attemptId: session.id,
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
      handleSaveCurrentResponse()
      setCurrentQuestionIndex(prev => prev - 1)
    } else if (direction === 'next' && currentQuestionIndex < totalQuestions - 1) {
      handleSaveCurrentResponse()
      setCurrentQuestionIndex(prev => prev + 1)
    }
  }

  const handleSubmitFinal = async () => {
    // Save all responses first
    setIsSubmitting(true)
    setError(null)

    try {
      // Save all responses
      const saveResult = await saveAssessmentResponse({
        data: {
          attemptId: session.id,
          responses: responses.filter(r => 
            r.answer_text || r.selected_option_ids?.length || r.awarded_score
          ),
        },
      })

      if (!saveResult.success) {
        setError(saveResult.error || 'Gagal menyimpan jawaban')
        return
      }

      // Submit the assessment
      const submitResult = await submitAssessment({
        data: {
          attemptId: session.id,
        },
      })

      if (!submitResult.success) {
        setError(submitResult.error || 'Gagal mengirim penilaian')
        return
      }

      setSuccess(true)
      setTimeout(() => {
        window.location.href = '/assessments'
      }, 2000)
    } catch (err) {
      console.error('Error submitting assessment:', err)
      setError('Terjadi kesalahan saat mengirim penilaian')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    if (window.confirm('Apakah Anda yakin ingin membatalkan? Jawaban yang belum disimpan akan hilang.')) {
      window.location.href = '/assessments'
    }
  }

  const renderQuestionInput = (question: QuestionWithOption, response: ResponseData) => {
    const questionType = question.question_type as keyof typeof QUESTION_TYPE_LABELS

    switch (questionType) {
      case 'short_text':
        return (
          <input
            type="text"
            value={response.answer_text || ''}
            onChange={(e) => handleResponseChange('answer_text', e.target.value)}
            style={inputStyle}
            placeholder="Jawaban Anda"
            disabled={isSubmitting || success}
          />
        )

      case 'long_text':
        return (
          <textarea
            value={response.answer_text || ''}
            onChange={(e) => handleResponseChange('answer_text', e.target.value)}
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
            value={response.answer_text || ''}
            onChange={(e) => handleResponseChange('answer_text', e.target.value)}
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
                ...(response.answer_text === 'true' ? radioSelectedStyle : {}),
              }}
            >
              <input
                type="radio"
                name={`question_${question.id}_boolean`}
                value="true"
                checked={response.answer_text === 'true'}
                onChange={(e) => handleResponseChange('answer_text', e.target.value)}
                disabled={isSubmitting || success}
                style={{ cursor: 'pointer' }}
              />
              Ya
            </label>
            <label
              style={{
                ...radioLabelStyle,
                ...(response.answer_text === 'false' ? radioSelectedStyle : {}),
              }}
            >
              <input
                type="radio"
                name={`question_${question.id}_boolean`}
                value="false"
                checked={response.answer_text === 'false'}
                onChange={(e) => handleResponseChange('answer_text', e.target.value)}
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
            value={response.answer_text || ''}
            onChange={(e) => handleResponseChange('answer_text', e.target.value)}
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

  const autoSaveStyle: React.CSSProperties = {
    fontSize: '0.75rem',
    color: autoSaveStatus === 'saved' ? '#16a34a' : autoSaveStatus === 'saving' ? '#f59e0b' : '#9ca3af',
    textAlign: 'right',
    marginBottom: '0.5rem',
  }

  if (success) {
    return (
      <div style={containerStyle}>
        <div style={successAlertStyle}>
          <p style={{ fontWeight: 600, marginBottom: '0.5rem' }}>Penilaian Berhasil Dikirim!</p>
          <p>Mengalihkan ke daftar penilaian...</p>
        </div>
      </div>
    )
  }

  if (session.is_completed) {
    return (
      <div style={containerStyle}>
        <div style={errorAlertStyle}>
          <p style={{ fontWeight: 600, marginBottom: '0.5rem' }}>Penilaian Sudah Dikirim</p>
          <p>Penilaian ini sudah diselesaikan dan tidak dapat diubah lagi.</p>
        </div>
        <button
          onClick={() => window.location.href = '/assessments'}
          style={secondaryButtonStyle}
        >
          Kembali ke Daftar Penilaian
        </button>
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
        <h1 style={titleStyle}>Kerjakan Penilaian</h1>
        <p style={{ fontSize: '1rem', color: '#6b7280', marginTop: '0.5rem' }}>
          Jawab semua pertanyaan dengan jujur dan akurat
        </p>
      </div>

      {error && <div style={errorAlertStyle} role="alert">{error}</div>}

      {/* Session Info */}
      <div style={infoCardStyle}>
        <div className="info-grid" style={infoGridStyle}>
          <div>
            <div style={infoLabelStyle}>Peserta</div>
            <div style={infoValueStyle}>{session.participant_name}</div>
          </div>
          <div>
            <div style={infoLabelStyle}>Template</div>
            <div style={infoValueStyle}>{session.template_title}</div>
          </div>
          {session.template_code && (
            <div>
              <div style={infoLabelStyle}>Kode</div>
              <div style={infoValueStyle}>{session.template_code}</div>
            </div>
          )}
          <div>
            <div style={infoLabelStyle}>Dimulai</div>
            <div style={infoValueStyle}>
              {session.started_at ? new Date(session.started_at).toLocaleString('id-ID') : '-'}
            </div>
          </div>
        </div>
      </div>

      {totalQuestions === 0 ? (
        <div style={infoCardStyle}>
          <p style={{ color: '#f59e0b', fontWeight: 500 }}>
            Tidak ada pertanyaan untuk penilaian ini. Template pertanyaan belum ditautkan atau kosong.
          </p>
          <div style={{ marginTop: '1.5rem' }}>
            <button
              onClick={handleSubmitFinal}
              style={primaryButtonStyle}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Menyubmit...' : 'Submit Penilaian Tanpa Pertanyaan'}
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

              {/* Auto-save status */}
              <div style={autoSaveStyle}>
                {autoSaveStatus === 'saved' && '✓ Tersimpan'}
                {autoSaveStatus === 'saving' && 'Menyimpan...'}
              </div>

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
                    onClick={handleSubmitFinal}
                    style={isSubmitting ? disabledButtonStyle : primaryButtonStyle}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Menyubmit...' : 'Submit Penilaian'}
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

          {/* Final Submit Button */}
          {currentQuestionIndex === totalQuestions - 1 && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
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
                {isSubmitting ? 'Menyubmit...' : 'Submit Penilaian'}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
