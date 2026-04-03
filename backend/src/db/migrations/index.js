import bcrypt from 'bcryptjs';
import { APPLICATION_STATUSES, JOB_STATUSES, ROLES, USER_STATUSES } from '../../config/constants.js';

function quoteIdentifier(value) {
  return `"${String(value).replace(/"/g, '""')}"`;
}

function addColumnIfMissing(db, tableName, columnName, columnSql) {
  if (!db.hasColumn(tableName, columnName)) {
    const trimmed = String(columnSql).trim();
    const startsWithColumn = new RegExp(`^${columnName}\\b`, 'i').test(trimmed);
    const definition = startsWithColumn ? trimmed : `${quoteIdentifier(columnName)} ${trimmed}`;
    db.run(`ALTER TABLE ${quoteIdentifier(tableName)} ADD COLUMN ${definition}`);
  }
}

function normalizeCvPathValue(rawPath) {
  const normalized = String(rawPath || '').replace(/\\/g, '/').trim();
  if (!normalized) {
    return null;
  }

  if (normalized.startsWith('uploads/cv/')) {
    return normalized;
  }

  if (normalized.startsWith('/uploads/cv/')) {
    return normalized.slice(1);
  }

  const marker = '/uploads/cv/';
  const markerIndex = normalized.lastIndexOf(marker);
  if (markerIndex >= 0) {
    const suffix = normalized.slice(markerIndex + marker.length);
    return suffix ? `uploads/cv/${suffix}` : null;
  }

  const legacyMarker = 'backend/uploads/cv/';
  const legacyMarkerIndex = normalized.lastIndexOf(legacyMarker);
  if (legacyMarkerIndex >= 0) {
    const suffix = normalized.slice(legacyMarkerIndex + legacyMarker.length);
    return suffix ? `uploads/cv/${suffix}` : null;
  }

  const filename = normalized.split('/').filter(Boolean).pop();
  return filename ? `uploads/cv/${filename}` : null;
}

function createBaseTables(db) {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT,
      email TEXT UNIQUE NOT NULL,
      password TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS jobs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      company TEXT NOT NULL,
      location TEXT,
      positions INTEGER DEFAULT 1,
      is_new INTEGER DEFAULT 0,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS applications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      full_name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT,
      city TEXT,
      job_title TEXT NOT NULL,
      applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

function upgradeUsers(db) {
  addColumnIfMissing(db, 'users', 'role', "role TEXT NOT NULL DEFAULT 'job_seeker'");
  addColumnIfMissing(db, 'users', 'password_hash', 'password_hash TEXT');
  addColumnIfMissing(db, 'users', 'is_email_verified', 'is_email_verified INTEGER NOT NULL DEFAULT 0');
  addColumnIfMissing(db, 'users', 'last_login_at', 'last_login_at DATETIME');
  addColumnIfMissing(db, 'users', 'status', "status TEXT NOT NULL DEFAULT 'active'");

  db.run(`UPDATE users SET role = '${ROLES.JOB_SEEKER}' WHERE role IS NULL OR TRIM(role) = ''`);
  db.run(`UPDATE users SET status = '${USER_STATUSES[0]}' WHERE status IS NULL OR TRIM(status) = ''`);

  const users = db.select('SELECT id, password, password_hash FROM users');
  for (const user of users) {
    if (!user.password_hash && user.password) {
      const hash = bcrypt.hashSync(String(user.password), 10);
      db.run('UPDATE users SET password_hash = ? WHERE id = ?', [hash, user.id]);
    }
  }
}

function upgradeJobs(db) {
  addColumnIfMissing(db, 'jobs', 'company_id', 'company_id INTEGER');
  addColumnIfMissing(db, 'jobs', 'employment_type', "employment_type TEXT DEFAULT 'full_time'");
  addColumnIfMissing(db, 'jobs', 'experience_level', "experience_level TEXT DEFAULT 'entry'");
  addColumnIfMissing(db, 'jobs', 'deadline_at', 'deadline_at DATETIME');
  addColumnIfMissing(db, 'jobs', 'status', "status TEXT NOT NULL DEFAULT 'active'");
  addColumnIfMissing(db, 'jobs', 'salary_min', 'INTEGER');
  addColumnIfMissing(db, 'jobs', 'salary_max', 'INTEGER');
  addColumnIfMissing(db, 'jobs', 'currency', "currency TEXT NOT NULL DEFAULT 'EUR'");
  addColumnIfMissing(db, 'jobs', 'required_skills_json', "required_skills_json TEXT DEFAULT '[]'");
  addColumnIfMissing(db, 'jobs', 'work_mode', "work_mode TEXT DEFAULT 'onsite'");

  db.run(`UPDATE jobs SET status = '${JOB_STATUSES[1]}' WHERE status IS NULL OR TRIM(status) = ''`);
  db.run("UPDATE jobs SET currency = 'EUR' WHERE currency IS NULL OR TRIM(currency) = ''");
}

function upgradeApplications(db) {
  addColumnIfMissing(db, 'applications', 'job_id', 'job_id INTEGER');
  addColumnIfMissing(db, 'applications', 'job_seeker_user_id', 'job_seeker_user_id INTEGER');
  addColumnIfMissing(db, 'applications', 'status', "status TEXT NOT NULL DEFAULT 'submitted'");
  addColumnIfMissing(db, 'applications', 'status_updated_at', 'DATETIME');
  addColumnIfMissing(db, 'applications', 'cover_letter', 'TEXT');
  addColumnIfMissing(db, 'applications', 'cv_file_path', 'TEXT');
  addColumnIfMissing(db, 'applications', 'source', "TEXT DEFAULT 'web'");
  addColumnIfMissing(db, 'applications', 'reference_code', 'TEXT');

  db.run(`UPDATE applications SET status = '${APPLICATION_STATUSES[0]}' WHERE status IS NULL OR TRIM(status) = ''`);
  db.run('UPDATE applications SET status_updated_at = COALESCE(status_updated_at, applied_at, CURRENT_TIMESTAMP)');
  db.run('UPDATE applications SET reference_code = COALESCE(reference_code, UPPER(HEX(RANDOMBLOB(4))))');
  normalizeApplicationCvPaths(db);
}

function normalizeApplicationCvPaths(db) {
  const cvRows = db.select(
    "SELECT id, cv_file_path AS cvFilePath FROM applications WHERE cv_file_path IS NOT NULL AND TRIM(cv_file_path) <> ''"
  );

  for (const row of cvRows) {
    const normalizedCvPath = normalizeCvPathValue(row.cvFilePath);
    if (normalizedCvPath && normalizedCvPath !== row.cvFilePath) {
      db.run('UPDATE applications SET cv_file_path = ? WHERE id = ?', [normalizedCvPath, row.id]);
    }
  }
}

function createExtendedTables(db) {
  db.run(`
    CREATE TABLE IF NOT EXISTS job_seeker_profiles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL UNIQUE,
      headline TEXT,
      city TEXT,
      skills_json TEXT DEFAULT '[]',
      experience_json TEXT DEFAULT '[]',
      education_json TEXT DEFAULT '[]',
      languages_json TEXT DEFAULT '[]',
      about TEXT,
      profile_completion INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS companies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      owner_user_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      legal_name TEXT,
      email TEXT NOT NULL,
      phone TEXT,
      city TEXT,
      website TEXT,
      description TEXT,
      logo_path TEXT,
      business_number TEXT,
      is_verified INTEGER NOT NULL DEFAULT 0,
      notification_email TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS employer_members (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      company_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      member_role TEXT NOT NULL DEFAULT 'recruiter',
      invited_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      accepted_at DATETIME,
      UNIQUE(company_id, user_id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS application_status_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      application_id INTEGER NOT NULL,
      old_status TEXT,
      new_status TEXT NOT NULL,
      changed_by_user_id INTEGER,
      note TEXT,
      changed_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS saved_jobs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      job_id INTEGER NOT NULL,
      job_seeker_user_id INTEGER NOT NULL,
      saved_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(job_id, job_seeker_user_id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS email_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      recipient TEXT NOT NULL,
      template_key TEXT NOT NULL,
      related_entity TEXT,
      status TEXT NOT NULL,
      error_message TEXT,
      sent_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS email_verification_tokens (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      token TEXT NOT NULL UNIQUE,
      expires_at DATETIME NOT NULL,
      used_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS password_reset_tokens (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      token TEXT NOT NULL UNIQUE,
      expires_at DATETIME NOT NULL,
      used_at DATETIME,
      requested_ip TEXT,
      requested_user_agent TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      body TEXT NOT NULL,
      is_read INTEGER NOT NULL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS report_flags (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      reporter_user_id INTEGER NOT NULL,
      target_type TEXT NOT NULL,
      target_id INTEGER NOT NULL,
      reason TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'open',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      resolved_at DATETIME,
      resolved_by_user_id INTEGER
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS moderation_actions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      admin_user_id INTEGER NOT NULL,
      target_type TEXT NOT NULL,
      target_id INTEGER NOT NULL,
      action TEXT NOT NULL,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS analytics_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      role TEXT,
      event_key TEXT NOT NULL,
      event_value TEXT,
      metadata_json TEXT DEFAULT '{}',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS job_templates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      company_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      category TEXT,
      employment_type TEXT,
      experience_level TEXT,
      work_mode TEXT,
      skills_json TEXT DEFAULT '[]',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS application_notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      application_id INTEGER NOT NULL,
      author_user_id INTEGER NOT NULL,
      note TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

function ensureIndexes(db) {
  db.run('CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON users(email)');
  db.run('CREATE INDEX IF NOT EXISTS idx_users_role ON users(role)');
  db.run('CREATE INDEX IF NOT EXISTS idx_jobs_company_id ON jobs(company_id)');
  db.run('CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status)');
  db.run('CREATE INDEX IF NOT EXISTS idx_jobs_created_at ON jobs(created_at)');
  db.run('CREATE INDEX IF NOT EXISTS idx_applications_job_id ON applications(job_id)');
  db.run('CREATE INDEX IF NOT EXISTS idx_applications_job_seeker ON applications(job_seeker_user_id)');
  db.run('CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status)');
  db.run('CREATE INDEX IF NOT EXISTS idx_application_history_application_id ON application_status_history(application_id)');
  db.run('CREATE INDEX IF NOT EXISTS idx_saved_jobs_user_id ON saved_jobs(job_seeker_user_id)');
  db.run('CREATE INDEX IF NOT EXISTS idx_companies_owner_user_id ON companies(owner_user_id)');
  db.run('CREATE INDEX IF NOT EXISTS idx_report_flags_status ON report_flags(status)');
  db.run('CREATE INDEX IF NOT EXISTS idx_analytics_event_key ON analytics_events(event_key)');
  db.run('CREATE INDEX IF NOT EXISTS idx_email_verification_user_id ON email_verification_tokens(user_id)');
  db.run('CREATE INDEX IF NOT EXISTS idx_password_reset_user_id ON password_reset_tokens(user_id)');
  db.run('CREATE INDEX IF NOT EXISTS idx_password_reset_token ON password_reset_tokens(token)');
  db.run('CREATE INDEX IF NOT EXISTS idx_application_notes_application_id ON application_notes(application_id)');
}

function bootstrapProfilesAndApplications(db) {
  const seekers = db.select('SELECT id FROM users WHERE role = ?', [ROLES.JOB_SEEKER]);
  for (const seeker of seekers) {
    const profile = db.get('SELECT id FROM job_seeker_profiles WHERE user_id = ?', [seeker.id]);
    if (!profile) {
      db.run('INSERT INTO job_seeker_profiles (user_id) VALUES (?)', [seeker.id]);
    }
  }

  const applications = db.select('SELECT id, status, status_updated_at FROM applications');
  for (const app of applications) {
    const exists = db.get('SELECT id FROM application_status_history WHERE application_id = ?', [app.id]);
    if (!exists) {
      db.run(
        'INSERT INTO application_status_history (application_id, old_status, new_status, changed_by_user_id, note, changed_at) VALUES (?, ?, ?, ?, ?, COALESCE(?, CURRENT_TIMESTAMP))',
        [app.id, null, app.status || APPLICATION_STATUSES[0], null, 'Migrim fillestar i statusit', app.status_updated_at || null]
      );
    }
  }
}

export const migrations = [
  {
    id: '001_core_upgrade',
    description: 'Krijon dhe perditeson skemen baze me role, profile, kompani dhe tabela suportuese.',
    up: (db) => {
      createBaseTables(db);
      upgradeUsers(db);
      upgradeJobs(db);
      upgradeApplications(db);
      createExtendedTables(db);
      ensureIndexes(db);
      bootstrapProfilesAndApplications(db);
    }
  },
  {
    id: '002_additional_entities',
    description: 'Shton tabela dhe indekse shtese pas migrimit fillestar.',
    up: (db) => {
      db.run(`
        CREATE TABLE IF NOT EXISTS email_verification_tokens (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          token TEXT NOT NULL UNIQUE,
          expires_at DATETIME NOT NULL,
          used_at DATETIME,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      db.run(`
        CREATE TABLE IF NOT EXISTS application_notes (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          application_id INTEGER NOT NULL,
          author_user_id INTEGER NOT NULL,
          note TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      db.run('CREATE INDEX IF NOT EXISTS idx_email_verification_user_id ON email_verification_tokens(user_id)');
      db.run('CREATE INDEX IF NOT EXISTS idx_application_notes_application_id ON application_notes(application_id)');
    }
  },
  {
    id: '003_password_reset_tokens',
    description: 'Shton token-at e resetimit te fjalekalimit dhe indekset perkatese.',
    up: (db) => {
      db.run(`
        CREATE TABLE IF NOT EXISTS password_reset_tokens (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          token TEXT NOT NULL UNIQUE,
          expires_at DATETIME NOT NULL,
          used_at DATETIME,
          requested_ip TEXT,
          requested_user_agent TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      db.run('CREATE INDEX IF NOT EXISTS idx_password_reset_user_id ON password_reset_tokens(user_id)');
      db.run('CREATE INDEX IF NOT EXISTS idx_password_reset_token ON password_reset_tokens(token)');
    }
  },
  {
    id: '004_normalize_cv_paths',
    description: 'Normalizon cv_file_path ne formatin relativ uploads/cv/* per akses te qendrueshem.',
    up: (db) => {
      normalizeApplicationCvPaths(db);
    }
  }
];
