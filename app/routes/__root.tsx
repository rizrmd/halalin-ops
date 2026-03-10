import { TanStackDevtools } from '@tanstack/react-devtools'
import { createRootRoute, HeadContent, Outlet, Scripts } from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import * as React from 'react'
import Footer from '../components/Footer'
import Header from '../components/Header'
import { getAuthUser } from '../server/auth'
import appCss from '../styles.css?url'

// Validate SESSION_SECRET at startup
// Note: This runs on server, not client
if (typeof window === 'undefined') {
  try {
    const sessionModule = await import('../server/session')
    sessionModule.validateSessionConfig()
  }
  catch (error) {
    console.error('⚠️ SESSION_SECRET not configured properly:', error)
  }
}

const THEME_INIT_SCRIPT = `(function(){try{var stored=window.localStorage.getItem('theme');var mode=(stored==='light'||stored==='dark'||stored==='auto')?stored:'auto';var prefersDark=window.matchMedia('(prefers-color-scheme: dark)').matches;var resolved=mode==='auto'?(prefersDark?'dark':'light'):mode;var root=document.documentElement;root.classList.remove('light','dark');root.classList.add(resolved);if(mode==='auto'){root.removeAttribute('data-theme')}else{root.setAttribute('data-theme',mode)}root.style.colorScheme=resolved;}catch(e){}});`

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'Halalin Ops - Partner Qualification, Assessment, and Deployment' },
    ],
    links: [{ rel: 'stylesheet', href: appCss }],
  }),
  component: RootComponent,
  beforeLoad: async () => {
    // Get user auth state for layout
    const user = await getAuthUser()
    return { user }
  },
})

function RootComponent() {
  const { user } = Route.useRouteContext() as { user: { id: string, name: string, email: string | null, partnerType: string } | null }

  const bodyStyle: React.CSSProperties = {
    fontFamily: 'system-ui, -apple-system, sans-serif',
    WebkitFontSmoothing: 'antialiased',
    MozOsxFontSmoothing: 'grayscale',
    margin: 0,
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
  }

  const mainStyle: React.CSSProperties = {
    flex: 1,
    backgroundColor: '#f9fafb',
  }

  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
        <HeadContent />
      </head>
      <body style={bodyStyle}>
        <Header user={user} />
        <main style={mainStyle}>
          <Outlet />
        </main>
        <Footer />
        <TanStackDevtools
          config={{ position: 'bottom-right' }}
          plugins={[
            {
              name: 'Tanstack Router',
              render: <TanStackRouterDevtoolsPanel />,
            },
          ]}
        />
        <Scripts />
      </body>
    </html>
  )
}
