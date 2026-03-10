import type { AuthUser } from '../server/auth'
import type { PartnerListItem, PartnersResponse, PartnerType } from '../server/partners'
import { createFileRoute, Link, Outlet, useLocation } from '@tanstack/react-router'
import * as React from 'react'
import { DebouncedSearchInput } from '../components/DebouncedSearchInput'
import { getPartners, PARTNER_TYPE_LABELS, PARTNER_TYPES } from '../server/partners'
import { parseEnumValue, parsePageSizeValue, parsePageValue, parseQueryValue } from '../utils/listSearch'

interface PartnersSearch {
  page: number
  pageSize: number
  q: string
  partnerType: PartnerType | 'all'
  isActive: 'all' | 'active' | 'inactive'
}

export const Route = createFileRoute('/partners')({
  validateSearch: (search): PartnersSearch => ({
    page: parsePageValue(search.page),
    pageSize: parsePageSizeValue(search.pageSize),
    q: parseQueryValue(search.q),
    partnerType: parseEnumValue(search.partnerType, ['all', ...PARTNER_TYPES], 'all'),
    isActive: parseEnumValue(search.isActive, ['all', 'active', 'inactive'], 'all'),
  }),
  loaderDeps: ({ search }) => search,
  component: PartnersComponent,
  beforeLoad: async ({ context }) => {
    if (!context.user) {
      throw new Error('UNAUTHORIZED')
    }
    return { user: context.user }
  },
  loader: async ({ deps }): Promise<PartnersResponse> => {
    return await getPartners({ data: deps })
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
  const location = useLocation()
  const navigate = Route.useNavigate()
  const search = Route.useSearch() as PartnersSearch
  const { user } = Route.useRouteContext() as { user: AuthUser }
  const data = Route.useLoaderData() as PartnersResponse
  const [isPending, startTransition] = React.useTransition()

  React.useEffect(() => {
    if (search.page === data.currentPage) {
      return
    }

    void navigate({
      search: { ...search, page: data.currentPage } as never,
      replace: true,
    })
  }, [data.currentPage, navigate, search])

  const updateSearch = (nextSearch: Partial<PartnersSearch>) => {
    startTransition(() => {
      void navigate({
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

  const handleCreatePartner = () => {
    void navigate({ to: '/partners/new' as never })
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

  const startItem = data.totalCount > 0 ? (data.currentPage - 1) * data.pageSize + 1 : 0
  const endItem = Math.min(data.currentPage * data.pageSize, data.totalCount)

  if (location.pathname !== '/partners') {
    return <Outlet />
  }

  return (
    <div style={containerStyle}>
      <style>
        {`
        @media (max-width: 900px) {
          .partners-filter-bar {
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
        <h1 style={titleStyle}>Daftar Mitra</h1>
        <div style={headerActionsStyle}>
          <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>
            Total:
            {data.totalCount}
            {' '}
            mitra
          </span>
          {user.isAdmin && (
            <button onClick={handleCreatePartner} style={createButtonStyle}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M8 2a.75.75 0 0 1 .75.75v4.5h4.5a.75.75 0 0 1 0 1.5h-4.5v4.5a.75.75 0 0 1-1.5 0v-4.5h-4.5a.75.75 0 0 1 0-1.5h4.5v-4.5A.75.75 0 0 1 8 2Z" />
              </svg>
              Tambah Mitra
            </button>
          )}
        </div>
      </div>

      <div className="partners-filter-bar" style={filterBarStyle}>
        <DebouncedSearchInput
          key={search.q}
          defaultValue={search.q}
          placeholder="Cari nama, email, atau telepon"
          style={inputStyle}
          onValueChange={(value) => {
            if (value === search.q) {
              return
            }

            startTransition(() => {
              void navigate({
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
          value={search.partnerType}
          onChange={event => updateSearch({
            partnerType: event.target.value as PartnersSearch['partnerType'],
            page: 1,
          })}
          style={inputStyle}
        >
          <option value="all">Semua tipe</option>
          {PARTNER_TYPES.map(type => (
            <option key={type} value={type}>{PARTNER_TYPE_LABELS[type]}</option>
          ))}
        </select>
        <select
          value={search.isActive}
          onChange={event => updateSearch({
            isActive: event.target.value as PartnersSearch['isActive'],
            page: 1,
          })}
          style={inputStyle}
        >
          <option value="all">Semua status</option>
          <option value="active">Aktif</option>
          <option value="inactive">Nonaktif</option>
        </select>
      </div>

      <div style={tableContainerStyle}>
        {isPending && <div style={loadingStyle}>Memperbarui daftar mitra...</div>}

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
            {data.partners.length === 0
              ? (
                  <tr><td colSpan={4} style={emptyStyle}>Tidak ada data mitra yang sesuai.</td></tr>
                )
              : (
                  data.partners.map((partner: PartnerListItem) => (
                    <tr key={partner.id}>
                      <td style={tdStyle}>
                        <Link to={'/partners/$id' as never} params={{ id: partner.id } as never} style={{ color: '#111827', textDecoration: 'none' }}>
                          {partner.full_name}
                        </Link>
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
          {data.partners.length === 0
            ? (
                <div style={emptyStyle}>Tidak ada data mitra yang sesuai.</div>
              )
            : (
                data.partners.map((partner: PartnerListItem) => (
                  <div key={partner.id} style={mobileCardStyle}>
                    <div>
                      <Link to={'/partners/$id' as never} params={{ id: partner.id } as never}>{partner.full_name}</Link>
                    </div>
                    <div>{formatPartnerType(partner.partner_type)}</div>
                  </div>
                ))
              )}
        </div>

        {data.totalPages > 1 && (
          <div style={paginationStyle}>
            <div>
              Menampilkan
              {startItem}
              {' '}
              -
              {endItem}
              {' '}
              dari
              {data.totalCount}
              {' '}
              data
            </div>
            <div style={{ display: 'flex', gap: '0.25rem' }}>
              <button
                onClick={() => loadPage(data.currentPage - 1)}
                disabled={data.currentPage === 1 || isPending}
                style={data.currentPage === 1 ? buttonDisabledStyle : buttonBaseStyle}
              >
                &larr;
              </button>
              {Array.from({ length: data.totalPages }, (_, index) => index + 1)
                .filter(page => page <= 2 || page > data.totalPages - 2 || Math.abs(page - data.currentPage) <= 1)
                .map(page => (
                  <button
                    key={page}
                    onClick={() => loadPage(page)}
                    disabled={isPending}
                    style={page === data.currentPage ? buttonActiveStyle : buttonBaseStyle}
                  >
                    {page}
                  </button>
                ))}
              <button
                onClick={() => loadPage(data.currentPage + 1)}
                disabled={data.currentPage === data.totalPages || isPending}
                style={data.currentPage === data.totalPages ? buttonDisabledStyle : buttonBaseStyle}
              >
                &rarr;
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
