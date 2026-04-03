import initSqlJs from 'sql.js';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { env } from '../config/env.js';

let SQL = null;
let db = null;

function ensureInitialized() {
  if (!db) {
    throw new Error('Baza e të dhënave nuk është inicializuar. Thirr initDB() fillimisht.');
  }
}

function normalizeSql(sql) {
  return String(sql || '').trim().toUpperCase();
}

function exportAndPersist() {
  if (!db) {
    return;
  }

  const data = db.export();
  writeFileSync(env.DB_FILE, Buffer.from(data));
}

async function initDB() {
  if (db) {
    return db;
  }

  SQL = await initSqlJs();

  if (existsSync(env.DB_FILE)) {
    const buffer = readFileSync(env.DB_FILE);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
    exportAndPersist();
  }

  return db;
}

function closeDB() {
  if (!db) {
    return;
  }

  exportAndPersist();
  db.close();
  db = null;
  SQL = null;
}

function prepareAndCollect(sql, params = []) {
  ensureInitialized();

  const stmt = db.prepare(sql);
  stmt.bind(params);

  const rows = [];
  while (stmt.step()) {
    rows.push(stmt.getAsObject());
  }

  stmt.free();
  return rows;
}

function select(sql, params = []) {
  return prepareAndCollect(sql, params);
}

function get(sql, params = []) {
  const rows = prepareAndCollect(sql, params);
  return rows[0] ?? null;
}

function run(sql, params = []) {
  ensureInitialized();
  db.run(sql, params);

  // Koment: changes() jep numrin real te rreshtave te prekur ne SQLite.
  const changesRow = db.exec('SELECT changes() AS count');
  const lastRow = db.exec('SELECT last_insert_rowid() AS id');

  const changes = changesRow?.[0]?.values?.[0]?.[0] ?? 0;
  const lastInsertId = lastRow?.[0]?.values?.[0]?.[0] ?? 0;

  exportAndPersist();

  return {
    changes,
    lastInsertId
  };
}

function execute(sql, params = []) {
  const mode = normalizeSql(sql);

  if (mode.startsWith('SELECT')) {
    return [select(sql, params)];
  }

  const result = run(sql, params);
  return [{
    affectedRows: result.changes,
    insertId: result.lastInsertId
  }];
}

function execBatch(sql) {
  ensureInitialized();
  db.run(sql);
  exportAndPersist();
}

function hasTable(tableName) {
  const row = get(
    "SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?",
    [tableName]
  );
  return Boolean(row?.name);
}

function hasColumn(tableName, columnName) {
  ensureInitialized();
  const safeTable = String(tableName).replace(/'/g, "''");
  const info = db.exec(`PRAGMA table_info('${safeTable}')`);
  const values = info?.[0]?.values ?? [];
  return values.some((value) => value[1] === columnName);
}

function transaction(callback) {
  ensureInitialized();
  const savepointName = `sp_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
  db.run(`SAVEPOINT ${savepointName}`);

  try {
    const trxPrepareAndCollect = (sql, params = []) => {
      const stmt = db.prepare(sql);
      stmt.bind(params);

      const rows = [];
      while (stmt.step()) {
        rows.push(stmt.getAsObject());
      }

      stmt.free();
      return rows;
    };

    const trxSelect = (sql, params = []) => trxPrepareAndCollect(sql, params);
    const trxGet = (sql, params = []) => {
      const rows = trxPrepareAndCollect(sql, params);
      return rows[0] ?? null;
    };

    const trxRun = (sql, params = []) => {
      db.run(sql, params);
      const changesRow = db.exec('SELECT changes() AS count');
      const lastRow = db.exec('SELECT last_insert_rowid() AS id');
      return {
        changes: changesRow?.[0]?.values?.[0]?.[0] ?? 0,
        lastInsertId: lastRow?.[0]?.values?.[0]?.[0] ?? 0
      };
    };

    const trxExecute = (sql, params = []) => {
      const mode = normalizeSql(sql);
      if (mode.startsWith('SELECT')) {
        return [trxSelect(sql, params)];
      }

      const result = trxRun(sql, params);
      return [{
        affectedRows: result.changes,
        insertId: result.lastInsertId
      }];
    };

    const trxHasTable = (tableName) => {
      const row = trxGet(
        "SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?",
        [tableName]
      );
      return Boolean(row?.name);
    };

    const trxHasColumn = (tableName, columnName) => {
      const safeTable = String(tableName).replace(/'/g, "''");
      const info = db.exec(`PRAGMA table_info('${safeTable}')`);
      const values = info?.[0]?.values ?? [];
      return values.some((value) => value[1] === columnName);
    };

    const result = callback({
      select: trxSelect,
      get: trxGet,
      run: trxRun,
      execute: trxExecute,
      hasTable: trxHasTable,
      hasColumn: trxHasColumn
    });
    db.run(`RELEASE SAVEPOINT ${savepointName}`);
    exportAndPersist();
    return result;
  } catch (error) {
    db.run(`ROLLBACK TO SAVEPOINT ${savepointName}`);
    db.run(`RELEASE SAVEPOINT ${savepointName}`);
    throw error;
  }
}

process.on('exit', exportAndPersist);
process.on('SIGINT', () => {
  exportAndPersist();
  process.exit();
});
process.on('SIGTERM', () => {
  exportAndPersist();
  process.exit();
});

export const dbClient = {
  initDB,
  closeDB,
  execute,
  select,
  get,
  run,
  execBatch,
  hasTable,
  hasColumn,
  transaction,
  exportAndPersist
};
