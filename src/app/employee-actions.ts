
'use server';

import { getDb } from '@/lib/db';
import type { Employee } from '@/types';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';

const employeeSchema = z.object({
  id: z.string().optional(),
  employeeNumber: z.string().optional(),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  middleInitial: z.string().max(1).optional(),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  password: z.string().optional(),
  birthDate: z.date().optional().nullable(),
  startDate: z.date().optional().nullable(),
  lastPromotionDate: z.date().optional().nullable(),
  position: z.string().optional(),
  role: z.enum(['admin', 'manager', 'member']).optional(),
  group: z.string().optional(),
  avatar: z.string().optional(),
  signature: z.string().optional(),
  loadAllocation: z.coerce.number().optional(),
  reportsTo: z.string().optional().nullable(),
  visibility: z.object({
      schedule: z.boolean().optional(),
      onDuty: z.boolean().optional(),
      orgChart: z.boolean().optional(),
      mobileLoad: z.boolean().optional(),
  }).optional(),
});

// Helper to check for email uniqueness
async function isEmailUnique(email: string, currentId?: string): Promise<boolean> {
    const db = getDb();
    if (currentId) {
        // Correctly check for emails on OTHER records
        const row = db.prepare('SELECT id FROM employees WHERE email = ? AND id != ?').get(email, currentId);
        return !row;
    } else {
        // Check for any record with this email when creating a new user
        const row = db.prepare('SELECT id FROM employees WHERE email = ?').get(email);
        return !row;
    }
}

export async function addEmployee(employeeData: Partial<Employee>): Promise<{ success: boolean; error?: string; employee?: Employee }> {
    const validation = employeeSchema.safeParse(employeeData);
    if (!validation.success) {
        return { success: false, error: validation.error.errors.map(e => e.message).join(', ') };
    }
    
    const data = validation.data;

    if (!await isEmailUnique(data.email)) {
        return { success: false, error: 'Another user is already using this email address.' };
    }

    const db = getDb();
    try {
        const newEmployee: Employee = {
            id: uuidv4(),
            firstName: data.firstName,
            lastName: data.lastName,
            email: data.email,
            role: data.role || 'member',
            phone: data.phone || '',
            position: data.position || '',
            ...data,
            password: data.password || 'password', // Default password
        };

        const stmt = db.prepare(`
            INSERT INTO employees (id, employeeNumber, firstName, lastName, middleInitial, email, phone, password, position, role, "group", avatar, loadAllocation, birthDate, startDate, signature, visibility, lastPromotionDate, reportsTo)
            VALUES (@id, @employeeNumber, @firstName, @lastName, @middleInitial, @email, @phone, @password, @position, @role, @group, @avatar, @loadAllocation, @birthDate, @startDate, @signature, @visibility, @lastPromotionDate, @reportsTo)
        `);

        stmt.run({
            id: newEmployee.id,
            employeeNumber: newEmployee.employeeNumber || null,
            firstName: newEmployee.firstName,
            lastName: newEmployee.lastName,
            middleInitial: newEmployee.middleInitial || null,
            email: newEmployee.email,
            phone: newEmployee.phone || null,
            password: newEmployee.password,
            position: newEmployee.position || null,
            role: newEmployee.role,
            group: newEmployee.group || null,
            avatar: newEmployee.avatar || null,
            loadAllocation: newEmployee.loadAllocation || 0,
            birthDate: newEmployee.birthDate ? new Date(newEmployee.birthDate).toISOString() : null,
            startDate: newEmployee.startDate ? new Date(newEmployee.startDate).toISOString() : null,
            signature: newEmployee.signature || null,
            visibility: JSON.stringify(newEmployee.visibility || {}),
            lastPromotionDate: newEmployee.lastPromotionDate ? new Date(newEmployee.lastPromotionDate).toISOString() : null,
            reportsTo: newEmployee.reportsTo || null,
        });

        return { success: true, employee: newEmployee };

    } catch (error) {
        console.error('Failed to add employee:', error);
        return { success: false, error: (error as Error).message };
    }
}

export async function updateEmployee(employeeData: Partial<Employee>): Promise<{ success: boolean; error?: string; employee?: Partial<Employee> }> {
    if (!employeeData.id) {
        return { success: false, error: 'Employee ID is required for an update.' };
    }
    
    const validation = employeeSchema.safeParse(employeeData);
    if (!validation.success) {
        return { success: false, error: validation.error.errors.map(e => e.message).join(', ') };
    }
    
    const data = validation.data;
    const db = getDb();
    
    try {
        if (data.email) {
            if (!await isEmailUnique(data.email, data.id)) {
                 return { success: false, error: 'Another user is already using this email address.' };
            }
        }

        const getPasswordStmt = db.prepare('SELECT password FROM employees WHERE id = ?');
        
        let finalPassword = data.password;
        if (!finalPassword || finalPassword.trim() === '') {
            const existing = getPasswordStmt.get(data.id) as { password?: string } | undefined;
            finalPassword = existing?.password;
        }

        const stmt = db.prepare(`
            UPDATE employees SET
                employeeNumber = @employeeNumber,
                firstName = @firstName,
                lastName = @lastName,
                middleInitial = @middleInitial,
                email = @email,
                phone = @phone,
                password = @password,
                position = @position,
                role = @role,
                "group" = @group,
                avatar = @avatar,
                loadAllocation = @loadAllocation,
                birthDate = @birthDate,
                startDate = @startDate,
                signature = @signature,
                visibility = @visibility,
                lastPromotionDate = @lastPromotionDate,
                reportsTo = @reportsTo
            WHERE id = @id
        `);

        const updatedEmployee = { ...data, password: finalPassword };

        stmt.run({
            id: updatedEmployee.id,
            employeeNumber: updatedEmployee.employeeNumber || null,
            firstName: updatedEmployee.firstName,
            lastName: updatedEmployee.lastName,
            middleInitial: updatedEmployee.middleInitial || null,
            email: updatedEmployee.email,
            phone: updatedEmployee.phone || null,
            password: updatedEmployee.password,
            position: updatedEmployee.position || null,
            role: updatedEmployee.role,
            group: updatedEmployee.group || null,
            avatar: updatedEmployee.avatar || null,
            loadAllocation: updatedEmployee.loadAllocation || 0,
            birthDate: updatedEmployee.birthDate ? new Date(updatedEmployee.birthDate).toISOString() : null,
            startDate: updatedEmployee.startDate ? new Date(updatedEmployee.startDate).toISOString() : null,
            signature: updatedEmployee.signature || null,
            visibility: JSON.stringify(updatedEmployee.visibility || {}),
            lastPromotionDate: updatedEmployee.lastPromotionDate ? new Date(updatedEmployee.lastPromotionDate).toISOString() : null,
            reportsTo: updatedEmployee.reportsTo || null,
        });

        return { success: true, employee: updatedEmployee };

    } catch (error) {
        console.error('Failed to update employee:', error);
        if ((error as any).code === 'SQLITE_CONSTRAINT_UNIQUE') {
            return { success: false, error: 'Another user is already using this email address.' };
        }
        return { success: false, error: (error as Error).message };
    }
}
