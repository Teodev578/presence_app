import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

function terminalLoggerPlugin() {
  return {
    name: 'terminal-logger',
    configureServer(server) {
      server.middlewares.use('/api/__terminal-log', (req, res) => {
        if (req.method === 'POST') {
          let body = ''
          req.on('data', (chunk) => {
            body += chunk
          })
          req.on('end', () => {
            try {
              const data = JSON.parse(body)
              const tag = data.tag || 'PresenceApp'
              console.log('\n\x1b[1m\x1b[31m[CLIENT ERROR - ' + tag + ']\x1b[0m')
              console.log('\x1b[33mMessage    :\x1b[0m', data.message || '(aucun)')
              if (data.status) console.log('\x1b[36mHTTP Status:\x1b[0m', data.status)
              if (data.code) console.log('\x1b[36mCode Auth  :\x1b[0m', data.code)
              if (data.context && Object.keys(data.context).length > 0) {
                console.log('\x1b[35mContexte   :\x1b[0m', JSON.stringify(data.context))
              }
              if (data.raw) {
                console.log('\x1b[90mDétails    :\x1b[0m', JSON.stringify(data.raw))
              }
              console.log('\x1b[31m───────────────────────────────────────────────────\x1b[0m\n')
            } catch {
              console.log('[CLIENT ERROR]', body)
            }
            res.statusCode = 200
            res.setHeader('Content-Type', 'text/plain')
            res.end('ok')
          })
        } else {
          res.statusCode = 404
          res.end()
        }
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue(), tailwindcss(), terminalLoggerPlugin()],
})

