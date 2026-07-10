#!/usr/bin/env node
/**
 * Docker Compose: PostgreSQL + Redis başlat ve hazır olana kadar bekle.
 */
import { execSync } from 'child_process';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

function run(cmd) {
  console.log(`> ${cmd}`);
  return execSync(cmd, { cwd: root, stdio: 'inherit', encoding: 'utf8' });
}

function runQuiet(cmd) {
  return execSync(cmd, { cwd: root, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] });
}

console.log('Docker: PostgreSQL + Redis + Evolution API başlatılıyor...\n');

let dockerAvailable = true;
try {
  runQuiet('docker --version');
} catch {
  dockerAvailable = false;
}

if (!dockerAvailable) {
  console.error('⚠ Docker bulunamadı.');
  console.error('  Kurulum: https://www.docker.com/products/docker-desktop/');
  console.error('  Sonra: npm run docker:up');
  console.error('\nGeçici olarak SQLite ile devam etmek için apps/api/.env içinde:');
  console.error('  DATABASE_URL="file:./prisma/dev.db"');
  console.error('  REDIS_DISABLED="true"');
  process.exit(1);
}

try {
  run('docker compose up -d');
} catch {
  try {
    run('docker-compose up -d');
  } catch (e) {
    console.error('Docker Compose başlatılamadı:', e.message);
    process.exit(1);
  }
}

console.log('\nServislerin hazır olması bekleniyor...');

const maxWait = 60;
for (let i = 0; i < maxWait; i++) {
  try {
    const ps = runQuiet('docker compose ps --format json');
    const lines = ps.trim().split('\n').filter(Boolean);
    const services = lines.map((l) => JSON.parse(l));
    const pg = services.find((s) => s.Service === 'postgres' || s.Name?.includes('qr-postgres'));
    const redis = services.find((s) => s.Service === 'redis' || s.Name?.includes('qr-redis'));
    const evolution = services.find(
      (s) => s.Service === 'evolution-api' || s.Name?.includes('evolution-api'),
    );
    const pgOk = pg?.Health === 'healthy' || pg?.State === 'running';
    const redisOk = redis?.Health === 'healthy' || redis?.State === 'running';
    const evolutionOk = evolution?.Health === 'healthy' || evolution?.State === 'running';
    if (pgOk && redisOk && evolutionOk) {
      console.log('✓ PostgreSQL hazır (localhost:5432)');
      console.log('✓ Redis hazır (localhost:6379)');
      console.log('✓ Evolution API hazır (localhost:8080)');
      console.log('✓ Evolution Manager (localhost:8082)');
      process.exit(0);
    }
  } catch {
    // eski docker sürümleri
    try {
      runQuiet('docker compose ps');
      if (i > 5) {
        console.log('✓ Konteynerler çalışıyor (healthcheck atlandı)');
        process.exit(0);
      }
    } catch { /* retry */ }
  }
  execSync('timeout /t 2 /nobreak >nul 2>&1 || sleep 2', { shell: true });
  process.stdout.write('.');
}

console.log('\n✓ Konteynerler başlatıldı (tam sağlık kontrolü zaman aşımı — devam edilebilir)');
