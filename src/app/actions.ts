
'use server';

import type { SmtpSettings } from '@/types';
import nodemailer from 'nodemailer';

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

    const transporter = nodemailer.createTransport({
        host: smtpSettings.host,
        port: smtpSettings.port,
        secure: smtpSettings.secure,
        auth: (smtpSettings.user && smtpSettings.pass) ? {
            user: smtpSettings.user,
            pass: smtpSettings.pass,
        } : undefined,
    });

    try {
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
