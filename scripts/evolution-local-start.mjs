#!/usr/bin/env node
/**
 * Evolution API — Docker olmadan lokal çalıştır.
 * PostgreSQL (embedded) + Evolution API
 */
import { spawn } from 'child_process';
import { existsSync } from 'fs';
import { join } from 'path';
import { startPostgres, stopPostgres } from '../services/evolution/lib/postgres.mjs';
import { evolutionApiDir } from '../services/evolution/lib/paths.mjs';

const children = [];

function spawnProc(name, cmd, args, cwd) {
  const child = spawn(cmd, args, {
    cwd,
    stdio: 'inherit',
    shell: true,
    env: process.env,
  });
  child.on('exit', (code) => {
    if (code !== 0 && code !== null) {
      console.error(`[${name}] çıkış kodu: ${code}`);
    }
  });
  children.push(child);
  return child;
}

async function shutdown() {
  console.log('\nEvolution durduruluyor...');
  for (const c of children) {
    try { c.kill(); } catch { /* ignore */ }
  }
  await stopPostgres();
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

async function main() {
  if (!existsSync(join(evolutionApiDir, 'node_modules'))) {
    console.error('Evolution kurulu değil. Önce çalıştırın:');
    console.error('  npm run evolution:install');
    process.exit(1);
  }

  if (!existsSync(join(evolutionApiDir, '.env'))) {
    console.error('services/evolution-api/.env yok. Çalıştırın:');
    console.error('  npm run evolution:install');
    process.exit(1);
  }

  console.log('Evolution API (lokal) başlatılıyor...\n');

  await startPostgres();
  console.log('✓ PostgreSQL hazır (localhost:5433)');

  spawnProc('evolution', 'npm', ['run', 'dev:server'], evolutionApiDir);

  console.log('\n✓ Evolution API: http://127.0.0.1:8080 (sadece lokal)');
  console.log('  QR kod: süper admin paneli → /admin/whatsapp');
  console.log('  Durdurmak için Ctrl+C\n');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
