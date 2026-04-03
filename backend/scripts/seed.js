import { dbClient } from '../src/db/client.js';
import { runMigrations } from '../src/db/migrations/runner.js';
import { ensureSeedData } from './seed-lib.js';

async function main() {
  await dbClient.initDB();
  runMigrations(dbClient);
  await ensureSeedData(dbClient);
  console.log('Seed u krye me sukses.');
}

main().catch((error) => {
  console.error('Gabim gjate seed:', error);
  process.exit(1);
});