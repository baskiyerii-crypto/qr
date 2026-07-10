import EmbeddedPostgres from 'embedded-postgres';
import { mkdirSync, existsSync, readFileSync, unlinkSync } from 'fs';
import { join } from 'path';
import {
  postgresDataDir,
  PG_PORT,
  PG_USER,
  PG_PASSWORD,
  PG_DATABASE,
} from './paths.mjs';

let instance = null;

function isInitialized() {
  return existsSync(join(postgresDataDir, 'PG_VERSION'));
}

function isProcessRunning(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

function getRunningPostgresPid() {
  const lockFile = join(postgresDataDir, 'postmaster.pid');
  if (!existsSync(lockFile)) return null;
  try {
    const pid = parseInt(readFileSync(lockFile, 'utf8').split('\n')[0], 10);
    if (Number.isFinite(pid) && isProcessRunning(pid)) return pid;
    unlinkSync(lockFile);
  } catch {
    try { unlinkSync(lockFile); } catch { /* ignore */ }
  }
  return null;
}

async function ensureDatabase(pg) {
  try {
    await pg.createDatabase(PG_DATABASE);
  } catch {
    /* veritabanı zaten var */
  }
}

export async function startPostgres() {
  if (instance) return instance;

  mkdirSync(postgresDataDir, { recursive: true });

  const alreadyRunning = getRunningPostgresPid();
  if (alreadyRunning) {
    const pg = new EmbeddedPostgres({
      databaseDir: postgresDataDir,
      user: PG_USER,
      password: PG_PASSWORD,
      port: PG_PORT,
      persistent: true,
      initdbFlags: ['--locale=C', '--encoding=UTF8'],
    });
    instance = pg;
    await ensureDatabase(pg);
    return pg;
  }

  const pg = new EmbeddedPostgres({
    databaseDir: postgresDataDir,
    user: PG_USER,
    password: PG_PASSWORD,
    port: PG_PORT,
    persistent: true,
    initdbFlags: ['--locale=C', '--encoding=UTF8'],
  });

  if (!isInitialized()) {
    await pg.initialise();
  }

  await pg.start();
  await ensureDatabase(pg);

  instance = pg;
  return pg;
}

export async function stopPostgres() {
  if (!instance) return;
  try {
    await instance.stop();
  } catch {
    /* zaten durmuş olabilir */
  }
  instance = null;
}
