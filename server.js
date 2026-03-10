import http from 'node:http'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { createServerEntry } from './dist/server/ssr.js'

const CLIENT_DIR = join(process.cwd(), 'dist', 'client')

const serverEntry = createServerEntry({
  fetch: async (request) => {
    const { default: handler } = await import('./dist/server/ssr.js')
    return handler.fetch(request)
  }
})

// Simple mime type map
const mimeTypes = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.eot': 'application/vnd.ms-fontobject',
}

function getMimeType(filePath) {
  const ext = '.' + filePath.split('.').pop().toLowerCase()
  return mimeTypes[ext] || 'application/octet-stream'
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`)
  
  // Health check endpoint - no auth or database required
  if (url.pathname === '/health' || url.pathname === '/api/health') {
    res.statusCode = 200
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify({ status: 'ok', timestamp: new Date().toISOString() }))
    return
  }
  
  // Serve static files from dist/client
  if (url.pathname.startsWith('/assets/') || 
      url.pathname === '/favicon.ico' ||
      url.pathname === '/halalin-logo.png' ||
      url.pathname === '/logo192.png' ||
      url.pathname === '/logo512.png' ||
      url.pathname === '/manifest.json' ||
      url.pathname === '/robots.txt') {
    try {
      const filePath = join(CLIENT_DIR, url.pathname)
      const fileContent = readFileSync(filePath)
      res.statusCode = 200
      res.setHeader('Content-Type', getMimeType(filePath))
      res.setHeader('Cache-Control', 'public, max-age=31536000')
      res.end(fileContent)
      return
    } catch (err) {
      console.error('Static file error:', err.message)
      res.statusCode = 404
      res.end('File not found')
      return
    }
  }
  
  try {
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
