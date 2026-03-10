import type { AssessmentListItem, AssessmentsResponse, CompetencyResult } from '../server/assessments'
import { createFileRoute, Link, Outlet, useLocation, useNavigate } from '@tanstack/react-router'
import * as React from 'react'
import { DebouncedSearchInput } from '../components/DebouncedSearchInput'
import { ASSESSMENT_STATUS_LABELS, COMPETENCY_RESULT_LABELS, COMPETENCY_RESULTS, getAssessments } from '../server/assessments'
import { parseEnumValue, parsePageSizeValue, parsePageValue, parseQueryValue } from '../utils/listSearch'

interface AssessmentsSearch {
  page: number
  pageSize: number
  q: string
  status: AssessmentListItem['status'] | 'all'
  competencyResult: CompetencyResult | 'pending' | 'all'
}

const ASSESSMENT_STATUS_VALUES: Array<AssessmentListItem['status']> = ['not_started', 'in_progress', 'submitted', 'reviewed']

export const Route = createFileRoute('/assessments')({
  validateSearch: (search): AssessmentsSearch => ({
    page: parsePageValue(search.page),
    pageSize: parsePageSizeValue(search.pageSize),
    q: parseQueryValue(search.q),
    status: parseEnumValue(search.status, ['all', ...ASSESSMENT_STATUS_VALUES], 'all'),
    competencyResult: parseEnumValue(search.competencyResult, ['all', 'pending', ...COMPETENCY_RESULTS], 'all'),
  }),
  loaderDeps: ({ search }) => search,
  component: AssessmentsComponent,
  beforeLoad: async ({ context }) => {
    if (!context.user) {
      throw new Error('UNAUTHORIZED')
    }
    return { user: context.user }
  },
  loader: async ({ deps }): Promise<AssessmentsResponse> => {
    return await getAssessments({ data: deps })
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

const assessmentStatusGuideItems: Array<{
  key: AssessmentListItem['status']
  description: string
}> = [
  {
    key: 'not_started',
    description: 'Penilaian sudah dibuat, tetapi peserta belum mulai mengisi. Tindakan berikutnya biasanya membuka assessment dan mulai menjawab.',
  },
  {
    key: 'in_progress',
    description: 'Peserta sudah mulai mengerjakan, tetapi belum mengirimkan jawaban final. Assessment masih bisa dilanjutkan dari halaman pengerjaan.',
  },
  {
    key: 'submitted',
    description: 'Jawaban sudah dikirim dan menunggu hasil akhir atau review lanjutan. Isi assessment sudah tidak dalam tahap pengerjaan aktif.',
  },
  {
    key: 'reviewed',
    description: 'Assessment sudah selesai diproses dan hasil kompetensi akhir sudah tersedia. Detail hasil bisa dilihat dari halaman hasil assessment.',
  },
]

function AssessmentsComponent() {
  const location = useLocation()
  const navigate = useNavigate()
  const search = Route.useSearch() as AssessmentsSearch
  const data = Route.useLoaderData() as AssessmentsResponse
  const [selectedStatus, setSelectedStatus] = React.useState<AssessmentListItem['status'] | null>(null)
  const [isPending, startTransition] = React.useTransition()

  React.useEffect(() => {
    if (search.page === data.currentPage) {
      return
    }

    void navigate({
      to: '/assessments' as never,
      search: { ...search, page: data.currentPage } as never,
      replace: true,
    })
  }, [data.currentPage, navigate, search])

  const updateSearch = (nextSearch: Partial<AssessmentsSearch>) => {
    startTransition(() => {
      void navigate({
        to: '/assessments' as never,
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

  const handleStartNewAssessment = () => {
    void navigate({ to: '/assessments/new' as never })
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

  const participantLinkStyle: React.CSSProperties = {
    color: '#2563eb',
    textDecoration: 'none',
    fontWeight: 500,
  }

  const actionCellStyle: React.CSSProperties = {
    ...tdStyle,
    width: '1%',
    whiteSpace: 'nowrap',
  }

  const actionButtonStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '36px',
    padding: '0.5rem 0.875rem',
    borderRadius: '0.375rem',
    border: '1px solid #d1d5db',
    backgroundColor: 'white',
    color: '#111827',
    fontSize: '0.875rem',
    fontWeight: 500,
    textDecoration: 'none',
  }

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
    maxWidth: '720px',
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

  const currentStatusTextStyle: React.CSSProperties = {
    margin: '0 0 1rem',
    fontSize: '0.85rem',
    fontWeight: 600,
    color: '#2563eb',
  }

  if (location.pathname !== '/assessments') {
    return <Outlet />
  }

  return (
    <div style={containerStyle}>
      <style>
        {`
          @media (max-width: 900px) {
            .assessments-filter-bar {
              grid-template-columns: 1fr !important;
            }
          }
        `}
      </style>

      <div style={headerStyle}>
        <h1 style={titleStyle}>Daftar Penilaian</h1>
        <button
          style={createButtonStyle}
          onClick={handleStartNewAssessment}
        >
          + Penilaian Baru
        </button>
      </div>

      <div className="assessments-filter-bar" style={filterBarStyle}>
        <DebouncedSearchInput
          key={search.q}
          defaultValue={search.q}
          placeholder="Cari peserta atau template"
          style={inputStyle}
          onValueChange={(value) => {
            if (value === search.q) {
              return
            }

            startTransition(() => {
              void navigate({
                to: '/assessments' as never,
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
          value={search.status}
          onChange={event => updateSearch({
            status: event.target.value as AssessmentsSearch['status'],
            page: 1,
          })}
          style={inputStyle}
        >
          <option value="all">Semua status</option>
          {ASSESSMENT_STATUS_VALUES.map(status => (
            <option key={status} value={status}>{ASSESSMENT_STATUS_LABELS[status]}</option>
          ))}
        </select>
        <select
          value={search.competencyResult}
          onChange={event => updateSearch({
            competencyResult: event.target.value as AssessmentsSearch['competencyResult'],
            page: 1,
          })}
          style={inputStyle}
        >
          <option value="all">Semua hasil</option>
          <option value="pending">Belum ada hasil</option>
          {COMPETENCY_RESULTS.map(result => (
            <option key={result} value={result}>{COMPETENCY_RESULT_LABELS[result]}</option>
          ))}
        </select>
      </div>

      <div style={tableContainerStyle}>
        {isPending && <div style={loadingStyle}>Memperbarui daftar penilaian...</div>}

        {data.assessments.length === 0
          ? (
              <div style={emptyStyle}>
                <p style={{ color: '#6b7280', marginBottom: '1rem' }}>
                  Belum ada penilaian yang sesuai.
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
                      <th style={thStyle}>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.assessments.map((assessment: AssessmentListItem) => {
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
                            <Link
                              to={`/partners/${assessment.participant_id}` as never}
                              style={participantLinkStyle}
                            >
                              {assessment.participant_name}
                            </Link>
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
                            <button
                              type="button"
                              style={clickableBadgeStyle(statusStyle.backgroundColor, statusStyle.color)}
                              onClick={() => setSelectedStatus(assessment.status)}
                              aria-label={`Lihat arti status ${statusLabel}`}
                            >
                              {statusLabel}
                            </button>
                          </td>
                          <td style={actionCellStyle}>
                            <Link
                              to={(assessment.status === 'not_started' || assessment.status === 'in_progress'
                                ? `/assessments/${assessment.id}/take`
                                : `/assessments/${assessment.id}/results`) as never}
                              style={actionButtonStyle}
                            >
                              {assessment.status === 'not_started' || assessment.status === 'in_progress'
                                ? 'Lihat / Kerjakan'
                                : 'Lihat Detail'}
                            </Link>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>

                {data.totalPages > 1 && (
                  <div style={paginationStyle}>
                    <div style={pageInfoStyle}>
                      Menampilkan
                      {' '}
                      {data.assessments.length}
                      {' '}
                      dari
                      {' '}
                      {data.totalCount}
                      {' '}
                      penilaian
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

      {selectedStatus && (
        <div
          style={modalOverlayStyle}
          onClick={() => setSelectedStatus(null)}
        >
          <div
            style={modalCardStyle}
            onClick={event => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="assessment-status-modal-title"
          >
            <div style={modalHeaderStyle}>
              <div>
                <h2 id="assessment-status-modal-title" style={modalTitleStyle}>Penjelasan Status Penilaian</h2>
                <p style={modalTextStyle}>
                  Klik badge status untuk melihat arti setiap tahap proses assessment. Status yang sedang aktif untuk baris yang Anda pilih akan ditandai.
                </p>
              </div>
              <button
                type="button"
                style={closeButtonStyle}
                onClick={() => setSelectedStatus(null)}
                aria-label="Tutup penjelasan status"
              >
                ×
              </button>
            </div>

            <p style={currentStatusTextStyle}>
              Status saat ini:
              {' '}
              {ASSESSMENT_STATUS_LABELS[selectedStatus]}
            </p>

            <h3 style={guideSectionTitleStyle}>Arti tiap status</h3>
            <div style={guideListStyle}>
              {assessmentStatusGuideItems.map((item) => {
                const badgeColors = getStatusBadgeStyle(item.key)
                const isHighlighted = selectedStatus === item.key
                return (
                  <div key={item.key} style={isHighlighted ? highlightedGuideItemStyle : guideItemStyle}>
                    <div style={guideItemHeaderStyle}>
                      <span style={badgeStyle(badgeColors.backgroundColor, badgeColors.color)}>
                        {ASSESSMENT_STATUS_LABELS[item.key]}
                      </span>
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
