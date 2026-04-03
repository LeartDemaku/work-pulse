import { migrations } from './index.js';

export function ensureMigrationTable(db) {
  db.run(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id TEXT PRIMARY KEY,
      description TEXT NOT NULL,
      executed_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

export function runMigrations(db) {
  ensureMigrationTable(db);

  const appliedRows = db.select('SELECT id FROM schema_migrations');
  const applied = new Set(appliedRows.map((row) => row.id));

  for (const migration of migrations) {
    if (applied.has(migration.id)) {
      continue;
    }

    migration.up(db);
    db.run(
      'INSERT INTO schema_migrations (id, description) VALUES (?, ?)',
      [migration.id, migration.description]
    );

    console.log(`[migration] U aplikua: ${migration.id} - ${migration.description}`);
  }
}
