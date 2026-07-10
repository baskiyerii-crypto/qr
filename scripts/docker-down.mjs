#!/usr/bin/env node
import { execSync } from 'child_process';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

try {
  execSync('docker compose down', { cwd: root, stdio: 'inherit' });
} catch {
  execSync('docker-compose down', { cwd: root, stdio: 'inherit' });
}
console.log('Docker servisleri durduruldu.');
