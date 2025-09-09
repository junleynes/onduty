
'use server';

import type { SmtpSettings, Employee, Shift, AppVisibility, Leave } from '@/types';
import nodemailer from 'nodemailer';
import { getDb } from '@/lib/db';
import fs from 'fs';
import path from 'path';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { format, differenceInCalendarDays } from 'date-fns';


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
    // Hardcode check for the default admin user to bypass any potential DB issues.
    if (email.toLowerCase() === 'admin@onduty.local') {
        if (password === 'P@ssw0rd') {
            const adminUser: Employee = {
                id: "emp-admin-01",
                employeeNumber: "001",
                firstName: "Super",
                lastName: "Admin",
                email: "admin@onduty.local",
                password: "P@ssw0rd", // Ensure password is included in the returned object
                phone: "123-456-7890",
                position: "System Administrator",
                role: "admin",
                group: "Administration",
            };
            return { success: true, user: adminUser };
        } else {
            return { success: false, error: 'Invalid email or password.' };
        }
    }

    // Continue with database check for all other users.
    const db = getDb();
    try {
        const stmt = db.prepare('SELECT * FROM employees WHERE email = ?');
        const userRow = stmt.get(email);

        if (userRow) {
            // Ensure we are working with a plain object
            const user = JSON.parse(JSON.stringify(userRow)) as Employee;
            
            if (user.password === password) {
                return { success: true, user: user };
            }
        }
        
        return { success: false, error: 'Invalid email or password.' };

    } catch (error) {
        console.error('Login verification failed:', error);
        return { success: false, error: (error as Error).message };
    }
}

function safeParseJSON(jsonString: string | null | undefined, defaultValue: any) {
  if (!jsonString) return defaultValue;
  try {
    return JSON.parse(jsonString);
  } catch (e) {
    return defaultValue;
  }
}

export async function getPublicData(): Promise<{
    success: boolean;
    data?: { employees: Employee[], shifts: Shift[] };
    error?: string;
}> {
    const db = getDb();
    try {
        const allEmployees = db.prepare('SELECT * FROM employees').all() as any[];
        const allShifts = db.prepare('SELECT * FROM shifts').all() as any[];
        
        const processedEmployees: Employee[] = allEmployees.map(e => ({
            ...e,
            visibility: safeParseJSON(e.visibility, {}) as AppVisibility
        }));

        const visibleEmployees = processedEmployees.filter(e => e.visibility?.onDuty !== false);

        const publishedShifts = allShifts
            .map(s => ({
                ...s,
                date: new Date(s.date),
                isDayOff: s.isDayOff === 1,
                isHolidayOff: s.isHolidayOff === 1,
                isUnpaidBreak: s.isUnpaidBreak === 1,
            }))
            .filter(s => s.status === 'published' && !s.isDayOff && !s.isHolidayOff);

        return {
            success: true,
            data: {
                employees: visibleEmployees,
                shifts: publishedShifts,
            }
        };

    } catch (error) {
        console.error('Failed to fetch public data:', error);
        return { success: false, error: (error as Error).message };
    }
}

export async function resetToFactorySettings(): Promise<{ success: boolean; error?: string }> {
    const dbPath = path.join(process.cwd(), 'local.db');
    
    // Close the database connection if it's open.
    const dbModule = require('@/lib/db');
    if (dbModule.dbInstance && dbModule.dbInstance.open) {
        dbModule.dbInstance.close();
    }
    
    // Invalidate the singleton instance in db.ts
    dbModule.dbInstance = null;

    try {
        if (fs.existsSync(dbPath)) {
            fs.unlinkSync(dbPath);
        }
        return { success: true };
    } catch (error) {
        console.error('Failed to reset database:', error);
        return { success: false, error: (error as Error).message };
    }
}


export async function purgeData(dataType: 'users' | 'shiftTemplates' | 'holidays' | 'reportTemplates' | 'tasks' | 'mobileLoad' | 'leaveTypes' | 'groups'): Promise<{ success: boolean; error?: string }> {
    const db = getDb();
    try {
        switch (dataType) {
            case 'users':
                db.prepare("DELETE FROM employees WHERE role != 'admin' AND email != 'admin@onduty.local'").run();
                break;
            case 'shiftTemplates':
                db.prepare('DELETE FROM shift_templates').run();
                break;
            case 'holidays':
                db.prepare('DELETE FROM holidays').run();
                break;
            case 'reportTemplates':
                db.prepare("DELETE FROM key_value_store WHERE key LIKE '%Template'").run();
                break;
            case 'tasks':
                db.prepare('DELETE FROM tasks').run();
                break;
            case 'mobileLoad':
                db.prepare('DELETE FROM communication_allowances').run();
                db.prepare("UPDATE employees SET loadAllocation = 0").run();
                break;
            case 'leaveTypes':
                db.prepare('DELETE FROM leave_types').run();
                break;
            case 'groups':
                db.prepare("UPDATE employees SET 'group' = NULL").run();
                db.prepare('DELETE FROM groups').run();
                break;
            default:
                return { success: false, error: 'Invalid data type specified for purging.' };
        }
        return { success: true };
    } catch (error) {
        console.error(`Failed to purge ${dataType}:`, error);
        return { success: false, error: (error as Error).message };
    }
}

export async function generateLeavePdf(leaveRequest: Leave): Promise<{ success: boolean; pdfDataUri?: string; error?: string; }> {
    const db = getDb();
    try {
        const templateData = db.prepare("SELECT value FROM key_value_store WHERE key = 'alafTemplate'").get() as { value: string } | undefined;
        if (!templateData || !templateData.value) {
            return { success: false, error: "ALAF template not found. Please upload one in the Reports section." };
        }

        const employee = db.prepare("SELECT * FROM employees WHERE id = ?").get(leaveRequest.employeeId) as Employee | undefined;
        if (!employee) {
            return { success: false, error: "Employee not found." };
        }

        const manager = leaveRequest.managedBy ? db.prepare("SELECT * FROM employees WHERE id = ?").get(leaveRequest.managedBy) as Employee | undefined : undefined;

        const templateBytes = Buffer.from(templateData.value, 'base64');
        const pdfDoc = await PDFDocument.load(templateBytes);
        const form = pdfDoc.getForm();

        const totalDays = differenceInCalendarDays(new Date(leaveRequest.endDate), new Date(leaveRequest.startDate)) + 1;

        const fields = {
            employee_name: `${employee.firstName} ${employee.lastName}`,
            date_filed: format(new Date(leaveRequest.dateFiled), 'yyyy-MM-dd'),
            department: leaveRequest.department || '',
            employee_id: leaveRequest.idNumber || '',
            leave_dates: `${format(new Date(leaveRequest.startDate), 'yyyy-MM-dd')} to ${format(new Date(leaveRequest.endDate), 'yyyy-MM-dd')}`,
            total_days: String(totalDays),
            reason: leaveRequest.reason || '',
            contact_info: leaveRequest.contactInfo || '',
            approval_date: leaveRequest.managedAt ? format(new Date(leaveRequest.managedAt), 'yyyy-MM-dd') : '',
        };

        for (const [fieldName, fieldValue] of Object.entries(fields)) {
            try {
                const field = form.getTextField(fieldName);
                field.setText(fieldValue);
            } catch (e) {
                console.warn(`Could not find or set text field: ${fieldName}`);
            }
        }
        
        // Handle Leave Type Checkbox
        try {
            const checkbox = form.getCheckBox(leaveRequest.type);
            checkbox.check();
        } catch (e) {
            console.warn(`Could not find checkbox for leave type: "${leaveRequest.type}".`);
        }
        
        // Handle Approval Status Checkbox
        try {
            const statusCheckboxName = leaveRequest.status; // 'approved' or 'rejected'
            const statusCheckbox = form.getCheckBox(statusCheckboxName);
            statusCheckbox.check();
        } catch (e) {
            console.warn(`Could not find checkbox for approval status: "${leaveRequest.status}". Trying to set "approval_status" text field as fallback.`);
            // Fallback to setting the text field if the checkbox isn't found
            try {
                form.getTextField('approval_status').setText(leaveRequest.status.toUpperCase());
            } catch (textFieldError) {
                 console.warn(`Could not find fallback text field "approval_status" either.`);
            }
        }


        // Handle signatures
        if (leaveRequest.employeeSignature) {
            try {
                const signatureField = form.getButton('employee_signature');
                const pngImage = await pdfDoc.embedPng(leaveRequest.employeeSignature);
                signatureField.setImage(pngImage);
            } catch (e) {
                console.warn("Could not find or set employee signature field: employee_signature");
            }
        }
        
        if (leaveRequest.managerSignature) {
            try {
                const signatureField = form.getButton('manager_signature');
                const pngImage = await pdfDoc.embedPng(leaveRequest.managerSignature);
                signatureField.setImage(pngImage);
            } catch (e) {
                console.warn("Could not find or set manager signature field: manager_signature");
            }
        }

        form.flatten(); // Make fields non-editable

        const pdfBytes = await pdfDoc.save();
        const pdfDataUri = `data:application/pdf;base64,${Buffer.from(pdfBytes).toString('base64')}`;

        return { success: true, pdfDataUri };

    } catch (error: any) {
        console.error('Failed to generate PDF:', error);
        return { success: false, error: error.message };
    }
}
