
import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import initialDb from './db.json';

const DB_FILE = 'local.db';

// In a serverless environment, the filesystem is not guaranteed to be persistent.
// We check if the db exists, if not, we create it from the schema.
const dbExists = fs.existsSync(DB_FILE);

export const db = new Database(DB_FILE);

if (!dbExists) {
  console.log('No database found, creating a new one.');
  const schemaPath = path.join(process.cwd(), 'src', 'lib', 'schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf-8');
  db.exec(schema);
  console.log('Database schema loaded.');

  // Seed the database with initial data
  console.log('Seeding database with initial data...');
  try {
    const insertEmployee = db.prepare('INSERT INTO employees (id, employeeNumber, firstName, lastName, email, phone, password, position, role, groupName, avatar, loadAllocation, reportsTo, birthDate, startDate, signature, visibility) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
    const insertGroup = db.prepare('INSERT INTO groups (name) VALUES (?)');
    const insertShiftTemplate = db.prepare('INSERT INTO shift_templates (name, label, startTime, endTime, color, breakStartTime, breakEndTime, isUnpaidBreak) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
    const insertLeaveType = db.prepare('INSERT INTO leave_types (type, color) VALUES (?, ?)');
    const insertSmtpSettings = db.prepare('INSERT INTO smtp_settings (id, host, port, secure, user, pass, fromEmail, fromName) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');

    db.transaction(() => {
        // Seed Employees
        initialDb.employees.forEach(emp => {
            const visibility = emp.visibility || {};
            insertEmployee.run(
                emp.id,
                emp.employeeNumber,
                emp.firstName,
                emp.lastName,
                emp.email,
                emp.phone,
                emp.password,
                emp.position,
                emp.role,
                emp.group,
                emp.avatar,
                emp.loadAllocation,
                emp.reportsTo,
                emp.birthDate,
                emp.startDate,
                emp.signature,
                JSON.stringify(visibility)
            );
        });

        // Seed Groups
        initialDb.groups.forEach(group => {
            insertGroup.run(group);
        });
        
        // Seed Shift Templates
        initialDb.shiftTemplates.forEach(st => {
            insertShiftTemplate.run(st.name, st.label, st.startTime, st.endTime, st.color, st.breakStartTime, st.breakEndTime, st.isUnpaidBreak ? 1 : 0);
        });

        // Seed Leave Types
        initialDb.leaveTypes.forEach(lt => {
            insertLeaveType.run(lt.type, lt.color);
        });

        // Seed SMTP Settings
        if (initialDb.smtpSettings) {
            insertSmtpSettings.run(1, initialDb.smtpSettings.host, initialDb.smtpSettings.port, initialDb.smtpSettings.secure ? 1 : 0, initialDb.smtpSettings.user, initialDb.smtpSettings.pass, initialDb.smtpSettings.fromEmail, initialDb.smtpSettings.fromName);
        }

    })();
    
    console.log('Database seeded successfully.');
  } catch(error) {
    console.error('Failed to seed database:', error);
  }

} else {
    console.log('Connected to existing database.');
    // Migration for existing databases that might be missing the groups table
    try {
        const tableInfo = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='groups'").get();
        if (!tableInfo) {
            console.log("`groups` table not found. Creating and seeding it.");
            db.exec("CREATE TABLE IF NOT EXISTS groups (name TEXT PRIMARY KEY)");
            const insertGroup = db.prepare('INSERT INTO groups (name) VALUES (?)');
            db.transaction(() => {
                initialDb.groups.forEach(group => {
                    insertGroup.run(group);
                });
            })();
            console.log("`groups` table created and seeded successfully.");
        }
    } catch(e) {
        console.error("Error during database migration check:", e);
    }
}

// Gracefully close the database connection on exit
process.on('exit', () => db.close());
process.on('SIGHUP', () => process.exit(128 + 1));
process.on('SIGINT', () => process.exit(128 + 2));
process.on('SIGTERM', () => process.exit(128 + 15));
