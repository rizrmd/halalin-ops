import * as React from 'react'
import { createFileRoute } from '@tanstack/react-router'
import {
  getInterviewScores,
  getConductInterview,
  type InterviewScoresResponse,
  type ScoreEntryWithCriterion,
  INTERVIEW_RESULT_LABELS,
} from '../server/interviews'

interface LoaderData extends InterviewScoresResponse {
  session: {
    id: string
    candidate_name: string
    interview_date: string
    interview_mode: string | null
    result: string | null
    total_score: number | null
    notes: string | null
    interviewer_name: string | null
    objective: string | null
  }
}

export const Route = createFileRoute('/interviews/$id')({
  component: InterviewDetailComponent,
  beforeLoad: async ({ context }) => {
    if (!context.user) {
      throw new Error('UNAUTHORIZED')
    }
    return { user: context.user }
  },
  loader: async ({ params }): Promise<LoaderData> => {
    const scoresData = await getInterviewScores({ data: { interviewId: params.id } })
    const conductData = await getConductInterview({ data: { interviewId: params.id } })
    
    return {
      ...scoresData,
      session: {
        id: conductData.session.id,
        candidate_name: conductData.session.candidate_name,
        interview_date: conductData.session.interview_date,
        interview_mode: conductData.session.interview_mode,
        result: conductData.session.result,
        total_score: conductData.session.total_score,
        notes: conductData.session.notes,
        interviewer_name: conductData.session.interviewer_name,
        objective: conductData.session.objective,
      },
    }
  },
})

function getResultBadgeColor(result: string | null): string {
  if (!result) return '#6b7280'
  const colorMap: Record<string, string> = {
    priority_deploy: '#16a34a',
    talent_pool: '#2563eb',
    training_first: '#f59e0b',
    hold: '#6b7280',
    senior_halal_compliance: '#7c3aed',
    deployable_penyelia_halal: '#16a34a',
    training_required: '#f59e0b',
    not_ready: '#dc2626',
  }
  return colorMap[result] || '#6b7280'
}

function getResultTextColor(result: string | null): string {
  if (!result) return '#6b7280'
  const colorMap: Record<string, string> = {
    priority_deploy: '#166534',
    talent_pool: '#1e40af',
    training_first: '#92400e',
    hold: '#374151',
    senior_halal_compliance: '#5b21b6',
    deployable_penyelia_halal: '#166534',
    training_required: '#92400e',
    not_ready: '#991b1b',
  }
  return colorMap[result] || '#6b7280'
}

function getModeBadgeStyle(mode: string | null): { backgroundColor: string; color: string } {
  if (!mode) return { backgroundColor: '#e5e7eb', color: '#6b7280' }
  const colorMap: Record<string, { backgroundColor: string; color: string }> = {
    onsite: { backgroundColor: '#dbeafe', color: '#1e40af' },
    online: { backgroundColor: '#dcfce7', color: '#166534' },
    hybrid: { backgroundColor: '#fef3c7', color: '#92400e' },
  }
  return colorMap[mode] || { backgroundColor: '#e5e7eb', color: '#6b7280' }
}

function InterviewDetailComponent() {
  const loaderData = Route.useLoaderData()
  const { session, entries, totalScore, maxTotalScore, percentage } = loaderData as LoaderData
  const result = session.result

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

  const cardStyle: React.CSSProperties = {
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

  const scoreSummaryStyle: React.CSSProperties = {
    textAlign: 'center',
    padding: '2rem',
    backgroundColor: '#f9fafb',
    borderRadius: '0.5rem',
    marginBottom: '1.5rem',
  }

  const scoreNumberStyle: React.CSSProperties = {
    fontSize: '3rem',
    fontWeight: 'bold',
    color: '#2563eb',
    lineHeight: 1,
  }

  const scoreLabelStyle: React.CSSProperties = {
    fontSize: '1rem',
    color: '#6b7280',
    marginTop: '0.5rem',
  }

  const resultBadgeStyle = (backgroundColor: string, color: string): React.CSSProperties => ({
    display: 'inline-block',
    padding: '0.5rem 1.5rem',
    borderRadius: '9999px',
    fontSize: '1.125rem',
    fontWeight: 600,
    backgroundColor,
    color,
    marginTop: '1rem',
  })

  const sectionTitleStyle: React.CSSProperties = {
    fontSize: '1.25rem',
    fontWeight: 600,
    color: '#111827',
    marginBottom: '1rem',
  }

  const criterionCardStyle: React.CSSProperties = {
    padding: '1rem',
    border: '1px solid #e5e7eb',
    borderRadius: '0.5rem',
    marginBottom: '0.75rem',
  }

  const criterionHeaderStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '0.5rem',
  }

  const criterionNameStyle: React.CSSProperties = {
    fontWeight: 600,
    color: '#111827',
  }

  const criterionScoreStyle: React.CSSProperties = {
    fontSize: '1.125rem',
    fontWeight: 'bold',
    color: '#2563eb',
  }

  const badgeStyle = (backgroundColor: string, color: string): React.CSSProperties => ({
    display: 'inline-block',
    padding: '0.25rem 0.75rem',
    borderRadius: '9999px',
    fontSize: '0.75rem',
    fontWeight: 500,
    backgroundColor,
    color,
  })

  const backButtonStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.625rem 1rem',
    backgroundColor: 'white',
    border: '1px solid #d1d5db',
    borderRadius: '0.375rem',
    fontSize: '0.875rem',
    fontWeight: 500,
    color: '#374151',
    textDecoration: 'none',
    marginBottom: '1rem',
    cursor: 'pointer',
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
        <a href="/interviews" style={backButtonStyle}>
          ← Kembali
        </a>
        <h1 style={titleStyle}>Detail Wawancara</h1>
      </div>

      {/* Session Info */}
      <div style={cardStyle}>
        <h2 style={sectionTitleStyle}>Informasi Wawancara</h2>
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
            <div style={infoValueStyle}>
              {session.interview_mode && (
                <span style={badgeStyle(
                  getModeBadgeStyle(session.interview_mode).backgroundColor,
                  getModeBadgeStyle(session.interview_mode).color
                )}>
                  {session.interview_mode}
                </span>
              )}
              {!session.interview_mode && '-'}
            </div>
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

      {/* Score Summary */}
      <div style={cardStyle}>
        <h2 style={sectionTitleStyle}>Hasil Penilaian</h2>
        
        <div style={scoreSummaryStyle}>
          <div style={scoreNumberStyle}>
            {totalScore.toFixed(2)} / {maxTotalScore}
          </div>
          <div style={scoreLabelStyle}>
            {maxTotalScore > 0 ? `${percentage.toFixed(1)}% dari skor maksimal` : 'Belum ada penilaian'}
          </div>

          {result && (
            <div style={resultBadgeStyle(getResultBadgeColor(result), getResultTextColor(result))}>
              {INTERVIEW_RESULT_LABELS[result as keyof typeof INTERVIEW_RESULT_LABELS]}
            </div>
          )}

          {!result && totalScore > 0 && (
            <div style={{ ...resultBadgeStyle('#e5e7eb', '#374151'), marginTop: '1rem' }}>
              Belum dinilai
            </div>
          )}
        </div>

        {/* Score Breakdown */}
        {entries.length > 0 && (
          <div>
            <h3 style={sectionTitleStyle}>Rincian Skor</h3>
            {entries.map((entry: ScoreEntryWithCriterion) => {
              const percentageScore = entry.max_score > 0 ? (entry.score / entry.max_score) * 100 : 0
              const scoreColor = percentageScore >= 70 ? '#16a34a' : percentageScore >= 50 ? '#f59e0b' : '#dc2626'
              
              return (
                <div key={entry.id} style={criterionCardStyle}>
                  <div style={criterionHeaderStyle}>
                    <div style={criterionNameStyle}>{entry.criterion_name}</div>
                    <div style={criterionScoreStyle}>
                      <span style={{ color: scoreColor }}>{entry.score.toFixed(2)}</span>
                      <span style={{ color: '#9ca3af', fontSize: '0.875rem' }}> / {entry.max_score}</span>
                    </div>
                  </div>
                  {entry.comment && (
                    <div style={{ fontSize: '0.875rem', color: '#6b7280', fontStyle: 'italic' }}>
                      "{entry.comment}"
                    </div>
                  )}
                  <div style={{ marginTop: '0.5rem', height: '4px', backgroundColor: '#e5e7eb', borderRadius: '2px', overflow: 'hidden' }}>
                    <div 
                      style={{ 
                        height: '100%', 
                        width: `${percentageScore}%`,
                        backgroundColor: scoreColor,
                        transition: 'width 0.3s ease'
                      }} 
                    />
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {session.notes && (
          <div style={{ marginTop: '1.5rem' }}>
            <h3 style={sectionTitleStyle}>Catatan</h3>
            <div style={{ fontSize: '0.875rem', color: '#374151', lineHeight: 1.6 }}>
              {session.notes}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
