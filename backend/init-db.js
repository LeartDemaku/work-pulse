import initSqlJs from 'sql.js';
import { writeFileSync, existsSync, readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, 'punaime.db');

console.log('🔄 Initializing SQLite database...');

const SQL = await initSqlJs();
let db;


if (existsSync(dbPath)) {
    const buffer = readFileSync(dbPath);
    db = new SQL.Database(buffer);
    console.log('📂 Existing database loaded.');
} else {
    db = new SQL.Database();
    console.log('📁 New database created.');
}


const schema = `
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        phone TEXT,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS jobs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        company TEXT NOT NULL,
        location TEXT,
        positions INTEGER DEFAULT 1,
        is_new INTEGER DEFAULT 0,
        description TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS applications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        full_name TEXT NOT NULL,
        email TEXT NOT NULL,
        phone TEXT,
        city TEXT,
        job_title TEXT NOT NULL,
        applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
`;

db.run(schema);
console.log('✅ Tables created/verified.');


const result = db.exec('SELECT COUNT(*) as count FROM jobs');
const jobCount = result[0]?.values[0][0] || 0;

if (jobCount === 0) {
    console.log('🔨 Inserting sample jobs...');

    const sampleJobs = [
        ['Zhvillues Web (Junior)', 'TechKos', 'Prishtinë', 3, 1, 'Kërkojmë Junior Web Developer me njohuri në HTML, CSS, JS.'],
        ['Dizajner Grafik', 'Creative Studio', 'Prishtinë', 2, 1, 'Kërkojmë Dizajner Grafik kreativ me përvojë në Adobe Suite.'],
        ['Menaxher Projektesh IT', 'InnoSoft', 'Prizren', 1, 0, 'Kërkojmë Menaxher Projektesh me përvojë në menaxhimin e ekipeve softuerike.'],
        ['Specialist Marketingu Dixhital', 'DigiPro', 'Ferizaj', 2, 1, 'Kërkojmë Specialist Marketingu për fushatat online.'],
        ['Analist i të Dhënave', 'DataKos', 'Prishtinë', 1, 0, 'Kërkojmë Analist të Dhënash me njohuri në SQL dhe Python.'],
        ['Inxhinier Softueri', 'SoftWorks', 'Gjakovë', 2, 1, 'Kërkojmë Inxhinier Softueri me përvojë në Java/Spring.']
    ];

    for (const job of sampleJobs) {
        db.run(
            'INSERT INTO jobs (title, company, location, positions, is_new, description) VALUES (?, ?, ?, ?, ?, ?)',
            job
        );
    }

    console.log('✅ Sample jobs inserted.');
} else {
    console.log(`ℹ️ Database already has ${jobCount} jobs.`);
}


const data = db.export();
const buffer = Buffer.from(data);
writeFileSync(dbPath, buffer);

db.close();

console.log('🎉 Database setup complete! You can now run "npm start".');
