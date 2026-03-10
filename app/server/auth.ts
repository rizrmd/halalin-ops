import { createServerFn } from '@tanstack/react-start'
import { prisma } from './db'
import { hashPassword, verifyPassword } from './password'
import { createSession, destroySession, getCurrentUser } from './session'

export interface AuthUser {
  id: string
  name: string
  email: string | null
  partnerType: string
  isAdmin: boolean
}

export const login = createServerFn({ method: 'POST' })
  .inputValidator((data: unknown): { email: string, password: string } => {
    if (typeof data !== 'object' || data === null) {
      throw new Error('Data harus berupa objek')
    }
    const { email, password } = data as Record<string, unknown>
    if (typeof email !== 'string' || typeof password !== 'string') {
      throw new TypeError('Email dan kata sandi harus berupa string')
    }
    return { email, password }
  })
  .handler(async ({ data }): Promise<{ success: boolean, error?: string, user?: AuthUser }> => {
    const { email, password } = data

    // Validate input
    if (!email || !password) {
      return {
        success: false,
        error: 'Email dan kata sandi wajib diisi',
      }
    }

    try {
      // Find partner by email
      const partner = await prisma.partners.findFirst({
        where: { email },
        select: {
          id: true,
          full_name: true,
          email: true,
          partner_type: true,
          is_admin: true,
          password_hash: true,
          notes: true,
        },
      })

      if (!partner) {
        return {
          success: false,
          error: 'Email atau kata sandi salah',
        }
      }

      let isValidPassword = false

      if (partner.password_hash) {
        isValidPassword = await verifyPassword(password, partner.password_hash)
      }
      else if ((partner.notes || '') === password) {
        // Legacy fallback for accounts that still stored plaintext in notes.
        await prisma.partners.update({
          where: { id: partner.id },
          data: {
            password_hash: await hashPassword(password),
          },
        })
        isValidPassword = true
      }

      if (!isValidPassword) {
        return {
          success: false,
          error: 'Email atau kata sandi salah',
        }
      }

      // Create session
      await createSession(partner.id)

      return {
        success: true,
        user: {
          id: partner.id,
          name: partner.full_name,
          email: partner.email,
          partnerType: partner.partner_type,
          isAdmin: partner.is_admin,
        },
      }
    }
    catch (error) {
      console.error('Login error:', error)
      return {
        success: false,
        error: 'Terjadi kesalahan saat masuk. Silakan coba lagi.',
      }
    }
  })

export const logout = createServerFn({ method: 'POST' })
  .handler(async () => {
    await destroySession()
    return { success: true }
  })

export const changePassword = createServerFn({ method: 'POST' })
  .inputValidator((data: unknown): { currentPassword: string, newPassword: string } => {
    if (typeof data !== 'object' || data === null) {
      throw new Error('Data harus berupa objek')
    }

    const { currentPassword, newPassword } = data as Record<string, unknown>
    if (typeof currentPassword !== 'string' || typeof newPassword !== 'string') {
      throw new TypeError('Kata sandi harus berupa string')
    }

    return { currentPassword, newPassword }
  })
  .handler(async ({ data }): Promise<{ success: boolean, error?: string }> => {
    const user = await getCurrentUser()

    if (!user) {
      return {
        success: false,
        error: 'Sesi tidak valid. Silakan masuk kembali.',
      }
    }

    const { currentPassword, newPassword } = data

    if (!currentPassword || !newPassword) {
      return {
        success: false,
        error: 'Kata sandi saat ini dan kata sandi baru wajib diisi',
      }
    }

    if (newPassword.length < 8) {
      return {
        success: false,
        error: 'Kata sandi baru minimal 8 karakter',
      }
    }

    try {
      const partner = await prisma.partners.findUnique({
        where: { id: user.id },
        select: {
          id: true,
          password_hash: true,
          notes: true,
        },
      })

      if (!partner) {
        return {
          success: false,
          error: 'Pengguna tidak ditemukan',
        }
      }

      let isValidCurrentPassword = false

      if (partner.password_hash) {
        isValidCurrentPassword = await verifyPassword(currentPassword, partner.password_hash)
      }
      else if ((partner.notes || '') === currentPassword) {
        isValidCurrentPassword = true
      }

      if (!isValidCurrentPassword) {
        return {
          success: false,
          error: 'Kata sandi saat ini salah',
        }
      }

      const passwordHash = await hashPassword(newPassword)

      await prisma.partners.update({
        where: { id: partner.id },
        data: {
          password_hash: passwordHash,
        },
      })

      return { success: true }
    }
    catch (error) {
      console.error('Change password error:', error)
      return {
        success: false,
        error: 'Terjadi kesalahan saat mengubah kata sandi',
      }
    }
  })

export const getAuthUser = createServerFn({ method: 'GET' })
  .handler(async (): Promise<AuthUser | null> => {
    const user = await getCurrentUser()
    if (!user) {
      return null
    }

    // Fetch full user details from database
    const partner = await prisma.partners.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        full_name: true,
        email: true,
        partner_type: true,
        is_admin: true,
      },
    })

    if (!partner) {
      return null
    }

    return {
      id: partner.id,
      name: partner.full_name,
      email: partner.email,
      partnerType: partner.partner_type,
      isAdmin: partner.is_admin,
    }
  })

export const isAuthenticated = createServerFn({ method: 'GET' })
  .handler(async () => {
    const user = await getAuthUser()
    return !!user
  })

/**
 * Require authentication for protected routes.
 * Returns user data if authenticated, or throws redirect to login.
 * Note: This is a server-only function. Use beforeLoad in routes for client-side
 */
export async function requireAuth(): Promise<AuthUser> {
  const user = await getAuthUser()
  if (!user) {
    throw new Error('UNAUTHORIZED')
  }
  return user
}

export async function requireAdmin(): Promise<AuthUser> {
  const user = await requireAuth()
  if (!user.isAdmin) {
    throw new Error('FORBIDDEN')
  }
  return user
}
