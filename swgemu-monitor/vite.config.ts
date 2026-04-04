import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'https://localhost:44443',
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, ''),
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq) => {
            // Strip browser headers that the old cpprest SDK rejects at the HTTP parser level.
            // Keep only authorization + host so the request looks like a simple curl call.
            const auth = proxyReq.getHeader('authorization');
            for (const h of proxyReq.getHeaderNames()) {
              if (h !== 'host' && h !== 'connection') {
                proxyReq.removeHeader(h);
              }
            }
            if (auth) proxyReq.setHeader('authorization', auth);
            proxyReq.setHeader('accept', '*/*');
          });
          proxy.on('error', (err, _req, res) => {
            console.error('[api-proxy] error:', err.message);
            if ('writeHead' in res && !res.headersSent) {
              (res as import('http').ServerResponse).writeHead(502);
              (res as import('http').ServerResponse).end('Proxy error: ' + err.message);
            }
          });
        },
      },
    },
  },
})
