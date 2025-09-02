
'use server';

import type { SmtpSettings, Employee } from '@/types';
import nodemailer from 'nodemailer';
import { db } from '@/lib/db';


type Attachment = {
    filename: string;
    content: string; // base64 encoded content
    contentType: string;
}

export async function sendEmail(
    { to, subject, htmlBody, attachments }: { to: string, subject: string, htmlBody: string, attachments?: Attachment[] },
    smtpSettings: SmtpSettings
) {
    if (!smtpSettings?.host || !smtpSettings?.port || !smtpSettings?.fromEmail || !smtpSettings?.fromName) {
        return { success: false, error: 'SMTP settings are not fully configured.' };
    }

    try {
        const transporter = nodemailer.createTransport({
            host: smtpSettings.host,
            port: smtpSettings.port,
            secure: smtpSettings.secure,
            auth: (smtpSettings.user && smtpSettings.pass) ? {
                user: smtpSettings.user,
                pass: smtpSettings.pass,
            } : undefined,
        });

        await transporter.verify();
        
        await transporter.sendMail({
            from: `"${smtpSettings.fromName}" <${smtpSettings.fromEmail}>`,
            to,
            subject,
            html: htmlBody,
            attachments: attachments?.map(att => ({
                filename: att.filename,
                content: att.content,
                encoding: 'base64',
                contentType: att.contentType,
            }))
        });
        
        return { success: true };

    } catch (error) {
        console.error('Email sending failed:', error);
        return { success: false, error: (error as Error).message };
    }
}


export async function verifyUser(email: string, password: string): Promise<{ success: boolean; user?: Employee; error?: string; }> {
    try {
        const stmt = db.prepare('SELECT * FROM employees WHERE email = ?');
        const userRow = stmt.get(email);

        if (userRow) {
            // Ensure we are working with a plain object
            const user = JSON.parse(JSON.stringify(userRow)) as Employee;
            
            // Now, the password comparison will be reliable.
            if (user.password === password) {
                return { success: true, user: user };
            }
        }
        
        // If userRow is null or password doesn't match
        return { success: false, error: 'Invalid email or password.' };

    } catch (error) {
        console.error('Login verification failed:', error);
        return { success: false, error: (error as Error).message };
    }
}
