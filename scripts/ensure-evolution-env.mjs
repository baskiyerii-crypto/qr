#!/usr/bin/env node
/**
 * apps/api/.env içine Evolution API değişkenlerini ekler (yoksa veya boşsa).
 */
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const envPath = join(root, 'apps', 'api', '.env');

const defaults = {
  EVOLUTION_API_URL: 'http://localhost:8080',
  EVOLUTION_API_KEY: 'qr_evolution_dev_key_7f3a9b2c',
  EVOLUTION_INSTANCE_NAME: 'qr-personel',
  WEB_APP_URL: 'http://localhost:5173',
};

if (!existsSync(envPath)) {
  console.log('apps/api/.env yok — .env.example kopyalayın veya npm run setup çalıştırın.');
  process.exit(0);
}

let content = readFileSync(envPath, 'utf8');
let changed = false;
const lines = content.split('\n');
const keysPresent = new Set();

for (const line of lines) {
  const m = line.match(/^([A-Z_][A-Z0-9_]*)=/);
  if (m) keysPresent.add(m[1]);
}

const toAppend = [];
for (const [key, value] of Object.entries(defaults)) {
  if (!keysPresent.has(key)) {
    toAppend.push(`${key}=${value}`);
    changed = true;
  } else {
    const emptyRe = new RegExp(`^${key}=\\s*$`, 'm');
    if (emptyRe.test(content)) {
      content = content.replace(emptyRe, `${key}=${value}`);
      changed = true;
    }
  }
}

if (toAppend.length) {
  if (!content.endsWith('\n')) content += '\n';
  content += '\n# Evolution API (docker)\n' + toAppend.join('\n') + '\n';
}

if (changed) {
  writeFileSync(envPath, content, 'utf8');
  console.log('✓ apps/api/.env — Evolution API ayarları eklendi/güncellendi');
}
