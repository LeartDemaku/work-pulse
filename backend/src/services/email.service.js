import nodemailer from 'nodemailer';
import { env } from '../config/env.js';
import { dbClient } from '../db/client.js';

let transporter = null;

function ensureTransporter() {
  if (transporter) {
    return transporter;
  }

  if (!env.EMAIL_USER || !env.EMAIL_PASS) {
    return null;
  }

  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: env.EMAIL_USER,
      pass: env.EMAIL_PASS
    }
  });

  return transporter;
}

function wrapTemplate(templateKey, subject, bodyHtml, bodyText) {
  return {
    templateKey,
    subject,
    html: `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333; background-color: #f9fafb;">
          <div style="background: linear-gradient(135deg, #2563eb, #3b82f6); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 24px; letter-spacing: 1px;">WorkPulse</h1>
              <p style="color: rgba(255,255,255,0.8); margin: 5px 0 0 0; font-size: 14px;">${subject}</p>
          </div>
          
          <div style="background: white; padding: 30px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); border: 1px solid #e5e7eb; border-top: none;">
              ${bodyHtml}
              
              <div style="margin-top: 40px; border-top: 1px solid #e5e7eb; padding-top: 20px; text-align: center;">
                  <p style="font-size: 13px; color: #9ca3af;">Ky është një email automatik nga platforma WorkPulse.</p>
                  <div style="margin-top: 10px;">
                      <a href="${env.APP_ORIGIN}" style="color: #2563eb; text-decoration: none; font-size: 13px; font-weight: bold;">Vizitoni Webfaqen</a>
                  </div>
              </div>
          </div>
      </div>
    `,
    text: bodyText || ''
  };
}

export function buildEmailTemplate(templateKey, payload = {}) {
  const jobTitle = payload.jobTitle || 'Pozitë';
  const fullName = payload.fullName || 'Përdorues';
  const companyName = payload.companyName || 'WorkPulse';
  const status = payload.status || 'shpallur';
  const verificationToken = payload.verificationToken || '';
  const verificationUrl = payload.verificationUrl || `${env.APP_ORIGIN}/api/auth/verify-email?token=${encodeURIComponent(verificationToken)}`;
  const resetToken = payload.resetToken || '';
  const resetUrl = payload.resetUrl || `${env.APP_ORIGIN}/api/auth/reset-password?token=${encodeURIComponent(resetToken)}`;

  // Albanian mapping for status
  const statusLabels = {
    'submitted': 'Pranuar',
    'shortlisted': 'Në listë të ngushtë',
    'interview': 'Ftesë për Intervistë',
    'rejected': 'Refuzuar',
    'hired': 'Punësuar'
  };

  const displayStatus = statusLabels[status] || status;

  switch (templateKey) {
    case 'employer_verify_email':
      return wrapTemplate(
        templateKey,
        'Verifikimi i Email-it',
        `
          <p style="font-size: 16px; line-height: 1.6;">Përshëndetje <strong>${fullName}</strong>,</p>
          <p style="font-size: 16px; line-height: 1.6;">Ju falënderojmë që zgjodhët WorkPulse. Për të aktivizuar llogarinë tuaj të kompanisë dhe për të filluar me publikimin e vendeve të punës, ju lutemi verifikoni email-in tuaj.</p>
          <div style="text-align: center; margin: 35px 0;">
            <a href="${verificationUrl}" style="display:inline-block; background:#2563eb; color:#ffffff; text-decoration:none; padding:12px 25px; border-radius:8px; font-weight:600; font-size: 16px; box-shadow: 0 4px 6px rgba(37,99,235,0.2);">
              Verifiko Email-in
            </a>
          </div>
          <p style="font-size: 14px; color: #6b7280;">Nëse butoni nuk funksionon, mund të kopjoni dhe ngjitni këtë link në browser:</p>
          <p style="word-break: break-all; font-size: 13px;"><a href="${verificationUrl}" style="color: #2563eb;">${verificationUrl}</a></p>
        `,
        `Klikoni këtë link për verifikim: ${verificationUrl}`
      );
    case 'application_received':
      return wrapTemplate(
        templateKey,
        'Konfirmim i Aplikimit',
        `
          <p style="font-size: 16px; line-height: 1.6;">Përshëndetje <strong>${fullName}</strong>,</p>
          <p style="font-size: 16px; line-height: 1.6;">Ky është një konfirmim që aplikimi juaj për pozitën e punës është pranuar me sukses.</p>
          
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 25px 0;">
            <p style="margin: 0 0 10px 0;"><strong>Pozita:</strong> ${jobTitle}</p>
            <p style="margin: 0;"><strong>Kompania:</strong> ${companyName}</p>
          </div>
          
          <p style="font-size: 16px; line-height: 1.6;">Kompania do të shqyrtojë aplikimin tuaj dhe do t'ju njoftojë për hapat e radhës.</p>
        `,
        `Aplikimi juaj për ${jobTitle} në ${companyName} u pranua me sukses.`
      );
    case 'password_reset':
      return wrapTemplate(
        templateKey,
        'Rivendosja e Fjalëkalimit',
        `
          <p style="font-size: 16px; line-height: 1.6;">Përshëndetje <strong>${fullName}</strong>,</p>
          <p style="font-size: 16px; line-height: 1.6;">Kemi pranuar një kërkesë për të ndryshuar fjalëkalimin e llogarisë tuaj në WorkPulse. Nëse keni bërë këtë kërkesë, klikoni butonin më poshtë:</p>
          <div style="text-align: center; margin: 35px 0;">
            <a href="${resetUrl}" style="display:inline-block; background:#2563eb; color:#ffffff; text-decoration:none; padding:12px 25px; border-radius:8px; font-weight:600; font-size: 16px;">
              Rivendos Fjalëkalimin
            </a>
          </div>
          <p style="font-size: 14px; color: #6b7280;">Nëse nuk e keni kërkuar këtë, ju lutemi injoroni këtë email. Fjalëkalimi juaj do të mbetet i njëjtë.</p>
        `,
        `Rivendosni fjalëkalimin duke klikuar këtë link: ${resetUrl}`
      );
    case 'new_application_received':
      return wrapTemplate(
        templateKey,
        'Aplikim i Ri i Pranuar',
        `
          <p style="font-size: 16px; line-height: 1.6;">Përshëndetje,</p>
          <p style="font-size: 16px; line-height: 1.6;">Ju keni pranuar një aplikim të ri për shpalljen tuaj aktive.</p>
          
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 25px 0;">
            <p style="margin: 0 0 10px 0;"><strong>Pozita:</strong> ${jobTitle}</p>
            <p style="margin: 0;"><strong>Kandidati:</strong> ${fullName}</p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${env.APP_ORIGIN}/employer/applications" style="display:inline-block; background:#2563eb; color:#ffffff; text-decoration:none; padding:12px 25px; border-radius:8px; font-weight:600; font-size: 16px;">
              Shiko Aplikimin
            </a>
          </div>
        `,
        `Aplikim i ri për ${jobTitle} nga ${fullName}.`
      );
    case 'status_changed_shortlisted':
    case 'status_changed_interview':
    case 'status_changed_rejected':
    case 'status_changed_hired':
      const isInterview = templateKey === 'status_changed_interview';
      const mainMessage = isInterview
        ? 'Urime! Jeni përzgjedhur për intervistë për pozitën e punës.'
        : `Statusi i aplikimit tuaj për pozitën <strong>${jobTitle}</strong> ka ndryshuar.`;

      return wrapTemplate(
        templateKey,
        isInterview ? 'Ftesë për Intervistë' : 'Përditësim i Aplikimit',
        `
          <p style="font-size: 16px; line-height: 1.6;">Përshëndetje <strong>${fullName}</strong>,</p>
          <p style="font-size: 16px; line-height: 1.6;">${mainMessage}</p>
          
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 25px 0;">
            <p style="margin: 0 0 10px 0;"><strong>Pozita:</strong> ${jobTitle}</p>
            <p style="margin: 0;"><strong>Statusi i Ri:</strong> <span style="color: #2563eb; font-weight: bold;">${displayStatus}</span></p>
          </div>
          
          <p style="font-size: 16px; line-height: 1.6;">Kompania do t'ju kontaktojë së shpejti me detaje shtesë.</p>
        `,
        `Statusi i aplikimit tuaj për ${jobTitle} ka ndryshuar në: ${displayStatus}.`
      );
    case 'job_expiring_soon':
      return wrapTemplate(
        templateKey,
        'Njoftim për Skadimin e Shpalljes',
        `
          <p style="font-size: 16px; line-height: 1.6;">Përshëndetje,</p>
          <p style="font-size: 16px; line-height: 1.6;">Ju njoftojmë se afati për shpalljen tuaj të punës do të skadojë së shpejti.</p>
          
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 25px 0;">
            <p style="margin: 0;"><strong>Pozita:</strong> ${jobTitle}</p>
          </div>
          
          <p style="font-size: 16px; line-height: 1.6;">Ju mund të zgjasni afatin ose të filloni procesin e përzgjedhjes nga paneli i punëdhënësit.</p>
        `,
        `Shpallja për ${jobTitle} po skadon së shpejti.`
      );
    default:
      return wrapTemplate(
        templateKey,
        'Njoftim i Ri',
        `
          <p style="font-size: 16px; line-height: 1.6;">Përshëndetje,</p>
          <p style="font-size: 16px; line-height: 1.6;">Ju keni një njoftim të ri nga platforma WorkPulse.</p>
          <p style="font-size: 16px; line-height: 1.6;">Ju lutemi identifikohuni në llogarinë tuaj për të parë detajet.</p>
        `,
        'Ju keni një njoftim të ri nga WorkPulse.'
      );
  }
}


export async function sendEmail({ recipient, templateKey, relatedEntity = null, payload = {}, retries = 1 }) {
  const transport = ensureTransporter();

  if (!transport) {
    dbClient.run(
      'INSERT INTO email_logs (recipient, template_key, related_entity, status, error_message) VALUES (?, ?, ?, ?, ?)',
      [recipient || '', templateKey, relatedEntity, 'skipped', 'EMAIL_USER ose EMAIL_PASS mungon']
    );
    return { delivered: false, skipped: true };
  }

  const template = buildEmailTemplate(templateKey, payload);

  let lastError = null;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      await transport.sendMail({
        from: env.DEFAULT_FROM_EMAIL,
        to: recipient,
        subject: template.subject,
        html: template.html,
        text: template.text
      });

      dbClient.run(
        'INSERT INTO email_logs (recipient, template_key, related_entity, status, error_message) VALUES (?, ?, ?, ?, ?)',
        [recipient, templateKey, relatedEntity, 'sent', null]
      );

      return { delivered: true, skipped: false };
    } catch (error) {
      lastError = error;
    }
  }

  dbClient.run(
    'INSERT INTO email_logs (recipient, template_key, related_entity, status, error_message) VALUES (?, ?, ?, ?, ?)',
    [recipient, templateKey, relatedEntity, 'failed', lastError?.message || 'Gabim i panjohur ne dergim email-i']
  );

  return { delivered: false, skipped: false, error: lastError };
}
