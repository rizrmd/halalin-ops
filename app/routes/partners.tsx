import * as React from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { getPartners, type PartnersResponse, type PartnerListItem } from '../server/partners'

export const Route = createFileRoute('/partners')({
  component: PartnersComponent,
  beforeLoad: async ({ context }) => {
    // Check authentication - redirect to login if user is not authenticated
    if (!context.user) {
      throw new Error('UNAUTHORIZED')
    }
    return { user: context.user }
  },
  loader: async (): Promise<PartnersResponse> => {
    // Initial load with page 1
    return await getPartners({ data: { page: 1, pageSize: 20 } })
  },
})

// Helper to format partner type for display
function formatPartnerType(type: string): string {
  const typeMap: Record<string, string> = {
    candidate: 'Kandidat',
    mitra: 'Mitra',
    penyelia_halal: 'Penyelia Halal',
    tenaga_ahli: 'Tenaga Ahli',
    halal_auditor: 'Auditor Halal',
    interviewer: 'Pewawancara',
  }
  return typeMap[type] || type
}

function PartnersComponent() {
  const { user } = Route.useRouteContext() as { user: { id: string; name: string; email: string | null; partnerType: string } }
  const initialData = Route.useLoaderData() as PartnersResponse

  const [partners, setPartners] = React.useState<PartnerListItem[]>(initialData.partners)
  const [currentPage, setCurrentPage] = React.useState(initialData.currentPage)
  const [totalPages, setTotalPages] = React.useState(initialData.totalPages)
  const [totalCount, setTotalCount] = React.useState(initialData.totalCount)
  const [isLoading, setIsLoading] = React.useState(false)

  const loadPage = async (page: number) => {
    if (page < 1 || page > totalPages || page === currentPage) return

    setIsLoading(true)
    try {
      const response = await getPartners({ data: { page, pageSize: 20 } })
      setPartners(response.partners)
      setCurrentPage(response.currentPage)
      setTotalPages(response.totalPages)
      setTotalCount(response.totalCount)
    } catch (error) {
      console.error('Error loading partners:', error)
    } finally {
      setIsLoading(false)
    }
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
  }

  const titleStyle: React.CSSProperties = {
    fontSize: '1.875rem',
    fontWeight: 'bold',
    color: '#111827',
    margin: 0,
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
    letterSpacing: '0.05em',
    borderBottom: '1px solid #e5e7eb',
  }

  const tdStyle: React.CSSProperties = {
    padding: '1rem',
    borderBottom: '1px solid #e5e7eb',
    color: '#374151',
    fontSize: '0.875rem',
  }

  const trHoverStyle: React.CSSProperties = {
    transition: 'background-color 0.15s ease',
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

  const paginationInfoStyle: React.CSSProperties = {
    fontSize: '0.875rem',
    color: '#6b7280',
  }

  const paginationButtonsStyle: React.CSSProperties = {
    display: 'flex',
    gap: '0.25rem',
  }

  const buttonBaseStyle: React.CSSProperties = {
    padding: '0.5rem 0.75rem',
    border: '1px solid #d1d5db',
    backgroundColor: 'white',
    color: '#374151',
    fontSize: '0.875rem',
    cursor: 'pointer',
    borderRadius: '0.375rem',
    transition: 'all 0.15s ease',
    minWidth: '44px',
    minHeight: '44px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  }

  const buttonDisabledStyle: React.CSSProperties = {
    ...buttonBaseStyle,
    opacity: 0.5,
    cursor: 'not-allowed',
    backgroundColor: '#f3f4f6',
  }

  const buttonActiveStyle: React.CSSProperties = {
    ...buttonBaseStyle,
    backgroundColor: '#2563eb',
    color: 'white',
    borderColor: '#2563eb',
  }

  // Responsive card view for mobile
  const mobileCardStyle: React.CSSProperties = {
    display: 'block',
    padding: '1rem',
    borderBottom: '1px solid #e5e7eb',
    backgroundColor: 'white',
  }

  const mobileCardLastStyle: React.CSSProperties = {
    ...mobileCardStyle,
    borderBottom: 'none',
  }

  const mobileCardLabelStyle: React.CSSProperties = {
    fontSize: '0.75rem',
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    marginBottom: '0.25rem',
  }

  const mobileCardValueStyle: React.CSSProperties = {
    fontSize: '0.875rem',
    color: '#111827',
    fontWeight: 500,
  }

  const mobileCardRowStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '0.75rem',
    marginBottom: '0.75rem',
  }

  const partnerTypeBadgeStyle: React.CSSProperties = {
    display: 'inline-block',
    padding: '0.25rem 0.5rem',
    backgroundColor: '#e0e7ff',
    color: '#4338ca',
    borderRadius: '9999px',
    fontSize: '0.75rem',
    fontWeight: 600,
  }

  // CSS for responsive table
  const responsiveStyle = `
    @media (max-width: 640px) {
      .desktop-table { display: none !important; }
      .mobile-cards { display: block !important; }
    }
    @media (min-width: 641px) {
      .mobile-cards { display: none !important; }
    }
    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
  `

  const startItem = totalCount > 0 ? (currentPage - 1) * 20 + 1 : 0
  const endItem = Math.min(currentPage * 20, totalCount)

  return (
    <div style={containerStyle}>
      <style dangerouslySetInnerHTML={{ __html: responsiveStyle }} />
      <div style={headerStyle}>
        <h1 style={titleStyle}>Daftar Mitra</h1>
        <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>
          Total: {totalCount} mitra
        </span>
      </div>

      {isLoading ? (
        <div style={loadingStyle}>
          <div style={{ marginBottom: '0.5rem' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ animation: 'spin 1s linear infinite' }}>
              <circle cx="12" cy="12" r="10" stroke="#6b7280" strokeWidth="4" strokeDasharray="60" strokeDashoffset="20" />
            </svg>
          </div>
          <p>Memuat data mitra...</p>
        </div>
      ) : (
        <div style={tableContainerStyle}>
          {/* Desktop Table View */}
          <table className="desktop-table" style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>Nama</th>
                <th style={thStyle}>Email</th>
                <th style={thStyle}>Telepon</th>
                <th style={thStyle}>Tipe Mitra</th>
              </tr>
            </thead>
            <tbody>
              {partners.length === 0 ? (
                <tr>
                  <td colSpan={4} style={emptyStyle}>
                    Tidak ada data mitra yang tersedia.
                  </td>
                </tr>
              ) : (
                partners.map((partner: PartnerListItem, index: number) => (
                  <tr
                    key={partner.id}
                    style={{
                      ...trHoverStyle,
                      backgroundColor: index % 2 === 1 ? '#f9fafb' : 'white',
                    }}
                  >
                    <td style={tdStyle}>
                      <div style={{ fontWeight: 500, color: '#111827' }}>
                        {partner.full_name}
                      </div>
                    </td>
                    <td style={tdStyle}>
                      {partner.email ? (
                        <a href={`mailto:${partner.email}`} style={{ color: '#2563eb', textDecoration: 'none' }}>
                          {partner.email}
                        </a>
                      ) : (
                        <span style={{ color: '#9ca3af' }}>-</span>
                      )}
                    </td>
                    <td style={tdStyle}>
                      {partner.phone ? (
                        <a href={`tel:${partner.phone}`} style={{ color: '#2563eb', textDecoration: 'none' }}>
                          {partner.phone}
                        </a>
                      ) : (
                        <span style={{ color: '#9ca3af' }}>-</span>
                      )}
                    </td>
                    <td style={tdStyle}>
                      <span style={partnerTypeBadgeStyle}>
                        {formatPartnerType(partner.partner_type)}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {/* Mobile Card View */}
          <div className="mobile-cards">
            {partners.length === 0 ? (
              <div style={emptyStyle}>
                Tidak ada data mitra yang tersedia.
              </div>
            ) : (
              partners.map((partner: PartnerListItem, index: number) => (
                <div
                  key={partner.id}
                  style={index === partners.length - 1 ? mobileCardLastStyle : mobileCardStyle}
                >
                  <div style={mobileCardRowStyle}>
                    <div>
                      <div style={mobileCardLabelStyle}>Nama</div>
                      <div style={mobileCardValueStyle}>{partner.full_name}</div>
                    </div>
                    <div>
                      <div style={mobileCardLabelStyle}>Tipe Mitra</div>
                      <div>
                        <span style={partnerTypeBadgeStyle}>
                          {formatPartnerType(partner.partner_type)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div style={mobileCardRowStyle}>
                    <div>
                      <div style={mobileCardLabelStyle}>Email</div>
                      <div style={mobileCardValueStyle}>
                        {partner.email ? (
                          <a href={`mailto:${partner.email}`} style={{ color: '#2563eb', textDecoration: 'none' }}>
                            {partner.email}
                          </a>
                        ) : (
                          <span style={{ color: '#9ca3af' }}>-</span>
                        )}
                      </div>
                    </div>
                    <div>
                      <div style={mobileCardLabelStyle}>Telepon</div>
                      <div style={mobileCardValueStyle}>
                        {partner.phone ? (
                          <a href={`tel:${partner.phone}`} style={{ color: '#2563eb', textDecoration: 'none' }}>
                            {partner.phone}
                          </a>
                        ) : (
                          <span style={{ color: '#9ca3af' }}>-</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={paginationStyle}>
              <div style={paginationInfoStyle}>
                Menampilkan {startItem} - {endItem} dari {totalCount} data
              </div>
              <div style={paginationButtonsStyle}>
                {/* Previous button */}
                <button
                  onClick={() => loadPage(currentPage - 1)}
                  disabled={currentPage === 1 || isLoading}
                  style={currentPage === 1 ? buttonDisabledStyle : buttonBaseStyle}
                >
                  &larr;
                </button>

                {/* Page buttons */}
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(page => {
                    // Show first 2, last 2, and pages around current
                    return page <= 2 || page > totalPages - 2 || Math.abs(page - currentPage) <= 1
                  })
                  .map((page: number, index: number, arr: number[]) => {
                    // Add ellipsis if there's a gap
                    if (index > 0 && page - arr[index - 1] > 1) {
                      return (
                        <span key={`ellipsis-${page}`} style={{ padding: '0.5rem', color: '#6b7280' }}>
                          ...
                        </span>
                      )
                    }
                    return (
                      <button
                        key={page}
                        onClick={() => loadPage(page)}
                        disabled={isLoading}
                        style={page === currentPage ? buttonActiveStyle : buttonBaseStyle}
                      >
                        {page}
                      </button>
                    )
                  })}

                {/* Next button */}
                <button
                  onClick={() => loadPage(currentPage + 1)}
                  disabled={currentPage === totalPages || isLoading}
                  style={currentPage === totalPages ? buttonDisabledStyle : buttonBaseStyle}
                >
                  &rarr;
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
