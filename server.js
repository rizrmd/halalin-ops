import http from 'node:http'
import { createServerEntry } from './dist/server/ssr.js'

const serverEntry = createServerEntry({
  fetch: async (request) => {
    const { default: handler } = await import('./dist/server/ssr.js')
    return handler.fetch(request)
  }
})

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`)
    const request = new Request(url, {
      method: req.method,
      headers: req.headers,
    })

    const response = await serverEntry.fetch(request)
    
    res.statusCode = response.status
    for (const [key, value] of response.headers.entries()) {
      res.setHeader(key, value)
    }

    const body = await response.text()
    res.end(body)
  } catch (error) {
    console.error('Server error:', error)
    res.statusCode = 500
    res.end('Internal Server Error')
  }
})

const PORT = process.env.PORT || 3000
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`)
})
