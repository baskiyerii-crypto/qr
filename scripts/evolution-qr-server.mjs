#!/usr/bin/env node
/**
 * Basit QR kod sayfası — http://localhost:8082
 */
import { createServer } from 'http';
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { QR_PORT } from '../services/evolution/lib/paths.mjs';

const qrHtml = join(dirname(fileURLToPath(import.meta.url)), '..', 'services', 'evolution', 'qr.html');

export function startQrServer() {
  if (!existsSync(qrHtml)) {
    console.warn('QR sayfası bulunamadı:', qrHtml);
    return null;
  }

  const html = readFileSync(qrHtml, 'utf8');
  const server = createServer((req, res) => {
    if (req.url === '/' || req.url === '/index.html') {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(html);
      return;
    }
    res.writeHead(404);
    res.end('Not found');
  });

  server.listen(QR_PORT, () => {
    console.log(`✓ QR sayfası: http://localhost:${QR_PORT}`);
  });

  return server;
}

if (process.argv[1] && process.argv[1].endsWith('evolution-qr-server.mjs')) {
  startQrServer();
}
