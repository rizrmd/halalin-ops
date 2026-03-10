import type { InterviewListItem, InterviewMode, InterviewResult, InterviewsResponse } from '../server/interviews'
import { createFileRoute, Link, Outlet, useLocation, useNavigate } from '@tanstack/react-router'
import * as React from 'react'
import { DebouncedSearchInput } from '../components/DebouncedSearchInput'
import { getInterviews, INTERVIEW_MODE_LABELS, INTERVIEW_MODES, INTERVIEW_RESULT_LABELS, INTERVIEW_RESULTS } from '../server/interviews'
import { parseEnumValue, parsePageSizeValue, parsePageValue, parseQueryValue } from '../utils/listSearch'

interface InterviewsSearch {
  page: number
  pageSize: number
  q: string
  interviewMode: InterviewMode | 'all'
  result: InterviewResult | 'pending' | 'all'
}

export const Route = createFileRoute('/interviews')({
  validateSearch: (search): InterviewsSearch => ({
    page: parsePageValue(search.page),
    pageSize: parsePageSizeValue(search.pageSize),
    q: parseQueryValue(search.q),
    interviewMode: parseEnumValue(search.interviewMode, ['all', ...INTERVIEW_MODES], 'all'),
    result: parseEnumValue(search.result, ['all', 'pending', ...INTERVIEW_RESULTS], 'all'),
  }),
  loaderDeps: ({ search }) => search,
  component: InterviewsComponent,
  beforeLoad: async ({ context }) => {
    if (!context.user) {
      throw new Error('UNAUTHORIZED')
    }
    return { user: context.user }
  },
  loader: async ({ deps }): Promise<InterviewsResponse> => {
    return await getInterviews({ data: deps })
  },
})

function getResultBadgeColor(result: string | null): string {
  if (!result)
    return '#6b7280'
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

function getModeBadgeStyle(mode: string | null): { backgroundColor: string, color: string } {
  if (!mode)
    return { backgroundColor: '#6b7280', color: '#ffffff' }
  const colorMap: Record<string, { backgroundColor: string, color: string }> = {
    onsite: { backgroundColor: '#2563eb', color: '#ffffff' },
    online: { backgroundColor: '#16a34a', color: '#ffffff' },
    hybrid: { backgroundColor: '#b45309', color: '#ffffff' },
  }
  return colorMap[mode] || { backgroundColor: '#6b7280', color: '#ffffff' }
}

function InterviewsComponent() {
  const location = useLocation()
  const navigate = useNavigate()
  const search = Route.useSearch() as InterviewsSearch
  const data = Route.useLoaderData() as InterviewsResponse
  const [isResultGuideOpen, setIsResultGuideOpen] = React.useState(false)
  const [selectedResult, setSelectedResult] = React.useState<string | null>(null)
  const [isPending, startTransition] = React.useTransition()

  React.useEffect(() => {
    if (search.page === data.currentPage) {
      return
    }

    void navigate({
      to: '/interviews' as never,
      search: { ...search, page: data.currentPage } as never,
      replace: true,
    })
  }, [data.currentPage, navigate, search])

  const updateSearch = (nextSearch: Partial<InterviewsSearch>) => {
    startTransition(() => {
      void navigate({
        to: '/interviews' as never,
        search: {
          ...search,
          ...nextSearch,
        } as never,
      })
    })
  }

  const loadPage = (page: number) => {
    if (page < 1 || page > data.totalPages || page === data.currentPage) {
      return
    }

    updateSearch({ page })
  }

  const handleCreateInterview = () => {
    void navigate({ to: '/interviews/new' as never })
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
    minHeight: '44px',
    minWidth: '44px',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.25rem',
    textDecoration: 'none',
  }

  const actionCellStyle: React.CSSProperties = {
    padding: '1rem',
    borderBottom: '1px solid #e5e7eb',
    textAlign: 'center',
  }

  // Mobile card styles
  const mobileCardStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
    padding: '1rem',
    border: '1px solid #e5e7eb',
    borderRadius: '0.5rem',
    backgroundColor: 'white',
    marginBottom: '0.75rem',
  }

  const mobileCardHeaderStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '0.5rem',
  }

  const mobileCardTitleStyle: React.CSSProperties = {
    fontSize: '1rem',
    fontWeight: 600,
    color: '#111827',
    flex: 1,
  }

  const mobileCardSubtitleStyle: React.CSSProperties = {
    fontSize: '0.875rem',
    color: '#6b7280',
  }

  const mobileCardRowStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '0.5rem',
  }

  const mobileCardLabelStyle: React.CSSProperties = {
    fontSize: '0.75rem',
    color: '#6b7280',
    textTransform: 'uppercase',
  }

  const mobileCardValueStyle: React.CSSProperties = {
    fontSize: '0.875rem',
    fontWeight: 500,
    color: '#374151',
  }

  const mobileCardActionsStyle: React.CSSProperties = {
    display: 'flex',
    gap: '0.5rem',
    marginTop: '0.5rem',
    paddingTop: '0.75rem',
    borderTop: '1px solid #e5e7eb',
  }

  const actionButtonBaseStyle: React.CSSProperties = {
    padding: '0.5rem 0.875rem',
    borderRadius: '0.375rem',
    fontSize: '0.875rem',
    fontWeight: 500,
    textDecoration: 'none',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '44px',
    minWidth: '44px',
    cursor: 'pointer',
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

  const filterBarStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'minmax(240px, 1.5fr) repeat(2, minmax(180px, 1fr))',
    gap: '0.75rem',
    marginBottom: '1rem',
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    minHeight: '44px',
    padding: '0.75rem 0.875rem',
    border: '1px solid #d1d5db',
    borderRadius: '0.5rem',
    fontSize: '0.875rem',
    color: '#111827',
    backgroundColor: 'white',
  }

  const tableContainerStyle: React.CSSProperties = {
    backgroundColor: 'white',
    borderRadius: '0.5rem',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    overflow: 'hidden',
  }

  const loadingStyle: React.CSSProperties = {
    padding: '1rem',
    borderBottom: '1px solid #e5e7eb',
    color: '#6b7280',
    fontSize: '0.875rem',
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

  const clickableBadgeStyle = (backgroundColor: string, color: string): React.CSSProperties => ({
    ...badgeStyle(backgroundColor, color),
    border: 'none',
    cursor: 'pointer',
  })

  const modalOverlayStyle: React.CSSProperties = {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(17, 24, 39, 0.55)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '1rem',
    zIndex: 50,
  }

  const modalCardStyle: React.CSSProperties = {
    width: '100%',
    maxWidth: '760px',
    maxHeight: '90vh',
    overflowY: 'auto',
    backgroundColor: 'white',
    borderRadius: '0.75rem',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)',
    padding: '1.5rem',
  }

  const modalHeaderStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '1rem',
    marginBottom: '1rem',
  }

  const modalTitleStyle: React.CSSProperties = {
    margin: 0,
    fontSize: '1.25rem',
    fontWeight: 700,
    color: '#111827',
  }

  const modalTextStyle: React.CSSProperties = {
    margin: '0.5rem 0 0',
    color: '#4b5563',
    fontSize: '0.95rem',
    lineHeight: 1.6,
  }

  const closeButtonStyle: React.CSSProperties = {
    border: 'none',
    backgroundColor: 'transparent',
    color: '#6b7280',
    cursor: 'pointer',
    fontSize: '1.5rem',
    lineHeight: 1,
    padding: 0,
  }

  const guideSectionTitleStyle: React.CSSProperties = {
    margin: '1.25rem 0 0.75rem',
    fontSize: '0.95rem',
    fontWeight: 700,
    color: '#111827',
  }

  const guideListStyle: React.CSSProperties = {
    display: 'grid',
    gap: '0.75rem',
  }

  const guideItemStyle: React.CSSProperties = {
    border: '1px solid #e5e7eb',
    borderRadius: '0.75rem',
    padding: '0.875rem 1rem',
    backgroundColor: '#f9fafb',
  }

  const highlightedGuideItemStyle: React.CSSProperties = {
    ...guideItemStyle,
    border: '2px solid #2563eb',
    backgroundColor: '#eff6ff',
    boxShadow: '0 0 0 1px rgba(37, 99, 235, 0.08)',
  }

  const guideItemHeaderStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    flexWrap: 'wrap',
    marginBottom: '0.375rem',
  }

  const guideDescriptionStyle: React.CSSProperties = {
    margin: 0,
    color: '#4b5563',
    fontSize: '0.9rem',
    lineHeight: 1.55,
  }

  const scoreBandStyle: React.CSSProperties = {
    fontSize: '0.8rem',
    fontWeight: 600,
    color: '#6b7280',
  }

  const resultGuideItems = [
    {
      key: 'priority_deploy',
      scoreBand: 'Skor 90-100',
      description: 'Kandidat sangat kuat dan bisa diprioritaskan untuk penugasan atau proses lanjut secepatnya.',
    },
    {
      key: 'talent_pool',
      scoreBand: 'Skor 80-89',
      description: 'Kandidat layak disimpan sebagai kandidat potensial, tetapi tidak sekuat prioritas utama.',
    },
    {
      key: 'deployable_penyelia_halal',
      scoreBand: 'Skor 70-79',
      description: 'Kandidat dinilai siap ditempatkan, terutama untuk peran penyelia halal yang sesuai.',
    },
    {
      key: 'training_first',
      scoreBand: 'Skor 60-69',
      description: 'Kandidat punya dasar yang cukup, tetapi sebaiknya mengikuti pembekalan atau training terlebih dulu.',
    },
    {
      key: 'training_required',
      scoreBand: 'Skor 50-59',
      description: 'Kandidat belum siap deploy dan membutuhkan training yang lebih jelas sebelum diproses lanjut.',
    },
    {
      key: 'not_ready',
      scoreBand: 'Skor di bawah 50',
      description: 'Kandidat saat ini belum memenuhi ekspektasi minimum untuk dilanjutkan.',
    },
    {
      key: 'hold',
      scoreBand: 'Manual',
      description: 'Dipakai saat keputusan perlu ditunda, misalnya masih menunggu klarifikasi, dokumen, atau evaluasi tambahan.',
    },
    {
      key: 'senior_halal_compliance',
      scoreBand: 'Manual',
      description: 'Dipakai untuk kandidat yang lebih cocok diarahkan ke jalur senior halal compliance, bukan hasil scoring standar.',
    },
  ] as const

  if (location.pathname !== '/interviews') {
    return <Outlet />
  }

  return (
    <div style={containerStyle}>
      <style>
        {`
          @media (max-width: 900px) {
            .interviews-filter-bar {
              grid-template-columns: 1fr !important;
            }
          }
          @media (max-width: 640px) {
            .desktop-table { display: none !important; }
            .mobile-cards { display: block !important; }
          }
          @media (min-width: 641px) {
            .mobile-cards { display: none !important; }
          }
        `}
      </style>

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

      <div className="interviews-filter-bar" style={filterBarStyle}>
        <DebouncedSearchInput
          key={search.q}
          defaultValue={search.q}
          placeholder="Cari nama kandidat"
          style={inputStyle}
          onValueChange={(value) => {
            if (value === search.q) {
              return
            }

            startTransition(() => {
              void navigate({
                to: '/interviews' as never,
                search: {
                  ...search,
                  q: value.trim(),
                  page: 1,
                } as never,
                replace: true,
              })
            })
          }}
        />
        <select
          value={search.interviewMode}
          onChange={event => updateSearch({
            interviewMode: event.target.value as InterviewsSearch['interviewMode'],
            page: 1,
          })}
          style={inputStyle}
        >
          <option value="all">Semua mode</option>
          {INTERVIEW_MODES.map(mode => (
            <option key={mode} value={mode}>{INTERVIEW_MODE_LABELS[mode]}</option>
          ))}
        </select>
        <select
          value={search.result}
          onChange={event => updateSearch({
            result: event.target.value as InterviewsSearch['result'],
            page: 1,
          })}
          style={inputStyle}
        >
          <option value="all">Semua hasil</option>
          <option value="pending">Belum dinilai</option>
          {INTERVIEW_RESULTS.map(result => (
            <option key={result} value={result}>{INTERVIEW_RESULT_LABELS[result]}</option>
          ))}
        </select>
      </div>

      <div style={tableContainerStyle}>
        {isPending && <div style={loadingStyle}>Memperbarui daftar wawancara...</div>}

        {data.interviews.length === 0
          ? (
              <div style={emptyStyle}>
                <p style={{ color: '#6b7280', marginBottom: '1rem' }}>
                  Belum ada wawancara yang sesuai.
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
                <table className="desktop-table" style={tableStyle}>
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
                    {data.interviews.map((interview: InterviewListItem) => {
                      const modeStyle = getModeBadgeStyle(interview.interview_mode)
                      const badgeBgColor = getResultBadgeColor(interview.result)
                      const resultLabel = interview.result ? INTERVIEW_RESULT_LABELS[interview.result as InterviewResult] : 'Belum Dinilai'
                      const modeLabel = interview.interview_mode ? INTERVIEW_MODE_LABELS[interview.interview_mode as InterviewMode] : '-'
                      const isCompleted = interview.result !== null && interview.result !== undefined

                      return (
                        <tr key={interview.id} style={{ backgroundColor: 'white' }}>
                          <td style={tdStyle}>
                            <Link
                              to={`/partners/${interview.candidate_id}` as never}
                              style={{ color: '#2563eb', textDecoration: 'none', fontWeight: 500 }}
                            >
                              {interview.candidate_name}
                            </Link>
                          </td>
                          <td style={tdStyle}>{interview.interview_date}</td>
                          <td style={tdStyle}>
                            <span style={badgeStyle(modeStyle.backgroundColor, modeStyle.color)}>
                              {modeLabel}
                            </span>
                          </td>
                          <td style={tdStyle}>
                            <button
                              type="button"
                              style={clickableBadgeStyle(badgeBgColor, '#ffffff')}
                              onClick={() => {
                                setSelectedResult(interview.result)
                                setIsResultGuideOpen(true)
                              }}
                              aria-label={`Lihat penjelasan hasil ${resultLabel}`}
                            >
                              {resultLabel}
                            </button>
                          </td>
                          <td style={actionCellStyle}>
                            <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
                              {isCompleted
                                ? (
                                    <Link
                                      to={`/interviews/${interview.id}` as never}
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
                                    </Link>
                                  )
                                : (
                                    <Link
                                      to={`/interviews/${interview.id}/conduct` as never}
                                      style={conductButtonStyle}
                                    >
                                      Lakukan
                                    </Link>
                                  )}
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>

                {/* Mobile Cards View */}
                <div className="mobile-cards">
                  {data.interviews.map((interview: InterviewListItem) => {
                    const modeStyle = getModeBadgeStyle(interview.mode)
                    const modeLabel = interview.mode ? INTERVIEW_MODE_LABELS[interview.mode] : '-'
                    const resultLabel = interview.result
                      ? INTERVIEW_RESULT_LABELS[interview.result]
                      : 'Belum ada hasil'
                    const badgeBgColor = getResultBadgeColor(interview.result)
                    const isCompleted = !!interview.result

                    return (
                      <div key={interview.id} style={mobileCardStyle}>
                        <div style={mobileCardHeaderStyle}>
                          <Link
                            to={`/partners/${interview.candidate_id}` as never}
                            style={{ color: '#2563eb', textDecoration: 'none', fontWeight: 600, fontSize: '1rem', flex: 1 }}
                          >
                            {interview.candidate_name}
                          </Link>
                          <span style={badgeStyle(modeStyle.backgroundColor, modeStyle.color)}>
                            {modeLabel}
                          </span>
                        </div>
                        
                        {interview.candidate_email && (
                          <div style={mobileCardSubtitleStyle}>{interview.candidate_email}</div>
                        )}
                        
                        <div style={mobileCardRowStyle}>
                          <span style={mobileCardLabelStyle}>Tanggal</span>
                          <span style={mobileCardValueStyle}>{interview.interview_date}</span>
                        </div>
                        
                        <div style={mobileCardRowStyle}>
                          <span style={mobileCardLabelStyle}>Hasil</span>
                          <button
                            type="button"
                            style={clickableBadgeStyle(badgeBgColor, '#ffffff')}
                            onClick={() => {
                              setSelectedResult(interview.result)
                              setIsResultGuideOpen(true)
                            }}
                          >
                            {resultLabel}
                          </button>
                        </div>
                        
                        <div style={mobileCardActionsStyle}>
                          {isCompleted
                            ? (
                                <Link
                                  to={`/interviews/${interview.id}` as never}
                                  style={{
                                    ...actionButtonBaseStyle,
                                    backgroundColor: '#2563eb',
                                    color: 'white',
                                    border: '1px solid #2563eb',
                                  }}
                                >
                                  Lihat Detail
                                </Link>
                              )
                            : (
                                <Link
                                  to={`/interviews/${interview.id}/conduct` as never}
                                  style={{
                                    ...actionButtonBaseStyle,
                                    backgroundColor: '#16a34a',
                                    color: 'white',
                                    border: '1px solid #16a34a',
                                  }}
                                >
                                  Lakukan Wawancara
                                </Link>
                              )}
                        </div>
                      </div>
                    )
                  })}
                </div>

                {data.totalPages > 1 && (
                  <div style={paginationStyle}>
                    <div style={pageInfoStyle}>
                      Menampilkan
                      {' '}
                      {data.interviews.length}
                      {' '}
                      dari
                      {' '}
                      {data.totalCount}
                      {' '}
                      wawancara
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        style={data.currentPage === 1 ? disabledButtonStyle : paginationButtonStyle}
                        onClick={() => loadPage(data.currentPage - 1)}
                        disabled={data.currentPage === 1 || isPending}
                      >
                        Sebelumnya
                      </button>
                      <span style={{ ...pageInfoStyle, display: 'flex', alignItems: 'center' }}>
                        Halaman
                        {' '}
                        {data.currentPage}
                        {' '}
                        dari
                        {' '}
                        {data.totalPages}
                      </span>
                      <button
                        style={data.currentPage === data.totalPages ? disabledButtonStyle : paginationButtonStyle}
                        onClick={() => loadPage(data.currentPage + 1)}
                        disabled={data.currentPage === data.totalPages || isPending}
                      >
                        Berikutnya
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
      </div>

      {isResultGuideOpen && (
        <div
          style={modalOverlayStyle}
          onClick={() => {
            setIsResultGuideOpen(false)
            setSelectedResult(null)
          }}
        >
          <div
            style={modalCardStyle}
            onClick={event => event.stopPropagation()}
          >
            <div style={modalHeaderStyle}>
              <div>
                <h2 style={modalTitleStyle}>Penjelasan Hasil Wawancara</h2>
                <p style={modalTextStyle}>
                  Hasil menunjukkan rekomendasi akhir setelah wawancara. Sebagian besar status ditentukan otomatis dari skor total, sementara beberapa status dipilih manual bila ada pertimbangan khusus.
                </p>
              </div>
              <button
                type="button"
                style={closeButtonStyle}
                onClick={() => {
                  setIsResultGuideOpen(false)
                  setSelectedResult(null)
                }}
                aria-label="Tutup penjelasan hasil"
              >
                ×
              </button>
            </div>

            {selectedResult === null && (
              <p style={{ ...modalTextStyle, marginTop: 0 }}>
                Interview ini belum punya hasil akhir. Penjelasan di bawah menunjukkan arti status yang akan dipakai setelah wawancara selesai dinilai.
              </p>
            )}

            <h3 style={guideSectionTitleStyle}>Arti tiap hasil</h3>
            <div style={guideListStyle}>
              {resultGuideItems.map((item) => {
                const isHighlighted = selectedResult === item.key
                return (
                  <div key={item.key} style={isHighlighted ? highlightedGuideItemStyle : guideItemStyle}>
                    <div style={guideItemHeaderStyle}>
                      <span style={badgeStyle(getResultBadgeColor(item.key), '#ffffff')}>
                        {INTERVIEW_RESULT_LABELS[item.key]}
                      </span>
                      <span style={scoreBandStyle}>{item.scoreBand}</span>
                    </div>
                    <p style={guideDescriptionStyle}>{item.description}</p>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
