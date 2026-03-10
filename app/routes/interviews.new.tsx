import type { FormOptionsResponse, ValidationError } from '../server/interviews'
import { createFileRoute } from '@tanstack/react-router'
import * as React from 'react'
import {
  createInterview,

  getInterviewFormOptions,
  INTERVIEW_MODE_LABELS,
  INTERVIEW_MODES,

} from '../server/interviews'

export const Route = createFileRoute('/interviews/new')({
  component: CreateInterviewComponent,
  beforeLoad: async ({ context }) => {
    if (!context.user) {
      throw new Error('UNAUTHORIZED')
    }
    return { user: context.user }
  },
  loader: async (): Promise<FormOptionsResponse> => {
    return await getInterviewFormOptions()
  },
})

interface FormData {
  candidate_id: string
  interviewer_id: string
  interview_date: string
  interview_mode: string
  bank_id: string
  objective: string
  notes: string
}

const initialFormData: FormData = {
  candidate_id: '',
  interviewer_id: '',
  interview_date: '',
  interview_mode: '',
  bank_id: '',
  objective: '',
  notes: '',
}

function CreateInterviewComponent() {
  const initialData = Route.useLoaderData() as FormOptionsResponse
  const [formData, setFormData] = React.useState<FormData>(initialFormData)
  const [options, setOptions] = React.useState<FormOptionsResponse>(initialData)
  const [errors, setErrors] = React.useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [submitError, setSubmitError] = React.useState<string | null>(null)
  const [submitSuccess, setSubmitSuccess] = React.useState(false)

  const handleChange = (field: keyof FormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
    if (submitError) {
      setSubmitError(null)
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}
    if (!formData.candidate_id) {
      newErrors.candidate_id = 'Kandidat wajib dipilih'
    }
    if (!formData.interview_date) {
      newErrors.interview_date = 'Tanggal wawancara wajib diisi'
    }
    if (!formData.interview_mode) {
      newErrors.interview_mode = 'Mode wawancara wajib dipilih'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm())
      return

    setIsSubmitting(true)
    setSubmitError(null)

    try {
      const result = await createInterview({
        data: {
          candidate_id: formData.candidate_id,
          interviewer_id: formData.interviewer_id || undefined,
          interview_date: formData.interview_date,
          interview_mode: formData.interview_mode as 'onsite' | 'online' | 'hybrid',
          bank_id: formData.bank_id || undefined,
          objective: formData.objective || undefined,
          notes: formData.notes || undefined,
        },
      })

      if (result.success && result.interview) {
        setSubmitSuccess(true)
        setFormData(initialFormData)
        setTimeout(() => {
          window.location.href = '/interviews'
        }, 1500)
      }
      else if (result.errors) {
        const fieldErrors: Record<string, string> = {}
        result.errors.forEach((err: ValidationError) => {
          fieldErrors[err.field] = err.message
        })
        setErrors(fieldErrors)
      }
    }
    catch (error) {
      console.error('Error creating interview:', error)
      setSubmitError('Terjadi kesalahan saat menyimpan data. Silakan coba lagi.')
    }
    finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    window.location.href = '/interviews'
  }

  // Get today's date in YYYY-MM-DD format for min date
  const today = new Date().toISOString().split('T')[0]

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

  const subtitleStyle: React.CSSProperties = {
    fontSize: '1rem',
    color: '#6b7280',
    marginTop: '0.5rem',
  }

  const formContainerStyle: React.CSSProperties = {
    backgroundColor: 'white',
    borderRadius: '0.5rem',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    padding: '1.5rem',
  }

  const formGridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(1, 1fr)',
    gap: '1.5rem',
  }

  const formGroupStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
  }

  const formGroupFullWidthStyle: React.CSSProperties = {
    gridColumn: '1 / -1',
  }

  const labelStyle: React.CSSProperties = {
    fontSize: '0.875rem',
    fontWeight: 500,
    color: '#374151',
    marginBottom: '0.375rem',
  }

  const requiredMarkStyle: React.CSSProperties = {
    color: '#dc2626',
    marginLeft: '0.125rem',
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

  const inputErrorStyle: React.CSSProperties = {
    borderColor: '#dc2626',
    backgroundColor: '#fef2f2',
  }

  const selectStyle: React.CSSProperties = {
    ...inputStyle,
    cursor: 'pointer',
    appearance: 'none' as const,
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3E%3C/svg%3E")`,
    backgroundPosition: 'right 0.5rem center',
    backgroundRepeat: 'no-repeat',
    backgroundSize: '1.5em 1.5em',
    paddingRight: '2.5rem',
  }

  const textareaStyle: React.CSSProperties = {
    ...inputStyle,
    minHeight: '100px',
    resize: 'vertical' as const,
  }

  const errorStyle: React.CSSProperties = {
    fontSize: '0.75rem',
    color: '#dc2626',
    marginTop: '0.25rem',
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

  const buttonGroupStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '1rem',
    marginTop: '2rem',
    paddingTop: '1.5rem',
    borderTop: '1px solid #e5e7eb',
  }

  const buttonBaseStyle: React.CSSProperties = {
    padding: '0.625rem 1.25rem',
    fontSize: '0.875rem',
    fontWeight: 500,
    borderRadius: '0.375rem',
    cursor: 'pointer',
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

  const sectionTitleStyle: React.CSSProperties = {
    fontSize: '1.125rem',
    fontWeight: 600,
    color: '#111827',
    marginBottom: '1rem',
  }

  const radioGroupStyle: React.CSSProperties = {
    display: 'flex',
    gap: '1rem',
    flexWrap: 'wrap',
    marginTop: '0.25rem',
  }

  const radioLabelStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    cursor: 'pointer',
    fontSize: '0.875rem',
    color: '#374151',
    padding: '0.5rem 0.75rem',
    border: '1px solid #d1d5db',
    borderRadius: '0.375rem',
    backgroundColor: 'white',
  }

  const radioSelectedStyle: React.CSSProperties = {
    backgroundColor: '#eff6ff',
    borderColor: '#2563eb',
  }

  return (
    <div style={containerStyle}>
      <style>
        {`
        @media (min-width: 640px) {
          .form-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
      `}
      </style>

      <div style={headerStyle}>
        <h1 style={titleStyle}>Jadwalkan Wawancara Baru</h1>
        <p style={subtitleStyle}>Isi formulir di bawah untuk menjadwalkan wawancara dengan kandidat</p>
      </div>

      {submitError && <div style={errorAlertStyle} role="alert">{submitError}</div>}
      {submitSuccess && (
        <div style={successAlertStyle} role="alert">
          Wawancara berhasil dibuat! Mengalihkan ke daftar wawancara...
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={formContainerStyle}>
          <h2 style={sectionTitleStyle}>Informasi Wawancara</h2>

          <div className="form-grid" style={formGridStyle}>
            <div style={{ ...formGroupStyle, ...formGroupFullWidthStyle }}>
              <label htmlFor="candidate_id" style={labelStyle}>
                Kandidat
                <span style={requiredMarkStyle}>*</span>
              </label>
              <select
                id="candidate_id"
                value={formData.candidate_id}
                onChange={e => handleChange('candidate_id', e.target.value)}
                style={{ ...selectStyle, ...(errors.candidate_id ? inputErrorStyle : {}) }}
                disabled={isSubmitting || submitSuccess}
              >
                <option value="">Pilih Kandidat</option>
                {options.candidates.map(candidate => (
                  <option key={candidate.id} value={candidate.id}>
                    {candidate.full_name}
                  </option>
                ))}
              </select>
              {errors.candidate_id && <span style={errorStyle}>{errors.candidate_id}</span>}
              {options.candidates.length === 0 && (
                <span style={{ ...errorStyle, color: '#f59e0b' }}>
                  Belum ada kandidat terdaftar. Silakan tambahkan kandidat terlebih dahulu.
                </span>
              )}
            </div>

            <div style={formGroupStyle}>
              <label htmlFor="interviewer_id" style={labelStyle}>Pewawancara</label>
              <select
                id="interviewer_id"
                value={formData.interviewer_id}
                onChange={e => handleChange('interviewer_id', e.target.value)}
                style={selectStyle}
                disabled={isSubmitting || submitSuccess}
              >
                <option value="">Pilih Pewawancara (Opsional)</option>
                {options.interviewers.map(interviewer => (
                  <option key={interviewer.id} value={interviewer.id}>
                    {interviewer.full_name}
                  </option>
                ))}
              </select>
            </div>

            <div style={formGroupStyle}>
              <label htmlFor="interview_date" style={labelStyle}>
                Tanggal Wawancara
                <span style={requiredMarkStyle}>*</span>
              </label>
              <input
                type="date"
                id="interview_date"
                value={formData.interview_date}
                onChange={e => handleChange('interview_date', e.target.value)}
                min={today}
                style={{ ...inputStyle, ...(errors.interview_date ? inputErrorStyle : {}) }}
                disabled={isSubmitting || submitSuccess}
              />
              {errors.interview_date && <span style={errorStyle}>{errors.interview_date}</span>}
            </div>

            <div style={{ ...formGroupStyle, ...formGroupFullWidthStyle }}>
              <label style={labelStyle}>
                Mode Wawancara
                <span style={requiredMarkStyle}>*</span>
              </label>
              <div style={radioGroupStyle}>
                {INTERVIEW_MODES.map(mode => (
                  <label
                    key={mode}
                    style={{
                      ...radioLabelStyle,
                      ...(formData.interview_mode === mode ? radioSelectedStyle : {}),
                    }}
                  >
                    <input
                      type="radio"
                      name="interview_mode"
                      value={mode}
                      checked={formData.interview_mode === mode}
                      onChange={e => handleChange('interview_mode', e.target.value)}
                      style={{ cursor: 'pointer' }}
                      disabled={isSubmitting || submitSuccess}
                    />
                    {INTERVIEW_MODE_LABELS[mode]}
                  </label>
                ))}
              </div>
              {errors.interview_mode && <span style={errorStyle}>{errors.interview_mode}</span>}
            </div>

            <div style={{ ...formGroupStyle, ...formGroupFullWidthStyle }}>
              <label htmlFor="bank_id" style={labelStyle}>Template Pertanyaan</label>
              <select
                id="bank_id"
                value={formData.bank_id}
                onChange={e => handleChange('bank_id', e.target.value)}
                style={selectStyle}
                disabled={isSubmitting || submitSuccess}
              >
                <option value="">Pilih Template (Opsional)</option>
                {options.questionBanks.map(bank => (
                  <option key={bank.id} value={bank.id}>
                    {bank.title}
                  </option>
                ))}
              </select>
              {options.questionBanks.length === 0 && (
                <span style={{ ...errorStyle, color: '#f59e0b' }}>
                  Belum ada template pertanyaan wawancara tersedia.
                </span>
              )}
            </div>

            <div style={{ ...formGroupStyle, ...formGroupFullWidthStyle }}>
              <label htmlFor="objective" style={labelStyle}>Tujuan Wawancara</label>
              <input
                type="text"
                id="objective"
                value={formData.objective}
                onChange={e => handleChange('objective', e.target.value)}
                style={inputStyle}
                placeholder="Contoh: Evaluasi kompetensi teknis, Cultural fit"
                disabled={isSubmitting || submitSuccess}
              />
            </div>
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid #e5e7eb', margin: '1.5rem 0' }} />

          <h2 style={sectionTitleStyle}>Catatan</h2>

          <div style={{ ...formGroupStyle, ...formGroupFullWidthStyle }}>
            <label htmlFor="notes" style={labelStyle}>Catatan Tambahan</label>
            <textarea
              id="notes"
              value={formData.notes}
              onChange={e => handleChange('notes', e.target.value)}
              style={textareaStyle}
              placeholder="Tambahkan catatan atau instruksi khusus untuk wawancara ini"
              rows={4}
              disabled={isSubmitting || submitSuccess}
            />
          </div>

          <div style={buttonGroupStyle}>
            <button
              type="button"
              onClick={handleCancel}
              style={secondaryButtonStyle}
              disabled={isSubmitting}
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting || submitSuccess || options.candidates.length === 0}
              style={primaryButtonStyle}
            >
              {isSubmitting ? 'Menyimpan...' : 'Jadwalkan Wawancara'}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
