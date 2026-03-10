import { deleteCookie, getCookie, setCookie } from '@tanstack/react-start/server'
import { sign, verify } from 'jsonwebtoken'

const SESSION_SECRET = process.env.SESSION_SECRET
const SESSION_COOKIE_NAME = 'session'

export interface SessionData {
  userId: string
  iat?: number
  exp?: number
}

/**
 * Validate that SESSION_SECRET is configured
 * Call this at startup
 */
export function validateSessionConfig(): void {
  if (!SESSION_SECRET || SESSION_SECRET === 'your-secret-key-here' || SESSION_SECRET === 'your-secret-key-here-change-in-production') {
    throw new Error(
      'SESSION_SECRET is not configured. Please set a secure SESSION_SECRET in your .env file. '
      + 'Generate one with: openssl rand -base64 32',
    )
  }
}

/**
 * Create a new session and set HTTP-only cookie
 */
export async function createSession(userId: string): Promise<void> {
  if (!SESSION_SECRET) {
    throw new Error('SESSION_SECRET is not configured')
  }

  const token = sign({ userId }, SESSION_SECRET, {
    expiresIn: '7d',
  })

  setCookie(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days in seconds
    path: '/',
  })
}

/**
 * Get and validate session from cookie
 * Returns session data if valid, null if invalid/missing
 */
export async function getSession(): Promise<SessionData | null> {
  if (!SESSION_SECRET) {
    return null
  }

  const token = getCookie(SESSION_COOKIE_NAME)
  if (!token) {
    return null
  }

  try {
    const decoded = verify(token, SESSION_SECRET) as SessionData
    return decoded
  }
  catch {
    return null
  }
}

/**
 * Destroy session by clearing the cookie
 */
export async function destroySession(): Promise<void> {
  deleteCookie(SESSION_COOKIE_NAME, {
    path: '/',
  })
}

/**
 * Get current user from session
 * Returns user data if authenticated, null otherwise
 */
export async function getCurrentUser(): Promise<{ id: string, email?: string | null } | null> {
  const session = await getSession()
  if (!session) {
    return null
  }

  return {
    id: session.userId,
  }
}
