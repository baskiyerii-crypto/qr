#!/usr/bin/env node
/**
 * Evolution API — Docker olmadan lokal kurulum.
 * 1. embedded-postgres
 * 2. evolution-api git clone
 * 3. DB migrate
 */
import { execSync, spawnSync } from 'child_process';
import { existsSync, writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(here, '..');
const evolutionRunnerRoot = join(repoRoot, 'services', 'evolution');
const evolutionApiDir = join(repoRoot, 'services', 'evolution-api'); 

function run(cmd, cwd = repoRoot) {
  console.log(`> ${cmd}`);
  execSync(cmd, { cwd, stdio: 'inherit', env: process.env });
}

function hasGit() {
  try {
    execSync('git --version', { stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}

async function main() {
  console.log('Evolution API — lokal kurulum (Docker gerekmez)\n');

  if (!hasGit()) {
    console.error('Git gerekli: https://git-scm.com/download/win');
    process.exit(1);
  }

  // 1. embedded-postgres
  mkdirSync(join(evolutionRunnerRoot, 'data'), { recursive: true });
  if (!existsSync(join(evolutionRunnerRoot, 'node_modules'))) {
    console.log('\n[1/4] embedded-postgres kuruluyor...');
    run('npm install', evolutionRunnerRoot);
  } else {
    console.log('\n[1/4] embedded-postgres zaten kurulu');
  }

  const { startPostgres, stopPostgres } = await import('../services/evolution/lib/postgres.mjs');
  const { buildEvolutionEnv } = await import('../services/evolution/lib/env-template.mjs');

  // 2. Clone evolution-api
  if (!existsSync(evolutionApiDir)) {
    console.log('\n[2/4] evolution-api indiriliyor (ilk sefer 1-2 dk)...');
    mkdirSync(join(repoRoot, 'services'), { recursive: true });
    run(
      'git clone --depth 1 https://github.com/evolution-foundation/evolution-api.git services/evolution-api',
    );
  } else {
    console.log('\n[2/4] evolution-api zaten mevcut');
  }

  // 3. .env + postgres + npm install evolution
  console.log('\n[3/4] PostgreSQL başlatılıyor ve .env yazılıyor...');
  await startPostgres();
  writeFileSync(join(evolutionApiDir, '.env'), buildEvolutionEnv(), 'utf8');
  console.log('✓ services/evolution-api/.env oluşturuldu');

  if (!existsSync(join(evolutionApiDir, 'node_modules'))) {
    console.log('\nEvolution API bağımlılıkları kuruluyor (5-10 dk sürebilir)...');
    run('npm install', evolutionApiDir);
  } else {
    console.log('Evolution API node_modules mevcut');
  }

  // 4. Prisma migrate
  console.log('\n[4/4] Veritabanı şeması uygulanıyor...');
  run('npm run db:generate', evolutionApiDir);
  const deploy = spawnSync('npm run db:deploy:win', {
    cwd: evolutionApiDir,
    stdio: 'inherit',
    shell: true,
  });
  if (deploy.status !== 0) {
    console.log('db:deploy:win başarısız, db:migrate:dev:win deneniyor...');
    run('npm run db:migrate:dev:win', evolutionApiDir);
  }

  await stopPostgres();

  console.log('\n✓ Evolution API lokal kurulum tamamlandı!');
  console.log('\n  npm run evolution:local   → Sunucuyu başlat');
  console.log('  npm run evolution:setup   → Instance oluştur');
  console.log('  http://localhost:8082       → QR kod sayfası\n');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
