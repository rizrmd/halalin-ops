import { createRouter } from '@tanstack/react-router'
import { routeTree } from './routeTree.gen'

export const createAppRouter = () => {
  const router = createRouter({
    routeTree,
  })
  return router
}

// For type-safe router
export type AppRouter = ReturnType<typeof createAppRouter>
