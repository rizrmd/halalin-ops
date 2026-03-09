import * as React from 'react'
import { createFileRoute } from '@tanstack/react-router'
import {
  getAssessmentResults,
  type AssessmentResultResponse,
  type QuestionResult,
  QUESTION_TYPE_LABELS,
} from '../server/assessments'

export const Route = createFileRoute('/assessments/$id/results')({
  component: AssessmentResultsComponent,
  beforeLoad: async ({ context }) => {
    if (!context.user) {
      throw new Error('UNAUTHORIZED')
    }
    return { user: context.user }
  },
  loader: async ({ params }): Promise<AssessmentResultResponse> => {
    return await getAssessmentResults({ data: { attemptId: params.id } })
  },
})

function AssessmentResultsComponent() {
  const initialData = Route.useLoaderData() as AssessmentResultResponse
  const { user } = Route.useRouteContext() as { user: { id: string; name: string; email: string | null; partnerType: string } }
  
  const [session] = React.useState(initialData.session)
  const [results] = React.useState(initialData.results)
  const [totalQuestions] = React.useState(initialData.totalQuestions)
  const [correctAnswers] = React.useState(initialData.correctAnswers)
  const [incorrectAnswers] = React.useState(initialData.incorrectAnswers)

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

  const scoreCardStyle: React.CSSProperties = {
    backgroundColor: 'white',
    borderRadius: '0.5rem',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    padding: '1.5rem',
    marginBottom: '1.5rem',
  }

  const scoreGridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(1, 1fr)',
    gap: '1rem',
  }

  const scoreItemStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '1rem',
    backgroundColor: '#f9fafb',
    borderRadius: '0.5rem',
  }

  const scoreValueStyle: React.CSSProperties = {
    fontSize: '2rem',
    fontWeight: 'bold',
    color: '#2563eb',
  }

  const scoreLabelStyle: React.CSSProperties = {
    fontSize: '0.875rem',
    color: '#6b7280',
    marginTop: '0.25rem',
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

  const statsRowStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0.75rem 0',
    borderBottom: '1px solid #e5e7eb',
  }

  const statsLabelStyle: React.CSSProperties = {
    fontSize: '0.875rem',
    color: '#374151',
  }

  const statsValueStyle: React.CSSProperties = {
    fontSize: '0.875rem',
    fontWeight: 600,
    color: '#111827',
  }

  const successBadgeStyle: React.CSSProperties = {
    display: 'inline-block',
    padding: '0.25rem 0.75rem',
    borderRadius: '9999px',
    fontSize: '0.75rem',
    fontWeight: 600,
    backgroundColor: '#dcfce7',
    color: '#166534',
  }

  const errorBadgeStyle: React.CSSProperties = {
    display: 'inline-block',
    padding: '0.25rem 0.75rem',
    borderRadius: '9999px',
    fontSize: '0.775rem',
    fontWeight: 600,
    backgroundColor: '#fee2e2',
    color: '#991b1b',
  }

  const questionCardStyle: React.CSSProperties = {
    backgroundColor: 'white',
    borderRadius: '0.5rem',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    padding: '1.5rem',
    marginBottom: '1rem',
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

  const answerSectionStyle: React.CSSProperties = {
    marginTop: '1rem',
    paddingTop: '1rem',
    borderTop: '1px solid #e5e7eb',
  }

  const answerLabelStyle: React.CSSProperties = {
    fontSize: '0.875rem',
    fontWeight: 600,
    color: '#374151',
    marginBottom: '0.5rem',
  }

  const answerValueStyle: React.CSSProperties = {
    fontSize: '0.875rem',
    color: '#111827',
    padding: '0.75rem',
    backgroundColor: '#f9fafb',
    borderRadius: '0.375rem',
    marginBottom: '0.5rem',
  }

  const correctAnswerStyle: React.CSSProperties = {
    ...answerValueStyle,
    backgroundColor: '#dcfce7',
    color: '#166534',
  }

  const incorrectAnswerStyle: React.CSSProperties = {
    ...answerValueStyle,
    backgroundColor: '#fee2e2',
    color: '#991b1b',
  }

  const scoreBreakdownStyle: React.CSSProperties = {
    display: 'flex',
    gap: '1rem',
    marginTop: '1rem',
    paddingTop: '1rem',
    borderTop: '1px solid #e5e7eb',
  }

  const scoreBreakdownItemStyle: React.CSSProperties = {
    fontSize: '0.875rem',
    color: '#6b7280',
  }

  const buttonStyle: React.CSSProperties = {
    padding: '0.75rem 1.5rem',
    backgroundColor: '#2563eb',
    border: '1px solid #2563eb',
    color: 'white',
    borderRadius: '0.375rem',
    fontSize: '0.875rem',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.2s',
    minHeight: '44px',
  }

  if (!session.is_completed) {
    return (
      <div style={containerStyle}>
        <div style={{ ...errorBadgeStyle, marginBottom: '1rem' }}>
          Penilaian Belum Disubmit
        </div>
        <p style={{ color: '#374151', marginBottom: '1rem' }}>
          Penilaian ini belum diselesaikan. Silakan kerjakan terlebih dahulu.
        </p>
        <button
          onClick={() => window.location.href = `/assessments/${session.id}/take`}
          style={buttonStyle}
        >
          Kerjakan Penilaian
        </button>
      </div>
    )
  }

  return (
    <div style={containerStyle}>
      <style>{`
        @media (min-width: 640px) {
          .score-grid {
            grid-template-columns: repeat(3, 1fr) !important;
          }
          .info-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
      `}</style>

      <div style={headerStyle}>
        <h1 style={titleStyle}>Hasil Penilaian</h1>
        <p style={{ fontSize: '1rem', color: '#6b7280', marginTop: '0.5rem' }}>
          Ringkasan dan detail jawaban Anda
        </p>
      </div>

      {/* Score Summary Cards */}
      <div style={scoreCardStyle}>
        <div className="score-grid" style={scoreGridStyle}>
          <div style={scoreItemStyle}>
            <div style={scoreValueStyle}>{session.total_score.toFixed(1)}</div>
            <div style={scoreLabelStyle}>Total Skor</div>
          </div>
          <div style={scoreItemStyle}>
            <div style={{ ...scoreValueStyle, color: '#16a34a' }}>{session.objective_score.toFixed(1)}</div>
            <div style={scoreLabelStyle}>Skor Objektif</div>
          </div>
          <div style={scoreItemStyle}>
            <div style={{ ...scoreValueStyle, color: '#f59e0b' }}>{session.essay_score.toFixed(1)}</div>
            <div style={scoreLabelStyle}>Skor Esai</div>
          </div>
        </div>
      </div>

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
            <div style={infoLabelStyle}>Disubmit</div>
            <div style={infoValueStyle}>
              {session.submitted_at ? new Date(session.submitted_at).toLocaleString('id-ID') : '-'}
            </div>
          </div>
        </div>

        {/* Statistics */}
        <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #e5e7eb' }}>
          <div style={statsRowStyle}>
            <span style={statsLabelStyle}>Total Pertanyaan</span>
            <span style={statsValueStyle}>{totalQuestions}</span>
          </div>
          <div style={statsRowStyle}>
            <span style={statsLabelStyle}>Jawaban Benar</span>
            <span style={successBadgeStyle}>{correctAnswers}</span>
          </div>
          <div style={statsRowStyle}>
            <span style={statsLabelStyle}>Jawaban Salah</span>
            <span style={errorBadgeStyle}>{incorrectAnswers}</span>
          </div>
          {totalQuestions > 0 && (
            <div style={statsRowStyle}>
              <span style={statsLabelStyle}>Akurasi</span>
              <span style={statsValueStyle}>
                {((correctAnswers / totalQuestions) * 100).toFixed(1)}%
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Question-by-Question Results */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#111827', marginBottom: '1rem' }}>
          Detail Jawaban
        </h2>
      </div>

      {results.map((result, index) => {
        const questionType = result.question_type as keyof typeof QUESTION_TYPE_LABELS
        const questionTypeLabel = QUESTION_TYPE_LABELS[questionType]
        const isObjective = !['short_text', 'long_text'].includes(result.question_type)
        const showCorrectness = isObjective && result.selected_option_label

        return (
          <div key={result.id} style={questionCardStyle}>
            <div style={questionHeaderStyle}>
              {result.section_title && (
                <div style={questionMetaStyle}>
                  Bagian: {result.section_title} • {questionTypeLabel}
                </div>
              )}
              <div style={questionPromptStyle}>
                {index + 1}. {result.prompt}
              </div>
            </div>

            {/* User's Answer */}
            <div style={answerSectionStyle}>
              <div style={answerLabelStyle}>Jawaban Anda:</div>
              {showCorrectness ? (
                result.is_correct ? (
                  <div style={correctAnswerStyle}>
                    ✓ {result.selected_option_label || result.user_answer || '(tidak dijawab)'}
                  </div>
                ) : (
                  <div style={incorrectAnswerStyle}>
                    ✗ {result.selected_option_label || result.user_answer || '(tidak dijawab)'}
                  </div>
                )
              ) : (
                <div style={answerValueStyle}>
                  {result.user_answer || '(tidak dijawab)'}
                </div>
              )}

              {/* Correct Answer (for objective questions) */}
              {showCorrectness && !result.is_correct && result.correct_option_label && (
                <div style={{ marginTop: '0.75rem' }}>
                  <div style={answerLabelStyle}>Jawaban Benar:</div>
                  <div style={correctAnswerStyle}>
                    ✓ {result.correct_option_label}
                  </div>
                </div>
              )}

              {/* Score Breakdown */}
              {isObjective && (
                <div style={scoreBreakdownStyle}>
                  <div style={scoreBreakdownItemStyle}>
                    Skor: <strong style={{ color: result.is_correct ? '#16a34a' : '#dc2626' }}>
                      {result.awarded_score.toFixed(1)} / {result.max_score.toFixed(1)}
                    </strong>
                  </div>
                </div>
              )}
            </div>
          </div>
        )
      })}

      {/* Back Button */}
      <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid #e5e7eb' }}>
        <button
          onClick={() => window.location.href = '/assessments'}
          style={buttonStyle}
        >
          Kembali ke Daftar Penilaian
        </button>
      </div>
    </div>
  )
}
