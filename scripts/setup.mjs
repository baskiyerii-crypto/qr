#!/usr/bin/env node
/**
 * İlk kurulum: Docker + DB + demo veri
 */
import { execSync } from 'child_process';
import { existsSync, copyFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const apiEnv = join(root, 'apps', 'api', '.env');
const apiEnvExample = join(root, 'apps', 'api', '.env.example');

function run(cmd, cwd = root) {
  console.log(`\n> ${cmd}`);
  execSync(cmd, { cwd, stdio: 'inherit', env: process.env });
}

console.log('QR Personel — Kurulum başlıyor...\n');

if (!existsSync(apiEnv) && existsSync(apiEnvExample)) {
  copyFileSync(apiEnvExample, apiEnv);
  console.log('apps/api/.env oluşturuldu');
}

// 1. Docker (yoksa SQLite ile devam)
let dockerStarted = false;
try {
  run('node scripts/docker-up.mjs');
  dockerStarted = true;
} catch {
  console.log('\n⚠ Docker yok — SQLite + Redis kapalı mod ile devam ediliyor.\n');
}

if (dockerStarted) {
  try {
    run('node scripts/ensure-evolution-env.mjs');
    run('node scripts/evolution-setup.mjs');
  } catch (e) {
    console.log('\n⚠ Evolution API instance kurulumu atlandı:', e.message);
    console.log('  Sonra: npm run evolution:setup\n');
  }
} else {
  console.log('\nDocker yok — Evolution lokal kurulum deneniyor...\n');
  try {
    run('node scripts/evolution-local-install.mjs');
    run('node scripts/ensure-evolution-env.mjs');
    console.log('\n✓ Evolution lokal kuruldu. Başlatmak için ayrı terminalde:');
    console.log('  npm run evolution:local');
    console.log('  npm run evolution:setup\n');
  } catch (e) {
    console.log('\n⚠ Evolution lokal kurulum atlandı:', e.message);
    console.log('  Manuel: npm run evolution:install\n');
  }
}

const isPnpm = existsSync(join(root, 'pnpm-lock.yaml'));

try {
  if (isPnpm) {
    run('npx pnpm install');
    run('npx pnpm --filter @qr/shared build');
    run('npx pnpm --filter @qr/ui-tokens build');
    run('npx pnpm --filter @qr/api exec prisma generate');
    run('npx pnpm --filter @qr/api exec prisma db push');
    run('npx pnpm --filter @qr/api exec prisma db seed');
  } else {
    run('npm install');
    run('npm run build -w @qr/shared');
    run('npm run build -w @qr/ui-tokens');
    run('npx prisma generate', join(root, 'apps', 'api'));
    run('npx prisma db push', join(root, 'apps', 'api'));
    run('npx prisma db seed', join(root, 'apps', 'api'));
  }
} catch (e) {
  console.error('\nKurulum hatası:', e.message);
  process.exit(1);
}

console.log('\n✓ Kurulum tamamlandı!');
console.log('\n  npm start          → API + Web');
console.log('  npm run docker:logs → Docker logları');
console.log('\n  Web:  http://localhost:5173');
console.log('  API:  http://localhost:3001/');
console.log('\n  Admin:    admin@demo.com / Admin123!');
console.log('  Personel: personel@demo.com / Personel123!');
