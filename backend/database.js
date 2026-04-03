import initSqlJs from 'sql.js';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, 'punaime.db');

let db = null;
let SQL = null;


async function initDB() {
    SQL = await initSqlJs();

    if (existsSync(dbPath)) {
        const buffer = readFileSync(dbPath);
        db = new SQL.Database(buffer);
        console.log('✅ SQLite database loaded:', dbPath);
    } else {
        db = new SQL.Database();
        console.log('✅ New SQLite database created:', dbPath);
    }

    return db;
}


function saveDB() {
    if (db) {
        const data = db.export();
        const buffer = Buffer.from(data);
        writeFileSync(dbPath, buffer);
    }
}


process.on('exit', saveDB);
process.on('SIGINT', () => { saveDB(); process.exit(); });
process.on('SIGTERM', () => { saveDB(); process.exit(); });


const dbWrapper = {
    init: initDB,

    execute: (sql, params = []) => {
        try {
            const upperSQL = sql.trim().toUpperCase();

            if (upperSQL.startsWith('SELECT')) {
                const stmt = db.prepare(sql);
                stmt.bind(params);
                const rows = [];
                while (stmt.step()) {
                    rows.push(stmt.getAsObject());
                }
                stmt.free();
                return [rows];
            } else if (upperSQL.startsWith('INSERT')) {
                db.run(sql, params);
                const lastId = db.exec('SELECT last_insert_rowid() as id')[0]?.values[0][0] || 0;
                saveDB();
                return [{ insertId: lastId, affectedRows: db.getRowsModified() }];
            } else if (upperSQL.startsWith('DELETE') || upperSQL.startsWith('UPDATE')) {
                db.run(sql, params);
                saveDB();
                return [{ affectedRows: db.getRowsModified() }];
            } else {
                db.run(sql, params);
                saveDB();
                return [{}];
            }
        } catch (error) {
            console.error('Database error:', error.message);
            throw error;
        }
    },

    exec: (sql) => {
        db.run(sql);
        saveDB();
    }
};

export default dbWrapper;
