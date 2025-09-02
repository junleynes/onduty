
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
        const user = stmt.get(email) as Employee | undefined;

        if (user && user.password === password) {
            // Make sure to return a plain object, not a class instance
            const userObject = JSON.parse(JSON.stringify(user));
            return { success: true, user: userObject };
        } else {
            return { success: false, error: 'Invalid email or password.' };
        }
    } catch (error) {
        console.error('Login verification failed:', error);
        return { success: false, error: (error as Error).message };
    }
}
