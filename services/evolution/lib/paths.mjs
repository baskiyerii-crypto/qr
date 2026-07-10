import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const here = dirname(fileURLToPath(import.meta.url));
export const evolutionRunnerRoot = join(here, '..');
export const repoRoot = join(evolutionRunnerRoot, '..', '..');
export const evolutionApiDir = join(repoRoot, 'services', 'evolution-api');
export const postgresDataDir = join(evolutionRunnerRoot, 'data', 'db');

export const PG_PORT = 5433;
export const PG_USER = 'postgres';
export const PG_PASSWORD = 'postgres';
export const PG_DATABASE = 'evolution_api';
export const EVOLUTION_PORT = 8080;
export const QR_PORT = 8082;
export const API_KEY = 'qr_evolution_dev_key_7f3a9b2c';
export const INSTANCE_NAME = 'qr-personel';

export const databaseUri =
  `postgresql://${PG_USER}:${PG_PASSWORD}@127.0.0.1:${PG_PORT}/${PG_DATABASE}?schema=evolution_api`;
