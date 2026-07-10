#!/usr/bin/env node
import { execSync } from 'child_process';
import { existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const isPnpm = existsSync(join(root, 'pnpm-lock.yaml'));

try {
  if (isPnpm) {
    execSync('npx pnpm --filter @qr/shared build', { cwd: root, stdio: 'inherit' });
    execSync('npx pnpm --filter @qr/ui-tokens build', { cwd: root, stdio: 'inherit' });
  } else {
    execSync('npm run build -w @qr/shared', { cwd: root, stdio: 'inherit' });
    execSync('npm run build -w @qr/ui-tokens', { cwd: root, stdio: 'inherit' });
  }
} catch {
  // İlk kurulumda hata olabilir — setup çalıştırın
}
