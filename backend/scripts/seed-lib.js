import bcrypt from 'bcryptjs';
import { dbClient } from '../src/db/client.js';
import { ROLES } from '../src/config/constants.js';

const sampleJobs = [
  {
    title: 'Frontend Developer (React)',
    location: 'Prishtine',
    positions: 2,
    description: 'Kerkojme Frontend Developer me pervoje ne React dhe UI moderne.',
    employmentType: 'full_time',
    experienceLevel: 'mid',
    workMode: 'hybrid'
  },
  {
    title: 'Digital Marketing Specialist',
    location: 'Prizren',
    positions: 1,
    description: 'Pozite per menaxhim fushatash digjitale, SEO dhe social media.',
    employmentType: 'full_time',
    experienceLevel: 'entry',
    workMode: 'onsite'
  },
  {
    title: 'QA Engineer',
    location: 'Remote',
    positions: 1,
    description: 'Role QA me fokus testim manual dhe automatik.',
    employmentType: 'contract',
    experienceLevel: 'mid',
    workMode: 'remote'
  }
];

// Koment: Seed krijon admin, kompani demo dhe disa shpallje fillestare.
export async function ensureSeedData(db = dbClient) {
  const adminEmail = 'admin@platforma.local';
  const admin = db.get('SELECT id FROM users WHERE email = ?', [adminEmail]);

  if (!admin) {
    const passwordHash = await bcrypt.hash('Admin123!', 10);
    db.run(
      'INSERT INTO users (name, phone, email, password, role, password_hash, is_email_verified, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      ['Platforma Admin', '+38344000000', adminEmail, '__legacy_placeholder__', ROLES.ADMIN, passwordHash, 1, 'active']
    );
  }

  const employerEmail = 'demo.employer@platforma.local';
  let employer = db.get('SELECT id FROM users WHERE email = ?', [employerEmail]);

  if (!employer) {
    const passwordHash = await bcrypt.hash('Employer123!', 10);
    const created = db.run(
      'INSERT INTO users (name, phone, email, password, role, password_hash, is_email_verified, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      ['Demo Employer', '+38344111111', employerEmail, '__legacy_placeholder__', ROLES.EMPLOYER, passwordHash, 1, 'active']
    );
    employer = { id: created.lastInsertId };
  }

  let company = db.get('SELECT id, name FROM companies WHERE owner_user_id = ?', [employer.id]);
  if (!company) {
    const inserted = db.run(
      `INSERT INTO companies
       (owner_user_id, name, legal_name, email, city, notification_email, is_verified)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [employer.id, 'Demo Company KS', 'Demo Company ShPK', employerEmail, 'Prishtine', employerEmail, 1]
    );
    company = { id: inserted.lastInsertId, name: 'Demo Company KS' };
    db.run(
      'INSERT OR IGNORE INTO employer_members (company_id, user_id, member_role, accepted_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP)',
      [company.id, employer.id, 'recruiter']
    );
  }

  const jobsCount = db.get('SELECT COUNT(*) AS count FROM jobs WHERE company_id = ?', [company.id])?.count || 0;
  if (jobsCount === 0) {
    for (const job of sampleJobs) {
      db.run(
        `INSERT INTO jobs
         (title, company, company_id, location, positions, is_new, description, status, employment_type, experience_level, work_mode, currency, required_skills_json)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          job.title,
          company.name,
          company.id,
          job.location,
          job.positions,
          1,
          job.description,
          'active',
          job.employmentType,
          job.experienceLevel,
          job.workMode,
          'EUR',
          JSON.stringify([])
        ]
      );
    }
  }

  const seekerEmail = 'demo.seeker@platforma.local';
  let seeker = db.get('SELECT id FROM users WHERE email = ?', [seekerEmail]);
  if (!seeker) {
    const passwordHash = await bcrypt.hash('Seeker123!', 10);
    const inserted = db.run(
      'INSERT INTO users (name, phone, email, password, role, password_hash, is_email_verified, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      ['Demo Seeker', '+38344222222', seekerEmail, '__legacy_placeholder__', ROLES.JOB_SEEKER, passwordHash, 1, 'active']
    );
    seeker = { id: inserted.lastInsertId };
  }

  const seekerProfile = db.get('SELECT id FROM job_seeker_profiles WHERE user_id = ?', [seeker.id]);
  if (!seekerProfile) {
    db.run(
      'INSERT INTO job_seeker_profiles (user_id, city, skills_json, profile_completion) VALUES (?, ?, ?, ?)',
      [seeker.id, 'Prishtine', JSON.stringify(['javascript', 'react']), 45]
    );
  }
}
