import type { InterviewListItem, InterviewsResponse } from '../server/interviews'
import { createFileRoute } from '@tanstack/react-router'
import * as React from 'react'
import { getInterviews, INTERVIEW_MODE_LABELS, INTERVIEW_RESULT_LABELS } from '../server/interviews'

export const Route = createFileRoute('/interviews')({
  component: InterviewsComponent,
  beforeLoad: async ({ context }) => {
    // Check authentication - redirect to login if user is not authenticated
    if (!context.user) {
      throw new Error('UNAUTHORIZED')
    }
    return { user: context.user }
  },
  loader: async (): Promise<InterviewsResponse> => {
    return await getInterviews({ data: { page: 1, pageSize: 20 } })
  },
})

function getResultBadgeColor(result: string | null): string {
  if (!result)
    return '#6b7280' // gray
  const colorMap: Record<string, string> = {
    priority_deploy: '#16a34a', // green
    talent_pool: '#2563eb', // blue
    training_first: '#f59e0b', // amber
    hold: '#6b7280', // gray
    senior_halal_compliance: '#7c3aed', // purple
    deployable_penyelia_halal: '#16a34a', // green
    training_required: '#f59e0b', // amber
    not_ready: '#dc2626', // red
  }
  return colorMap[result] || '#6b7280'
}

function getResultTextColor(result: string | null): string {
  if (!result)
    return '#6b7280' // gray
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

function getModeBadgeStyle(mode: string | null): { backgroundColor: string, color: string } {
  if (!mode)
    return { backgroundColor: '#e5e7eb', color: '#6b7280' }
  const colorMap: Record<string, { backgroundColor: string, color: string }> = {
    onsite: { backgroundColor: '#dbeafe', color: '#1e40af' },
    online: { backgroundColor: '#dcfce7', color: '#166534' },
    hybrid: { backgroundColor: '#fef3c7', color: '#92400e' },
  }
  return colorMap[mode] || { backgroundColor: '#e5e7eb', color: '#6b7280' }
}

function InterviewsComponent() {
  const { user } = Route.useRouteContext() as { user: { id: string, name: string, email: string | null, partnerType: string } }
  const initialData = Route.useLoaderData() as InterviewsResponse
  const [interviews, setInterviews] = React.useState<InterviewListItem[]>(initialData.interviews)
  const [currentPage, setCurrentPage] = React.useState(initialData.currentPage)
  const [totalPages, setTotalPages] = React.useState(initialData.totalPages)
  const [totalCount, setTotalCount] = React.useState(initialData.totalCount)
  const [isLoading, setIsLoading] = React.useState(false)

  const loadPage = async (page: number) => {
    if (page < 1 || page > totalPages || page === currentPage)
      return
    setIsLoading(true)
    try {
      const response = await getInterviews({ data: { page, pageSize: 20 } })
      setInterviews(response.interviews)
      setCurrentPage(response.currentPage)
      setTotalPages(response.totalPages)
      setTotalCount(response.totalCount)
    }
    catch (error) {
      console.error('Error loading interviews:', error)
    }
    finally {
      setIsLoading(false)
    }
  }

  const handleCreateInterview = () => {
    window.location.href = '/interviews/new'
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

  const headerActionsStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
  }

  const conductButtonStyle: React.CSSProperties = {
    padding: '0.375rem 0.75rem',
    backgroundColor: '#16a34a',
    color: 'white',
    border: '1px solid #16a34a',
    borderRadius: '0.375rem',
    fontSize: '0.75rem',
    fontWeight: 500,
    cursor: 'pointer',
    minHeight: '36px',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.25rem',
  }

  const actionCellStyle: React.CSSProperties = {
    padding: '1rem',
    borderBottom: '1px solid #e5e7eb',
    textAlign: 'center',
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
        <h1 style={titleStyle}>Daftar Wawancara</h1>
        <div style={headerActionsStyle}>
          <button
            style={createButtonStyle}
            onClick={handleCreateInterview}
          >
            + Wawancara Baru
          </button>
        </div>
      </div>

      <div style={tableContainerStyle}>
        {isLoading
          ? (
              <div style={loadingStyle}>Memuat...</div>
            )
          : interviews.length === 0
            ? (
                <div style={emptyStyle}>
                  <p style={{ color: '#6b7280', marginBottom: '1rem' }}>
                    Belum ada wawancara.
                  </p>
                  <button
                    style={createButtonStyle}
                    onClick={handleCreateInterview}
                  >
                    + Wawancara Baru
                  </button>
                </div>
              )
            : (
                <>
                  <table style={tableStyle}>
                    <thead>
                      <tr>
                        <th style={thStyle}>Kandidat</th>
                        <th style={thStyle}>Tanggal</th>
                        <th style={thStyle}>Mode</th>
                        <th style={thStyle}>Hasil</th>
                        <th style={{ ...thStyle, textAlign: 'center' }}>Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {interviews.map((interview) => {
                        const modeStyle = getModeBadgeStyle(interview.interview_mode)
                        const badgeBgColor = getResultBadgeColor(interview.result)
                        const badgeTextColor = getResultTextColor(interview.result)
                        const resultLabel = interview.result ? INTERVIEW_RESULT_LABELS[interview.result as keyof typeof INTERVIEW_RESULT_LABELS] : 'Belum Dinilai'
                        const modeLabel = interview.interview_mode ? INTERVIEW_MODE_LABELS[interview.interview_mode as keyof typeof INTERVIEW_MODE_LABELS] : '-'
                        const isCompleted = interview.result !== null && interview.result !== undefined

                        return (
                          <tr key={interview.id} style={{ backgroundColor: 'white' }}>
                            <td style={tdStyle}>
                              <a
                                href={`/partners/${interview.candidate_id}`}
                                style={{ color: '#2563eb', textDecoration: 'none', fontWeight: 500 }}
                              >
                                {interview.candidate_name}
                              </a>
                            </td>
                            <td style={tdStyle}>{interview.interview_date}</td>
                            <td style={tdStyle}>
                              <span style={badgeStyle(modeStyle.backgroundColor, modeStyle.color)}>
                                {modeLabel}
                              </span>
                            </td>
                            <td style={tdStyle}>
                              <span style={badgeStyle(badgeBgColor, badgeTextColor)}>
                                {resultLabel}
                              </span>
                            </td>
                            <td style={actionCellStyle}>
                              <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
                                {isCompleted && (
                                  <a
                                    href={`/interviews/${interview.id}`}
                                    style={{
                                      padding: '0.375rem 0.75rem',
                                      backgroundColor: '#2563eb',
                                      color: 'white',
                                      border: '1px solid #2563eb',
                                      borderRadius: '0.375rem',
                                      fontSize: '0.75rem',
                                      fontWeight: 500,
                                      cursor: 'pointer',
                                      minHeight: '36px',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '0.25rem',
                                      textDecoration: 'none',
                                    }}
                                  >
                                    Lihat
                                  </a>
                                )}
                                <a
                                  href={`/interviews/${interview.id}/conduct`}
                                  style={{
                                    ...conductButtonStyle,
                                    ...(isCompleted ? { backgroundColor: '#9ca3af', borderColor: '#9ca3af', cursor: 'not-allowed' } : {}),
                                  }}
                                  onClick={(e) => {
                                    if (isCompleted) {
                                      e.preventDefault()
                                      alert('Wawancara ini sudah diselesaikan')
                                    }
                                  }}
                                >
                                  {isCompleted ? 'Selesai' : 'Lakukan'}
                                </a>
                              </div>
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
                        {interviews.length}
                        {' '}
                        dari
                        {' '}
                        {totalCount}
                        {' '}
                        wawancara
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
