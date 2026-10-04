import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('.', import.meta.url));
const port = Number(process.env.PORT || 5173);
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.svg': 'image/svg+xml', '.jpeg': 'image/jpeg', '.png': 'image/png' };

http.createServer(async (request, response) => {
  try {
    const url = new URL(request.url, 'http://localhost');
    const pathname = decodeURIComponent(url.pathname);
    const file = path.resolve(root, '.' + (pathname === '/' ? '/index.html' : pathname));
    const relativePath = path.relative(root, file);
    if (relativePath.startsWith('..') || path.isAbsolute(relativePath)) {
      response.writeHead(403).end('Forbidden');
      return;
    }
    if (!(await stat(file)).isFile()) throw new Error('Not a file');
    response.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
    response.end(await readFile(file));
  } catch {
    response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end('Страница не найдена');
  }
}).listen(port, '127.0.0.1', () => console.log(`Портфолио: http://localhost:${port}`))
  .on('error', (error) => {
    console.error(error.code === 'EADDRINUSE' ? `Порт ${port} занят. Запустите: PORT=5174 npm run dev` : error.message);
    process.exitCode = 1;
  });
