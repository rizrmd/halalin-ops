import tailwindcss from '@tailwindcss/vite'
import { devtools } from '@tanstack/devtools-vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'

import viteReact from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import tsconfigPaths from 'vite-tsconfig-paths'

const config = defineConfig({
  plugins: [
    devtools(),
    tsconfigPaths({ projects: ['./tsconfig.json'] }),
    tailwindcss(),
    tanstackStart({
      srcDirectory: 'app',
      router: {
        entry: './router.tsx',
        routesDirectory: './routes',
        generatedRouteTree: './routeTree.gen.ts',
      },
      client: {
        entry: './client.tsx',
      },
      server: {
        entry: './ssr.tsx',
      },
    }),
    viteReact(),
  ],
})

export default config
