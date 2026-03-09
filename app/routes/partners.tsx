import * as React from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { getPartners, type PartnersResponse, type PartnerListItem } from '../server/partners'

export const Route = createFileRoute('/partners')({
  component: PartnersComponent,
  beforeLoad: async ({ context }) => {
    if (!context.user) {
      throw new Error('UNAUTHORIZED')
    }
    return { user: context.user }
  },
  loader: async (): Promise<PartnersResponse> => {
    return await getPartners({ data: { page: 1, pageSize: 20 } })
  },
})

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

  const handleCreatePartner = () => {
    window.location.href = '/partners/new'
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

  const buttonBaseStyle: React.CSSProperties = {
    padding: '0.5rem 0.75rem',
    border: '1px solid #d1d5db',
    backgroundColor: 'white',
    color: '#374151',
    fontSize: '0.875rem',
    cursor: 'pointer',
    borderRadius: '0.375rem',
    minWidth: '44px',
    minHeight: '44px',
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

  const mobileCardStyle: React.CSSProperties = {
    display: 'block',
    padding: '1rem',
    borderBottom: '1px solid #e5e7eb',
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

  const startItem = totalCount > 0 ? (currentPage - 1) * 20 + 1 : 0
  const endItem = Math.min(currentPage * 20, totalCount)

  return (
    <div style={containerStyle}>
      <style>{`
        @media (max-width: 640px) {
          .desktop-table { display: none !important; }
          .mobile-cards { display: block !important; }
        }
        @media (min-width: 641px) {
          .mobile-cards { display: none !important; }
        }
      `}</style>

      <div style={headerStyle}>
        <h1 style={titleStyle}>Daftar Mitra</h1>
        <div style={headerActionsStyle}>
          <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>Total: {totalCount} mitra</span>
          <button onClick={handleCreatePartner} style={createButtonStyle}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 2a.75.75 0 0 1 .75.75v4.5h4.5a.75.75 0 0 1 0 1.5h-4.5v4.5a.75.75 0 0 1-1.5 0v-4.5h-4.5a.75.75 0 0 1 0-1.5h4.5v-4.5A.75.75 0 0 1 8 2Z" />
            </svg>
            Tambah Mitra
          </button>
        </div>
      </div>

      {isLoading ? (
        <div style={loadingStyle}>Memuat data mitra...</div>
      ) : (
        <div style={tableContainerStyle}>
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
                <tr><td colSpan={4} style={emptyStyle}>Tidak ada data mitra yang tersedia.</td></tr>
              ) : (
                partners.map((partner) => (
                  <tr key={partner.id}>
                    <td style={tdStyle}>
                      <a href={`/partners/${partner.id}`} style={{ color: '#111827', textDecoration: 'none' }}>
                        {partner.full_name}
                      </a>
                    </td>
                    <td style={tdStyle}>{partner.email || '-'}</td>
                    <td style={tdStyle}>{partner.phone || '-'}</td>
                    <td style={tdStyle}>
                      <span style={partnerTypeBadgeStyle}>{formatPartnerType(partner.partner_type)}</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          <div className="mobile-cards">
            {partners.length === 0 ? (
              <div style={emptyStyle}>Tidak ada data mitra yang tersedia.</div>
            ) : (
              partners.map((partner) => (
                <div key={partner.id} style={mobileCardStyle}>
                  <div>
                    <a href={`/partners/${partner.id}`}>{partner.full_name}</a>
                  </div>
                  <div>{formatPartnerType(partner.partner_type)}</div>
                </div>
              ))
            )}
          </div>

          {totalPages > 1 && (
            <div style={paginationStyle}>
              <div>Menampilkan {startItem} - {endItem} dari {totalCount} data</div>
              <div style={{ display: 'flex', gap: '0.25rem' }}>
                <button
                  onClick={() => loadPage(currentPage - 1)}
                  disabled={currentPage === 1 || isLoading}
                  style={currentPage === 1 ? buttonDisabledStyle : buttonBaseStyle}
                >
                  &larr;
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(page => page <= 2 || page > totalPages - 2 || Math.abs(page - currentPage) <= 1)
                  .map((page) => (
                    <button
                      key={page}
                      onClick={() => loadPage(page)}
                      disabled={isLoading}
                      style={page === currentPage ? buttonActiveStyle : buttonBaseStyle}
                    >
                      {page}
                    </button>
                  ))}
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
