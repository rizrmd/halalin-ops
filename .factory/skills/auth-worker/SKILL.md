---
name: auth-worker
description: Authentication and authorization implementation using TanStack Start
---

# Auth Worker

NOTE: Startup and cleanup are handled by `worker-base`. This skill defines the WORK PROCEDURE.

## When to Use This Skill

Use this skill for authentication and authorization features:
- Login/logout flows
- Session management
- Protected routes
- User authentication middleware
- Role-based access control (RBAC)

## Work Procedure

### 1. Read Context
- Read `mission.md` in missionDir
- Read `AGENTS.md` for conventions and boundaries
- Read `.factory/services.yaml` for commands
- Check existing auth patterns in the codebase

### 2. Plan Implementation
- Choose auth strategy (session-based with cookies)
- Design login/logout server functions
- Plan protected route wrappers
- Consider password hashing (bcrypt)

### 3. Write Tests First (Red)
Create failing tests before implementation:
- Test login with valid credentials
- Test login with invalid credentials
- Test protected route access
- Test logout functionality

### 4. Implement (Green)
Implement in this order:
1. **Session Secret**: Add SESSION_SECRET to .env
2. **Session Middleware**: Create session handling in `app/middleware.ts` or `app/server/session.ts`
3. **Auth Server Functions**:
   - `login` - validate credentials, create session
   - `logout` - destroy session
   - `getCurrentUser` - retrieve user from session
4. **Protected Route Helper**: Create HOC or wrapper for protected routes
5. **Login Page**: Create `/login` route with form
6. **Logout Button**: Add to navigation/header

Session implementation pattern:
```typescript
// app/server/session.ts
import { getCookie, setCookie, deleteCookie } from '@tanstack/react-start/server';
import { sign, verify } from 'jsonwebtoken';

const SESSION_SECRET = process.env.SESSION_SECRET!;

export async function createSession(userId: string) {
  const token = sign({ userId }, SESSION_SECRET, { expiresIn: '7d' });
  setCookie('session', token, { httpOnly: true, secure: true, maxAge: 60 * 60 * 24 * 7 });
}

export async function getSession() {
  const token = getCookie('session');
  if (!token) return null;
  try {
    return verify(token, SESSION_SECRET) as { userId: string };
  } catch {
    return null;
  }
}

export async function destroySession() {
  deleteCookie('session');
}
```

### 5. Manual Verification
- Start dev server
- Navigate to `/login`
- **Test mobile responsiveness** at 375px, 768px, and 1280px viewports
- Test login form usability on mobile (touch targets >= 44x44px)
- Test login with valid credentials
- Verify session persists across page reloads
- Test logout clears session
- Try accessing protected route without login (should redirect)

### 6. Run Validators
- `npm run typecheck`
- `npm run lint`
- `npm run test`

### 7. Commit and Handoff

## Example Handoff

```json
{
  "salientSummary": "Implemented session-based authentication with login/logout flows. Created middleware, server functions, and protected route wrapper. Login page uses Indonesian labels.",
  "whatWasImplemented": "Created session management using signed JWT cookies. Implemented login server function that validates email/password against partners table. Added getCurrentUser and logout functions. Created ProtectedRoute wrapper component that redirects to /login when not authenticated. Built /login page with form validation.",
  "whatWasLeftUndone": "",
  "verification": {
    "commandsRun": [
      { "command": "npm run typecheck", "exitCode": 0, "observation": "No errors" },
      { "command": "npm run test -- auth", "exitCode": 0, "observation": "4 auth tests passing" }
    ],
    "interactiveChecks": [
      { "action": "Visited /login at 375px viewport", "observed": "Login form displayed with Indonesian labels, form inputs are full-width, submit button is touch-friendly" },
      { "action": "Visited /login at 768px viewport", "observed": "Login form centered with appropriate width" },
      { "action": "Visited /login at 1280px viewport", "observed": "Login form properly sized for desktop" },
      { "action": "Logged in with valid credentials", "observed": "Redirected to dashboard, user name shown in header" },
      { "action": "Clicked logout", "observed": "Session cleared, redirected to login page" },
      { "action": "Tried accessing /partners without login", "observed": "Redirected to /login with ?redirectTo parameter" }
    ]
  },
  "tests": {
    "added": [
      { "file": "app/server/auth.test.ts", "cases": [
        { "name": "login with valid credentials", "verifies": "Creates session and returns user" },
        { "name": "login with invalid credentials", "verifies": "Returns error without creating session" }
      ]}
    ]
  },
  "discoveredIssues": []
}
```

## When to Return to Orchestrator

Return to orchestrator if:
- Need to change database schema for auth (user table modifications)
- Unclear about role/permission structure
- Third-party OAuth integration needed
- Session storage strategy needs discussion (Redis, etc.)
