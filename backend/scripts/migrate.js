import { dbClient } from '../src/db/client.js';
import { runMigrations } from '../src/db/migrations/runner.js';

async function main() {
  await dbClient.initDB();
  runMigrations(dbClient);
  console.log('Migrimet u aplikuan me sukses.');
}

main().catch((error) => {
  console.error('Gabim gjate migrimit:', error);
  process.exit(1);
});