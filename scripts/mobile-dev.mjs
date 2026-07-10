import { execSync, spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const mobileDir = path.resolve(__dirname, '../apps/mobile');
const PORT = process.env.EXPO_METRO_PORT || '8081';

function killPort(port) {
  try {
    const out = execSync(`netstat -ano | findstr :${port}`, { encoding: 'utf8' });
    const pids = new Set();
    for (const line of out.split(/\r?\n/)) {
      const match = line.match(/LISTENING\s+(\d+)\s*$/);
      if (match) pids.add(match[1]);
    }
    for (const pid of pids) {
      try {
        execSync(`taskkill /PID ${pid} /F`, { stdio: 'ignore' });
        console.log(`[mobile-dev] Port ${port} → PID ${pid} kapatıldı`);
      } catch {
        // already gone
      }
    }
  } catch {
    // port free
  }
}

console.log('[mobile-dev] Eski Metro süreçleri temizleniyor...');
killPort('8081');
killPort('8082');

console.log(`[mobile-dev] Metro başlatılıyor → port ${PORT}, cache temiz`);
const child = spawn('npx', ['expo', 'start', '--clear', '--port', PORT], {
  cwd: mobileDir,
  stdio: 'inherit',
  shell: true,
});

child.on('exit', (code) => process.exit(code ?? 0));
