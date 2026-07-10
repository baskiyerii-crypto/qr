#!/usr/bin/env node
/**
 * Evolution API: instance oluştur ve WhatsApp bağlantı talimatlarını yazdır.
 * Docker veya lokal kurulum ile çalışır.
 */
import { execSync } from 'child_process';

const API_URL = (process.env.EVOLUTION_API_URL || 'http://localhost:8080').replace(/\/$/, '');
const API_KEY = process.env.EVOLUTION_API_KEY || 'qr_evolution_dev_key_7f3a9b2c';
const INSTANCE = process.env.EVOLUTION_INSTANCE_NAME || 'qr-personel';
const MANAGER_URL = process.env.EVOLUTION_MANAGER_URL || 'http://localhost:5173/admin/whatsapp';

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function waitForApi(maxSeconds = 120) {
  for (let i = 0; i < maxSeconds; i++) {
    try {
      const res = await fetch(`${API_URL}/`, { signal: AbortSignal.timeout(3000) });
      if (res.ok || res.status === 404) return true;
    } catch {
      /* retry */
    }
    process.stdout.write('.');
    await sleep(2000);
  }
  return false;
}

async function fetchInstances() {
  const res = await fetch(`${API_URL}/instance/fetchInstances`, {
    headers: { apikey: API_KEY },
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Instance listesi alınamadı (${res.status}): ${text}`);
  }
  const data = await res.json();
  return Array.isArray(data) ? data : data?.instances ?? [];
}

async function createInstance() {
  const res = await fetch(`${API_URL}/instance/create`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: API_KEY,
    },
    body: JSON.stringify({
      instanceName: INSTANCE,
      integration: 'WHATSAPP-BAILEYS',
      qrcode: true,
    }),
    signal: AbortSignal.timeout(30000),
  });
  if (!res.ok) {
    const text = await res.text();
    if (text.includes('already in use') || text.includes('already exists')) {
      console.log(`\n✓ Instance zaten mevcut: ${INSTANCE}`);
      return;
    }
    throw new Error(`Instance oluşturulamadı (${res.status}): ${text}`);
  }
  console.log(`\n✓ WhatsApp instance oluşturuldu: ${INSTANCE}`);
}

async function main() {
  let dockerAvailable = false;
  try {
    execSync('docker --version', { stdio: 'pipe' });
    dockerAvailable = true;
  } catch {
    /* lokal mod */
  }

  if (!dockerAvailable) {
    console.log('Docker yok — lokal Evolution API bekleniyor...');
    console.log('  (Çalışmıyorsa: npm run evolution:local)\n');
  }

  console.log('Evolution API hazır olması bekleniyor...');
  const ready = await waitForApi();
  if (!ready) {
    console.error('\nEvolution API yanıt vermiyor.');
    if (dockerAvailable) {
      console.error('  docker compose ps');
      console.error('  docker compose logs evolution-api');
    } else {
      console.error('  npm run evolution:install   (ilk kurulum)');
      console.error('  npm run evolution:local     (sunucuyu başlat)');
    }
    process.exit(1);
  }

  console.log('\n✓ Evolution API çalışıyor');

  try {
    const instances = await fetchInstances();
    const exists = instances.some(
      (i) => i.instanceName === INSTANCE || i.name === INSTANCE,
    );
    if (!exists) {
      await createInstance();
    } else {
      console.log(`✓ Instance zaten mevcut: ${INSTANCE}`);
    }
  } catch (err) {
    console.error('\nInstance kurulumu başarısız:', err.message);
    process.exit(1);
  }

  console.log('\n--- WhatsApp bağlantısı ---');
  console.log(`  Admin panel:    ${MANAGER_URL}`);
  console.log(`  (Süper admin girişi gerekir — super@qr.com)`);
  console.log(`  API:            ${API_URL}`);
  console.log(`  Instance:       ${INSTANCE}`);
  console.log('\n  Telefondan WhatsApp → Bağlı Cihazlar → QR kodu tarayın.\n');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
