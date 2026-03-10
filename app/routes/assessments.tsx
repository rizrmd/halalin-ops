import type { AssessmentListItem, AssessmentsResponse } from '../server/assessments'
import { createFileRoute } from '@tanstack/react-router'
import * as React from 'react'
import { ASSESSMENT_STATUS_LABELS, COMPETENCY_RESULT_LABELS, getAssessments } from '../server/assessments'

export const Route = createFileRoute('/assessments')({
  component: AssessmentsComponent,
  beforeLoad: async ({ context }) => {
    // Check authentication - redirect to login if user is not authenticated
    if (!context.user) {
      throw new Error('UNAUTHORIZED')
    }
    return { user: context.user }
  },
  loader: async (): Promise<AssessmentsResponse> => {
    return await getAssessments({ data: { page: 1, pageSize: 20 } })
  },
})

function getStatusBadgeStyle(status: string): { backgroundColor: string, color: string } {
  const colorMap: Record<string, { backgroundColor: string, color: string }> = {
    not_started: { backgroundColor: '#f3f4f6', color: '#374151' },
    in_progress: { backgroundColor: '#dbeafe', color: '#1e40af' },
    submitted: { backgroundColor: '#fef3c7', color: '#92400e' },
    reviewed: { backgroundColor: '#dcfce7', color: '#166534' },
  }
  return colorMap[status] || { backgroundColor: '#f3f4f6', color: '#374151' }
}

function getResultBadgeColor(result: string | null): { backgroundColor: string, color: string } {
  if (!result)
    return { backgroundColor: '#f3f4f6', color: '#374151' }
  const colorMap: Record<string, { backgroundColor: string, color: string }> = {
    priority_deploy: { backgroundColor: '#dcfce7', color: '#166534' },
    talent_pool: { backgroundColor: '#dbeafe', color: '#1e40af' },
    training_first: { backgroundColor: '#fef3c7', color: '#92400e' },
    hold: { backgroundColor: '#f3f4f6', color: '#374151' },
    senior_halal_compliance: { backgroundColor: '#f3e8ff', color: '#6b21a8' },
    deployable_penyelia_halal: { backgroundColor: '#dcfce7', color: '#166534' },
    training_required: { backgroundColor: '#fef3c7', color: '#92400e' },
    not_ready: { backgroundColor: '#fee2e2', color: '#991b1b' },
  }
  return colorMap[result] || { backgroundColor: '#f3f4f6', color: '#374151' }
}

function AssessmentsComponent() {
  const { user } = Route.useRouteContext() as { user: { id: string, name: string, email: string | null, partnerType: string } }
  const initialData = Route.useLoaderData() as AssessmentsResponse
  const [assessments, setAssessments] = React.useState<AssessmentListItem[]>(initialData.assessments)
  const [currentPage, setCurrentPage] = React.useState(initialData.currentPage)
  const [totalPages, setTotalPages] = React.useState(initialData.totalPages)
  const [totalCount, setTotalCount] = React.useState(initialData.totalCount)
  const [isLoading, setIsLoading] = React.useState(false)

  const loadPage = async (page: number) => {
    if (page < 1 || page > totalPages || page === currentPage)
      return
    setIsLoading(true)
    try {
      const response = await getAssessments({ data: { page, pageSize: 20 } })
      setAssessments(response.assessments)
      setCurrentPage(response.currentPage)
      setTotalPages(response.totalPages)
      setTotalCount(response.totalCount)
    }
    catch (error) {
      console.error('Error loading assessments:', error)
    }
    finally {
      setIsLoading(false)
    }
  }

  const handleStartNewAssessment = () => {
    // Navigate to new assessment page (placeholder - route not yet implemented)
    window.location.href = '/assessments/new'
  }

  const containerStyle: React.CSSProperties = {
    maxWidth: '1280px',
    margin: '0 auto',
    padding: '2rem 1rem',
  }

  const headerStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1.5rem',
    flexWrap: 'wrap',
    gap: '1rem',
  }

  const titleStyle: React.CSSProperties = {
    fontSize: '1.875rem',
    fontWeight: 'bold',
    color: '#111827',
    margin: 0,
  }

  const createButtonStyle: React.CSSProperties = {
    padding: '0.625rem 1rem',
    backgroundColor: '#2563eb',
    color: 'white',
    border: '1px solid #2563eb',
    borderRadius: '0.375rem',
    fontSize: '0.875rem',
    fontWeight: 500,
    cursor: 'pointer',
    minHeight: '44px',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  }

  const tableContainerStyle: React.CSSProperties = {
    backgroundColor: 'white',
    borderRadius: '0.5rem',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    overflow: 'hidden',
  }

  const loadingStyle: React.CSSProperties = {
    padding: '3rem',
    textAlign: 'center',
    color: '#6b7280',
  }

  const emptyStyle: React.CSSProperties = {
    padding: '3rem',
    textAlign: 'center',
    color: '#6b7280',
  }

  const tableStyle: React.CSSProperties = {
    width: '100%',
    borderCollapse: 'collapse',
  }

  const thStyle: React.CSSProperties = {
    backgroundColor: '#f9fafb',
    padding: '0.75rem 1rem',
    textAlign: 'left',
    fontSize: '0.75rem',
    fontWeight: 600,
    color: '#374151',
    textTransform: 'uppercase',
    borderBottom: '1px solid #e5e7eb',
  }

  const tdStyle: React.CSSProperties = {
    padding: '1rem',
    borderBottom: '1px solid #e5e7eb',
    color: '#374151',
    fontSize: '0.875rem',
  }

  const paginationStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1rem',
    borderTop: '1px solid #e5e7eb',
    flexWrap: 'wrap',
    gap: '0.5rem',
  }

  const pageInfoStyle: React.CSSProperties = {
    fontSize: '0.875rem',
    color: '#6b7280',
  }

  const paginationButtonStyle: React.CSSProperties = {
    padding: '0.5rem 1rem',
    border: '1px solid #e5e7eb',
    borderRadius: '0.375rem',
    backgroundColor: 'white',
    fontSize: '0.875rem',
    cursor: 'pointer',
    color: '#374151',
  }

  const disabledButtonStyle: React.CSSProperties = {
    ...paginationButtonStyle,
    color: '#9ca3af',
    cursor: 'not-allowed',
    backgroundColor: '#f9fafb',
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

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <h1 style={titleStyle}>Daftar Penilaian</h1>
        <button
          style={createButtonStyle}
          onClick={handleStartNewAssessment}
        >
          + Penilaian Baru
        </button>
      </div>

      <div style={tableContainerStyle}>
        {isLoading
          ? (
              <div style={loadingStyle}>Memuat...</div>
            )
          : assessments.length === 0
            ? (
                <div style={emptyStyle}>
                  <p style={{ color: '#6b7280', marginBottom: '1rem' }}>
                    Belum ada penilaian.
                  </p>
                  <button
                    style={createButtonStyle}
                    onClick={handleStartNewAssessment}
                  >
                    + Penilaian Baru
                  </button>
                </div>
              )
            : (
                <>
                  <table style={tableStyle}>
                    <thead>
                      <tr>
                        <th style={thStyle}>Peserta</th>
                        <th style={thStyle}>Template</th>
                        <th style={thStyle}>Skor</th>
                        <th style={thStyle}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {assessments.map((assessment) => {
                        const statusStyle = getStatusBadgeStyle(assessment.status)
                        const resultBadge = assessment.competency_result
                          ? getResultBadgeColor(assessment.competency_result)
                          : null
                        const statusLabel = ASSESSMENT_STATUS_LABELS[assessment.status]
                        const resultLabel = assessment.competency_result
                          ? COMPETENCY_RESULT_LABELS[assessment.competency_result]
                          : null

                        return (
                          <tr key={assessment.id} style={{ backgroundColor: 'white' }}>
                            <td style={tdStyle}>
                              <div style={{ fontWeight: 500 }}>{assessment.participant_name}</div>
                              {assessment.participant_email && (
                                <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>
                                  {assessment.participant_email}
                                </div>
                              )}
                            </td>
                            <td style={tdStyle}>
                              <div style={{ fontWeight: 500 }}>{assessment.template_title}</div>
                              {assessment.template_code && (
                                <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>
                                  {assessment.template_code}
                                </div>
                              )}
                            </td>
                            <td style={tdStyle}>
                              <div style={{ fontWeight: 600, color: '#111827' }}>
                                {assessment.total_score.toFixed(1)}
                              </div>
                              <div style={{ fontSize: '0.775rem', color: '#6b7280' }}>
                                Obj:
                                {' '}
                                {assessment.objective_score.toFixed(1)}
                                {' '}
                                | Ess:
                                {' '}
                                {assessment.essay_score.toFixed(1)}
                              </div>
                              {assessment.competency_result && resultBadge && (
                                <div style={{ marginTop: '0.5rem' }}>
                                  <span style={badgeStyle(resultBadge.backgroundColor, resultBadge.color)}>
                                    {resultLabel}
                                  </span>
                                </div>
                              )}
                            </td>
                            <td style={tdStyle}>
                              <span style={badgeStyle(statusStyle.backgroundColor, statusStyle.color)}>
                                {statusLabel}
                              </span>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>

                  {totalPages > 1 && (
                    <div style={paginationStyle}>
                      <div style={pageInfoStyle}>
                        Menampilkan
                        {' '}
                        {assessments.length}
                        {' '}
                        dari
                        {' '}
                        {totalCount}
                        {' '}
                        penilaian
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                          style={currentPage === 1 ? disabledButtonStyle : paginationButtonStyle}
                          onClick={() => loadPage(currentPage - 1)}
                          disabled={currentPage === 1}
                        >
                          Sebelumnya
                        </button>
                        <span style={{ ...pageInfoStyle, display: 'flex', alignItems: 'center' }}>
                          Halaman
                          {' '}
                          {currentPage}
                          {' '}
                          dari
                          {' '}
                          {totalPages}
                        </span>
                        <button
                          style={currentPage === totalPages ? disabledButtonStyle : paginationButtonStyle}
                          onClick={() => loadPage(currentPage + 1)}
                          disabled={currentPage === totalPages}
                        >
                          Berikutnya
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
      </div>
    </div>
  )
}
