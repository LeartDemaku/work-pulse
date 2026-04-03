import { createApp } from './app.js';
import { env } from './config/env.js';
import { dbClient } from './db/client.js';
import { runMigrations } from './db/migrations/runner.js';
import { ensureSeedData } from '../scripts/seed-lib.js';

async function start() {
  await dbClient.initDB();
  runMigrations(dbClient);
  await ensureSeedData(dbClient);

  const app = createApp();

  app.listen(env.PORT, () => {
    console.log(`Serveri po degjon ne http://localhost:${env.PORT}`);
  });
}

start().catch((error) => {
  console.error('Deshtoi nisja e serverit:', error);
  process.exit(1);
});