import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import mysql from 'mysql2/promise'
import { readFile } from 'fs/promises'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import type { IncomingMessage, ServerResponse } from 'http'

function swgemuDbPlugin(): Plugin {
  let pool: mysql.Pool;

  function json(res: ServerResponse, status: number, data: unknown) {
    res.writeHead(status, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(data));
  }

  function parseUrl(req: IncomingMessage) {
    return new URL(req.url!, `http://${req.headers.host}`);
  }

  async function handleGalaxy(res: ServerResponse) {
    const [rows] = await pool.query('SELECT * FROM galaxy LIMIT 1');
    const galaxies = rows as Record<string, unknown>[];
    if (galaxies.length === 0) {
      json(res, 404, { error: 'No galaxy found' });
    } else {
      json(res, 200, galaxies[0]);
    }
  }

  async function handleAccounts(url: URL, res: ServerResponse) {
    const page = Math.max(1, parseInt(url.searchParams.get('page') || '1'));
    const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get('limit') || '25')));
    const search = url.searchParams.get('search') || '';
    const offset = (page - 1) * limit;

    let whereClause = '';
    const params: unknown[] = [];

    if (search) {
      whereClause = 'WHERE a.username LIKE ?';
      params.push(`%${search}%`);
    }

    const [countRows] = await pool.query(
      `SELECT COUNT(*) as total FROM accounts a ${whereClause}`,
      params
    );
    const total = (countRows as { total: number }[])[0].total;

    const [rows] = await pool.query(
      `SELECT a.account_id, a.username, a.created, a.active, a.admin_level,
              (SELECT COUNT(*) FROM characters c WHERE c.account_id = a.account_id) as character_count
       FROM accounts a ${whereClause}
       ORDER BY a.account_id DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    json(res, 200, {
      data: rows,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  }

  async function handleAccountDetail(accountId: number, res: ServerResponse) {
    const [accountRows] = await pool.query(
      'SELECT account_id, username, created, active, admin_level FROM accounts WHERE account_id = ?',
      [accountId]
    );
    const accounts = accountRows as Record<string, unknown>[];
    if (accounts.length === 0) {
      json(res, 404, { error: 'Account not found' });
      return;
    }

    const [characters] = await pool.query(
      'SELECT * FROM characters WHERE account_id = ? ORDER BY firstname',
      [accountId]
    );

    const [bans] = await pool.query(
      'SELECT * FROM account_bans WHERE account_id = ? ORDER BY created DESC',
      [accountId]
    );

    json(res, 200, {
      account: accounts[0],
      characters,
      bans,
    });
  }

  async function handleCharacterSearch(url: URL, res: ServerResponse) {
    const search = url.searchParams.get('search') || '';
    if (search.length < 1) {
      json(res, 400, { error: 'Search term required' });
      return;
    }
    const [rows] = await pool.query(
      `SELECT c.*, a.username as account_name
       FROM characters c
       LEFT JOIN accounts a ON c.account_id = a.account_id
       WHERE c.firstname LIKE ? OR c.surname LIKE ?
       ORDER BY c.firstname
       LIMIT 100`,
      [`%${search}%`, `%${search}%`]
    );
    json(res, 200, rows);
  }

  return {
    name: 'swgemu-db',
    configureServer(server) {
      pool = mysql.createPool({
        host: '127.0.0.1',
        port: 3306,
        user: 'swgemu',
        password: 'swgemu-sql',
        database: 'swgemu',
        waitForConnections: true,
        connectionLimit: 5,
        enableKeepAlive: true,
        keepAliveInitialDelay: 10000,
      });

      server.middlewares.use(async (req: IncomingMessage, res: ServerResponse, next: () => void) => {
        if (!req.url?.startsWith('/db/')) {
          next();
          return;
        }

        try {
          const url = parseUrl(req);
          const path = url.pathname;

          if (path === '/db/galaxy' && req.method === 'GET') {
            await handleGalaxy(res);
          } else if (path === '/db/accounts' && req.method === 'GET') {
            await handleAccounts(url, res);
          } else if (path === '/db/characters' && req.method === 'GET') {
            await handleCharacterSearch(url, res);
          } else if (path === '/db/skills' && req.method === 'GET') {
            const [rows] = await pool.query(
              'SELECT skill_name as name, skill_parent as parent FROM skills ORDER BY skill_name'
            );
            json(res, 200, rows);
          } else if (path === '/db/loot' && req.method === 'GET') {
            const __dirname = dirname(fileURLToPath(import.meta.url));
            const lootPath = resolve(__dirname, '..', 'Loot Generator', 'loot_database.json');
            const data = await readFile(lootPath, 'utf-8');
            json(res, 200, JSON.parse(data));
          } else {
            // Check for /db/accounts/:id pattern
            const accountMatch = path.match(/^\/db\/accounts\/(\d+)$/);
            if (accountMatch && req.method === 'GET') {
              await handleAccountDetail(parseInt(accountMatch[1]), res);
            } else {
              json(res, 404, { error: 'Not found' });
            }
          }
        } catch (err) {
          console.error('[db-plugin] error:', err);
          json(res, 500, { error: err instanceof Error ? err.message : 'Database error' });
        }
      });

      server.httpServer?.on('close', () => {
        pool.end();
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), swgemuDbPlugin()],
  server: {
    proxy: {
      '/api': {
        target: 'https://127.0.0.1:44443',
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, ''),
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq) => {
            // Strip browser headers that the old cpprest SDK rejects at the HTTP parser level.
            // Keep only authorization + host so the request looks like a simple curl call.
            const auth = proxyReq.getHeader('authorization');
            const contentType = proxyReq.getHeader('content-type');
            const contentLength = proxyReq.getHeader('content-length');
            for (const h of proxyReq.getHeaderNames()) {
              if (h !== 'host' && h !== 'connection') {
                proxyReq.removeHeader(h);
              }
            }
            if (auth) proxyReq.setHeader('authorization', auth);
            proxyReq.setHeader('accept', '*/*');
            // Preserve content-type and content-length for POST/PUT/DELETE with JSON bodies
            if (contentType) proxyReq.setHeader('content-type', contentType);
            if (contentLength) proxyReq.setHeader('content-length', contentLength);
          });
          proxy.on('error', (err, _req, res) => {
            const msg = err.message;
            if (msg.includes('ECONNRESET') || msg.includes('ECONNREFUSED')) {
              console.warn('[api-proxy] server unreachable:', msg);
            } else {
              console.error('[api-proxy] error:', msg);
            }
            if ('writeHead' in res && !res.headersSent) {
              (res as import('http').ServerResponse).writeHead(502);
              (res as import('http').ServerResponse).end('Proxy error: ' + msg);
            }
          });
        },
      },
    },
  },
})
