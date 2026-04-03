import { Router } from 'express';
import nodemailer from 'nodemailer';
import { body, validationResult } from 'express-validator';
import { env } from '../config/env.js';

const router = Router();

router.post('/contact', [
    body('name').trim().notEmpty().withMessage('Emri është i detyrueshëm.'),
    body('email').isEmail().withMessage('Email-i duhet të jetë valid.'),
    body('message').trim().notEmpty().withMessage('Mesazhi është i detyrueshëm.')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: 'Të dhënat nuk janë valide.',
            errors: errors.array()
        });
    }

    const { name, email, message } = req.body;

    if (!env.EMAIL_USER || !env.EMAIL_PASS) {
        console.error('Email configuration missing');
        return res.status(500).json({
            success: false,
            message: 'Konfigurimi i serverit është i paplotë (Mungon EMAIL_USER/PASS).'
        });
    }

    try {
        // Konfigurimi i transportit (Generic SMTP preferohet mbi 'service: gmail' për fleksibilitet)
        const transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',         // Default ne Gmail sipas kerkeses
            port: 587,
            secure: false,                  // true për 465, false për të tjerat
            auth: {
                user: env.EMAIL_USER,
                pass: env.EMAIL_PASS
            }
        });

        // Opsionale: Verifiko lidhjen
        await transporter.verify();

        const mailOptions = {
            from: `"WorkPulse Contact" <${env.EMAIL_USER}>`,
            replyTo: email,
            to: env.ADMIN_EMAIL || env.EMAIL_USER,
            subject: 'WorkPulse - Contact',
            text: `Mesazh i ri nga: ${name}\nEmail: ${email}\n\nMesazhi:\n${message}`,
            html: `
            <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333; background-color: #f9fafb;">
                <div style="background: linear-gradient(135deg, #2563eb, #3b82f6); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
                    <h1 style="color: white; margin: 0; font-size: 24px; letter-spacing: 1px;">WorkPulse</h1>
                    <p style="color: rgba(255,255,255,0.8); margin: 5px 0 0 0;">Njoftim i ri nga forma e kontaktit</p>
                </div>
                
                <div style="background: white; padding: 30px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
                    <div style="margin-bottom: 25px; border-left: 4px solid #2563eb; padding-left: 15px;">
                        <span style="display: block; font-size: 12px; color: #6b7280; text-transform: uppercase; font-weight: bold; margin-bottom: 4px;">Dërguesi</span>
                        <strong style="font-size: 18px; color: #111827;">${name}</strong>
                    </div>

                    <div style="margin-bottom: 25px; border-left: 4px solid #3b82f6; padding-left: 15px;">
                        <span style="display: block; font-size: 12px; color: #6b7280; text-transform: uppercase; font-weight: bold; margin-bottom: 4px;">Adresa Email</span>
                        <a href="mailto:${email}" style="font-size: 16px; color: #2563eb; text-decoration: none;">${email}</a>
                    </div>

                    <div style="margin-top: 30px; padding: 20px; background-color: #f3f4f6; border-radius: 8px;">
                        <span style="display: block; font-size: 12px; color: #6b7280; text-transform: uppercase; font-weight: bold; margin-bottom: 10px;">Mesazhi</span>
                        <p style="font-size: 15px; line-height: 1.6; color: #374151; white-space: pre-wrap; margin: 0;">${message}</p>
                    </div>

                    <div style="margin-top: 40px; border-top: 1px solid #e5e7eb; padding-top: 20px; text-align: center;">
                        <p style="font-size: 13px; color: #9ca3af;">Ky është një email automatik i gjeneruar nga sistemi i WorkPulse.</p>
                    </div>
                </div>
            </div>
            `
        };

        await transporter.sendMail(mailOptions);

        return res.status(200).json({
            success: true,
            message: 'Mesazhi u dërgua me sukses.'
        });

    } catch (error) {
        console.error('Nodemailer Error:', error);
        return res.status(500).json({
            success: false,
            message: 'Dërgimi i email-it dështoi. Provoni përsëri më vonë.'
        });
    }
});

export default router;
